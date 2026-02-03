import prismaClient from "@/src/db/prismaClient.js"

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
    const reviewCheckResult = await prismaClient.review_check.findMany({
        where: {
            assigned_session_student: {
                session: { syllabus: { studentSyllabuses: { some: { student_id, syllabus_id } } } },
            },
        },
    })

    return reviewCheckResult
}
