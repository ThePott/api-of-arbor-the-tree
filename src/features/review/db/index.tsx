import prismaClient from "@/src/db/prismaClient.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import type { QuestionIdToInfoForApi } from "../types/index.js"
import type { bookWhereInput, questionWhereInput, stepWhereInput, topicWhereInput } from "@/generated/prisma/models.js"

type DbReviewCheckFindManyProps = {
    user_id: bigint
    student_id: bigint
    syllabus_id: bigint
    review_assignment_id: bigint | null
}
// NOTE: 그 문제집의 오답과제를 가져와야 함
export const dbReviewCheckFindMany = async ({
    user_id,
    student_id,
    syllabus_id,
    review_assignment_id,
}: DbReviewCheckFindManyProps) => {
    if (review_assignment_id) throw ApiError.Internal("---- CURRENTLY NOT HANDLING CHECKING ASSIGNMENT")

    const result = await prismaClient.book.findFirst({
        where: { syllabi: { some: { id: syllabus_id, user_id } } },
        select: {
            title: true,
            topics: {
                select: {
                    order: true,
                    title: true,
                    steps: {
                        select: {
                            order: true,
                            title: true,
                            questions: {
                                select: {
                                    order: true,
                                    id: true,
                                    name: true,
                                    page: true,
                                    reviewChecks: {
                                        where: {
                                            student_id,
                                            session: { syllabus_id },
                                        },
                                    },
                                    sessionQuestions: {
                                        where: {
                                            session: {
                                                syllabus_id,
                                            },
                                        },
                                        select: {
                                            session: {
                                                select: {
                                                    id: true,
                                                    assignedSessionStudents: true,
                                                    assignedSessionClassrooms: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    return result
}

type DbReviewCheckBulkWriteProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
    changedReviewChecks: QuestionIdToInfoForApi // NOTE: already converted to bigint except for question_id(key)
}
export const dbReviewCheckBulkWrite = async ({
    user_id: _user_id,
    classroom_id,
    student_id,
    changedReviewChecks,
}: DbReviewCheckBulkWriteProps) => {
    const entryArray = Object.entries(changedReviewChecks)
    const entryArrayForUpsert = entryArray.filter(([_, { status }]) => status)
    const entryArrayForDelete = entryArray.filter(([_, { status }]) => !status)

    // TODO
    // TODO: validate assigned_session_student is from user_id's hagwon as principal
    // TODO
    const upsertPromiseArray = entryArrayForUpsert.map(([question_id, { status, session_id }]) => {
        if (!status) throw ApiError.Internal("오답 체크 필터링 중 오류가 발생했어요")
        return prismaClient.review_check.upsert({
            where: {
                session_id_student_id_question_id: {
                    student_id,
                    question_id: BigInt(question_id),
                    session_id,
                },
            },
            update: { status },
            create: {
                session_id,
                student_id,
                status,
                question_id: BigInt(question_id),
            },
        })
    })
    const deletePromiseArray = entryArrayForDelete.map(([question_id, { session_id }]) => {
        return prismaClient.review_check.delete({
            where: {
                session_id_student_id_question_id: {
                    student_id,
                    question_id: BigInt(question_id),
                    session_id,
                },
            },
        })
    })
    const [upserted, deleted] = await Promise.all([Promise.all(upsertPromiseArray), Promise.all(deletePromiseArray)])

    const sessionIdSet = new Set(entryArray.map(([_, { session_id }]) => session_id))
    const sessionIdArray = [...sessionIdSet]
    const sessionResult = await prismaClient.session.findMany({
        where: {
            id: { in: sessionIdArray },
        },
        select: {
            id: true,
            reviewChecks: {
                where: { student_id },
                select: { id: true },
            },
            sessionQuestions: {
                select: {
                    question_id: true,
                },
            },
        },
    })
    const completedSessionIdArray = sessionResult
        .filter((session) => {
            if (session.sessionQuestions.length === 0) return false
            return session.reviewChecks.length === session.sessionQuestions.length
        })
        .map((session) => session.id)
    const uncompletedSessionIdArray = sessionResult
        .filter((session) => {
            if (session.sessionQuestions.length === 0) return false
            return session.reviewChecks.length < session.sessionQuestions.length
        })
        .map((session) => session.id)
    const completedPromise = prismaClient.completed_session_student.createManyAndReturn({
        data: completedSessionIdArray.map((session_id) => ({ session_id, student_id, classroom_id })),
    })
    const uncompletedPromise = prismaClient.completed_session_student.deleteMany({
        where: {
            student_id,
            session_id: { in: uncompletedSessionIdArray },
        },
    })
    const [completed, uncompleted] = await Promise.all([completedPromise, uncompletedPromise])

    return {
        upserted,
        deleted,
        completed,
        uncompleted,
        sessionIdArray,
        completedSessionIdArray,
        uncompletedSessionIdArray,
    }
}

type DbReviewCheckForAssignmentFindManyProps = {
    user_id: bigint
    student_id: bigint
    classroom_id: bigint | null
}
export const dbReviewCheckForAssignmentFindMany = async ({
    user_id,
    student_id,
    classroom_id,
}: DbReviewCheckForAssignmentFindManyProps) => {
    // TODO: 나 오답 체크 할 거야
    // TODO: 어떤 오답? -> 생성일, 배부일(다르다면, include 하면 됨), 문항 수(include, length하면 됨), 문제집-> 죄다 include, 정리하면 됨 << 그런데 각 문제를 너무 깊게 join 해야 하나?
    // TODO: 그 안의 문제들은 생성 당시의 order에 맞게 있어야 함 <<< 그 보장이 없는 것 같은데
    // TODO: 아니야 이렇게 되어선 안 돼. 이러면 다른 오답과제들이어도 하나의 문제집으로 묶인다.
    // TODO: 오답과제를 문제집 별로 정렬해야 하는 거지, 그 반대가 되어선 안 된다
    //
    // assignment를 만들 때 pdf에 맞춰 order 부여 <<< 이걸로 하자
    const result = await prismaClient.review_assignment.findMany({
        where: {
            classroom_id,
            student_id,
            student: { hagwon: { principal: { user_id } } },
        },
        include: {
            reviewAssignmentQuestions: {
                orderBy: {},
            },
        },
    })
    return result
}

// type FilterForAssignmentProps = {
//     source: "topic" | "step" | "question" | "book"
//     student_id: bigint
//     classroom_id: bigint | null
// }
// function filterForAssignment(props: { source: "book"; student_id: bigint; classroom_id: bigint | null }): bookWhereInput
// function filterForAssignment(props: {
//     source: "topic"
//     student_id: bigint
//     classroom_id: bigint | null
// }): topicWhereInput
// function filterForAssignment(props: { source: "step"; student_id: bigint; classroom_id: bigint | null }): stepWhereInput
// function filterForAssignment(props: {
//     source: "question"
//     student_id: bigint
//     classroom_id: bigint | null
// }): questionWhereInput
// function filterForAssignment({ source, student_id, classroom_id }: FilterForAssignmentProps) {
//     const questionFilter: questionWhereInput = {
//         reviewChecks: {
//             some: {
//                 reviewAssignmentQuestions: {
//                     some: {
//                         review_assignment: {
//                             student_id,
//                             classroom_id,
//                         },
//                     },
//                 },
//             },
//         },
//     }
//     if (source === "question") return questionFilter
//
//     const stepFilter: stepWhereInput = { questions: { some: { ...questionFilter } } }
//     if (source === "step") return stepFilter
//
//     const topicFilter: topicWhereInput = { steps: { some: { ...stepFilter } } }
//     if (source === "topic") return topicFilter
//
//     const bookFilter: bookWhereInput = { topics: { some: { ...topicFilter } } }
//     return bookFilter
// }
// const result = await prismaClient.book.findMany({
//     where: {
//         ...filterForAssignment({ source: "book", classroom_id, student_id }),
//         user_id,
//     },
//     include: {
//         topics: {
//             where: {
//                 ...filterForAssignment({ source: "topic", classroom_id, student_id }),
//             },
//             include: {
//                 steps: {
//                     where: {
//                         ...filterForAssignment({ source: "step", classroom_id, student_id }),
//                     },
//                     include: {
//                         questions: {
//                             where: {
//                                 ...filterForAssignment({ source: "question", classroom_id, student_id }),
//                             },
//                             select: {
//                                 reviewChecks: {
//                                     where: {
//                                         reviewAssignmentQuestions: {
//                                             some: {
//                                                 review_assignment: {
//                                                     classroom_id,
//                                                     student_id,
//                                                     completed_at: { not: {} },
//                                                 },
//                                             },
//                                         },
//                                     },
//                                     include: {
//                                         reviewAssignmentQuestions: {
//                                             where: {
//                                                 review_assignment: {
//                                                     classroom_id,
//                                                     student_id,
//                                                     completed_at: { not: {} },
//                                                 },
//                                             },
//                                         },
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//         },
//     },
// })
