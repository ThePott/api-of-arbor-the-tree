import prismaClient from "@/src/db/prismaClient.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import type { QuestionIdToInfoForApi } from "../types/index.js"

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

    const bookPromise = prismaClient.book.findFirst({
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
                                                    assignedSessionStudents: true,
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

    const [bookResult] = await Promise.all([bookPromise])

    return { bookResult }
}

type DbReviewCheckBulkWriteProps = {
    user_id: bigint
    student_id: bigint
    changedReviewChecks: QuestionIdToInfoForApi // NOTE: already converted to bigint except for question_id(key)
}
export const dbReviewCheckBulkWrite = async ({
    user_id: _user_id,
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
    return { upserted, deleted }
}
