import prismaClient from "@/src/db/prismaClient.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import type { IdToChangedInfo } from "../types/index.js"
import { convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"

// NOTE: syllabus __그 문제집의 오답과제를 가져와야 함
type DbReviewCheckFindManyProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
    syllabus_id: bigint
}
export const dbReviewCheckFindMany = async ({
    user_id,
    classroom_id,
    student_id,
    syllabus_id,
}: DbReviewCheckFindManyProps) => {
    const result = await prismaClient.book.findFirst({
        where: { syllabi: { some: { id: syllabus_id, user_id } } },
        include: {
            topics: {
                orderBy: { order: "asc" },
                include: {
                    steps: {
                        orderBy: { order: "asc" },
                        include: {
                            questions: {
                                orderBy: { order: "asc" },
                                include: {
                                    questionAttempts: {
                                        where: {
                                            student_id,
                                            classroom_id,
                                            session: { syllabus_id },
                                        },
                                        include: { child_attempt: true },
                                    },
                                    sessionQuestions: {
                                        where: { session: { syllabus_id } },
                                        include: {
                                            session: {
                                                include: {
                                                    ...(classroom_id && {
                                                        assignedSessionClassrooms: {
                                                            where: {
                                                                classroom_id,
                                                                session: { syllabus_id },
                                                            },
                                                        },
                                                    }),
                                                    ...(!classroom_id && {
                                                        assignedSessionStudents: {
                                                            where: {
                                                                student_id,
                                                                session: { syllabus_id },
                                                            },
                                                        },
                                                    }),
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
    idToChangedInfo: IdToChangedInfo<"api", "session"> // NOTE: already converted to bigint except for question_id(key)
}
export const dbReviewCheckBulkWrite = async ({
    user_id: _user_id,
    classroom_id,
    student_id,
    idToChangedInfo,
}: DbReviewCheckBulkWriteProps) => {
    const entryArray = Object.entries(idToChangedInfo)
    const entryArrayForUpsert = entryArray.filter(([_, { status }]) => status)
    const entryArrayForDelete = entryArray.filter(([_, { status }]) => !status)

    // TODO
    // TODO: validate assigned_session_student is from user_id's hagwon as principal
    // TODO
    const upsertPromiseArray = entryArrayForUpsert.map(([question_id, { status, session_id }]) => {
        if (!status) throw ApiError.Internal("오답 체크 필터링 중 오류가 발생했어요")
        return prismaClient.question_attempt.upsert({
            where: {
                student_id_question_id_session_id: {
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
        return prismaClient.question_attempt.delete({
            where: {
                student_id_question_id_session_id: {
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
        include: {
            sessionQuestions: true,
            questionAttempts: {
                where: {
                    classroom_id,
                    student_id,
                    status: { not: {} },
                },
            },
            // NOTE: 내가 이미 끝냈는지 확인
            completedSessionStudents: {
                where: { student_id },
            },
        },
    })
    // NOTE: 이미 완료가 되었다면 또 만들어선 안 된다 << unique constraint에 걸림
    const completedSessionIdArray = sessionResult
        .filter(
            (session) =>
                session.questionAttempts.length === session.sessionQuestions.length &&
                session.completedSessionStudents.length === 0
        )
        .map((session) => session.id)
    const uncompletedSessionIdArray = sessionResult
        .filter((session) => session.questionAttempts.length < session.sessionQuestions.length)
        .map((session) => session.id)

    const completedPromise = prismaClient.completed_session_student.createManyAndReturn({
        data: completedSessionIdArray.map((session_id) => ({ session_id, student_id })),
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

type DbReviewCheckAssignmentBulkWriteProps = {
    user_id: bigint
    student_id: bigint
    idToChangedInfo: IdToChangedInfo<"api", "assignment"> // NOTE: already converted to bigint except for question_id(key)
}
export const dbReviewCheckAssignmentBulkWrite = async ({
    user_id, // TODO: need to validate using it
    student_id,
    idToChangedInfo,
}: DbReviewCheckAssignmentBulkWriteProps) => {
    const entryArray = Object.entries(idToChangedInfo)

    // NOTE: review_assignment_question은 이미 만들어져있다
    // NOTE: 언제나 update or delete만 한다. 이미 만들어져있기 때문에 assignment_id는 불필요하다 << result에서 추출도 바로 가능하니 더더욱 불필요하다
    // TODO: review_check_id가 필요하다
    const updatePromiseArray = entryArray.map(([review_assignment_question_id, { status }]) => {
        return prismaClient.review_assignment_question.update({
            where: {
                id: convertToBigIntOrThrow(review_assignment_question_id),
                review_assignment: { student: { id: student_id, hagwon: { principal: { user_id } } } },
            },
            data: { status, completed_at: new Date() },
        })
    })
    const updateResult = await Promise.all(updatePromiseArray)

    const assignmentIdSet = new Set(updateResult.map(({ review_assignment_id }) => review_assignment_id))
    const assignmentIdArray = [...assignmentIdSet]
    const assignmentResult = await prismaClient.review_assignment.findMany({
        where: {
            id: { in: assignmentIdArray },
        },
        include: {
            reviewAssignmentQuestions: {
                where: { review_check: { student: { id: student_id, hagwon: { principal: { user_id } } } } },
            },
        },
    })
    // NOTE: 이미 완료가 되었다면 또 만들어선 안 된다 << unique constraint에 걸림 << upsert로 해결하자 << 아니야 그러면 createMany를 못 한다. upsertMany는 없다
    // NOTE: 하지만 지금은 이미 만들어진 assginment를 수정하는 것이라 일일이 map -> update해야 함
    const completedAssignmentIdArray = assignmentResult
        .filter((assignment) => {
            return (
                assignment.reviewAssignmentQuestions.length ===
                assignment.reviewAssignmentQuestions.filter((assignmentQuestion) => assignmentQuestion.status).length
            )
        })
        .map((assignment) => assignment.id)
    const uncompletedAssignmentIdArray = assignmentResult
        .filter((assignment) => {
            return (
                assignment.reviewAssignmentQuestions.length !==
                assignment.reviewAssignmentQuestions.filter((assignmentQuestion) => assignmentQuestion.status).length
            )
        })
        .map((assignment) => assignment.id)

    const completedPromise = completedAssignmentIdArray.map((assignment_id) =>
        prismaClient.review_assignment.update({
            where: { id: assignment_id },
            data: { completed_at: new Date() },
        })
    )
    const uncompletedPromise = uncompletedAssignmentIdArray.map((assignment_id) =>
        prismaClient.review_assignment.update({
            where: { id: assignment_id },
            data: { completed_at: null },
        })
    )
    const [completed, uncompleted] = await Promise.all([Promise.all(completedPromise), Promise.all(uncompletedPromise)])

    return {
        updateResult,
        completed,
        uncompleted,
        assignmentIdArray,
        completedAssignmentIdArray,
        uncompletedAssignmentIdArray,
    }
}
