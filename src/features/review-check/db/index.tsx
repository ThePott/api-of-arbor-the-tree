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
                    title: true,
                    steps: { select: { title: true, questions: { select: { id: true, name: true, page: true } } } },
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
