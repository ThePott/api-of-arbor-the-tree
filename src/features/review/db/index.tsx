import type { review_check_status } from "@/generated/prisma/enums.js"
import prismaClient from "@/src/db/prismaClient.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

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

    const reviewCheckPromise = prismaClient.review_check.findMany({
        where: {
            assigned_session_student: {
                session: { syllabus: { studentSyllabuses: { some: { student_id, syllabus_id } } } },
                student: { hagwon: { principal: { user_id } } },
            },
        },
    })

    const bookPromise = prismaClient.book.findFirst({
        where: { syllabi: { some: { id: syllabus_id } } },
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
                                            assigned_session_student: {
                                                student_id,
                                                session: { syllabus_id },
                                            },
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

    const [reviewCheckResult, bookResult] = await Promise.all([reviewCheckPromise, bookPromise])

    return { reviewCheckResult, bookResult }
}

type DbReviewCheckCreateProps = {
    user_id: bigint
    student_id: bigint
    syllabus_id: bigint
    question_id: bigint
    status: review_check_status
}
export const dbReviewCheckCreate = async ({
    user_id,
    student_id,
    syllabus_id,
    question_id,
    status,
}: DbReviewCheckCreateProps) => {
    const assignedSessionStudentResult = await prismaClient.assigned_session_student.findFirstOrThrow({
        where: { student_id, session: { syllabus_id }, student: { hagwon: { principal: { user_id } } } },
    })
    const result = await prismaClient.review_check.create({
        data: { status, question_id, assigned_session_student_id: assignedSessionStudentResult.id },
    })

    return result
}

type DbReviewCheckUpdateProps = {
    user_id: bigint
    review_check_id: bigint
    status: review_check_status
}
export const dbReviewCheckUpdate = async ({ user_id, review_check_id, status }: DbReviewCheckUpdateProps) => {
    const result = await prismaClient.review_check.update({
        where: { id: review_check_id, assigned_session_student: { student: { hagwon: { principal: { user_id } } } } },
        data: { status },
    })

    return result
}

type DbReviewCheckDeleteProp = {
    user_id: bigint
    review_check_id: bigint
}
export const dbReviewCheckDelete = async ({ user_id, review_check_id }: DbReviewCheckDeleteProp) => {
    const result = await prismaClient.review_check.delete({
        where: { id: review_check_id, assigned_session_student: { student: { hagwon: { principal: { user_id } } } } },
    })
    return result
}

export type QuestionIdToInfo = Record<
    string, // NOTE: question_id
    {
        status: review_check_status | null // NOTE: use to delete if null
        review_check_id: bigint | null
        assigned_session_student_id: bigint
    }
>
type DbReviewCheckBulkWriteProps = {
    user_id: bigint
    changedReviewChecks: QuestionIdToInfo
}
export const dbReviewCheckBulkWrite = async ({ user_id, changedReviewChecks }: DbReviewCheckBulkWriteProps) => {
    const entryArray = Object.entries(changedReviewChecks)
    const entryArrayForCreate = entryArray.filter(([_, { status, review_check_id }]) => !review_check_id && status)
    const entryArrayForUpdate = entryArray.filter(([_, { status, review_check_id }]) => review_check_id && status)
    const entryArrayForDelete = entryArray.filter(([_, { status, review_check_id }]) => review_check_id && !status)

    // TODO
    // TODO: validate assigned_session_student is from user_id's hagwon as principal
    // TODO
    const createData = Object.entries(changedReviewChecks).map(
        ([question_id, { status, assigned_session_student_id }]) => {
            if (!status) throw ApiError.Internal("오답 체크 필터링 중 오류가 발생했어요")
            return {
                assigned_session_student_id,
                status,
                question_id: BigInt(question_id),
            }
        }
    )
    const createPromise = await prismaClient.review_check.createMany({
        data: createData,
    })
}
