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
    // TODO: 문제집 이름 넣어서 줘야
    const result = await prismaClient.review_assignment.findMany({
        where: {
            classroom_id,
            student_id,
            student: { hagwon: { principal: { user_id } } },
        },
        include: {
            reviewAssignmentQuestions: {
                orderBy: { order: "asc" },
                include: {
                    review_check: {
                        select: {
                            question: {
                                select: {
                                    step: { select: { topic: { select: { book: { select: { title: true } } } } } },
                                },
                            },
                        },
                    },
                },
            },
            assignedReviewAssignment: true,
        },
    })
    return result
}
