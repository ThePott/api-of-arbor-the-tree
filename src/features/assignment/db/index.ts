import prismaClient from "@/src/db/prismaClient.js"
import type { session_status } from "@/generated/prisma/enums.js"
import findManyBooksWithAttempts from "@/src/shared/queries/find-many-books-with-attempts.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import { findManyBooksFromAssignment } from "@/src/shared/queries/find-many-books-from-assignment-id.js"

// NOTE: AssignmentMetaInfo 만드는 데에 사용됨
type DbAssignmentFindManyAssignmentProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
}
export const dbAssignmentFindManyAssignment = async ({
    user_id,
    classroom_id,
    student_id,
}: DbAssignmentFindManyAssignmentProps) => {
    // TODO: review_assignment에 들어있는 bookTitleArray가 필요하다
    const assignmentResult = await prismaClient.review_assignment.findMany({
        where: {
            student_id,
            classroom_id,
            student: { hagwon: { principal: { user_id } } },
        },
        include: {
            question_attempts: true,
        },
    })

    const bookIdsArray = assignmentResult.map(({ book_ids }) => book_ids)
    const bookTitleArrayArrayPromise = bookIdsArray.map((bookIds) =>
        prismaClient.book.findMany({ where: { id: { in: bookIds } }, select: { title: true } })
    )
    const bookTitleArrayArray = await Promise.all(bookTitleArrayArrayPromise)

    const result = assignmentResult.map((assignment, index) => ({
        ...assignment,
        bookTitleArray: bookTitleArrayArray[index],
    }))

    return result
}

type DbAssignmentFindManyCanditateProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
}
export const dbAssignmentFindManyBookWithReviewNeededAttempts = async (props: DbAssignmentFindManyCanditateProps) => {
    const result = await findManyBooksWithAttempts({ isReviewNeeded: true, ...props })
    return result
}

type DbAssignmentCreateAssignmentProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
    book_ids: bigint[]
}
export const dbAssignmentCreateAssignment = async ({
    user_id,
    classroom_id,
    student_id,
    book_ids,
}: DbAssignmentCreateAssignmentProps) => {
    await prismaClient.student.findUniqueOrThrow({
        where: { id: student_id, hagwon: { principal: { user_id } } },
    })

    const unreviewedAtteptArray = await prismaClient.question_attempt.findMany({
        where: {
            classroom_id,
            student_id,
            child_attempt: null,
            question: { step: { topic: { book: { id: { in: book_ids } } } } },
        },
    })
    if (unreviewedAtteptArray.length === 0) throw ApiError.NotFound("오답 과제를 만들 것을 못 찾았어요")
    console.log()

    const result = await prismaClient.review_assignment.create({
        data: {
            student_id,
            classroom_id,
            question_attempts: {
                create: unreviewedAtteptArray.map((attempt) => ({
                    student_id,
                    question_id: attempt.question_id,
                    classroom_id,
                    parent_attempt_id: attempt.id,
                })),
            },
            book_ids,
        },
    })
    return result
}

type DbAssignmentFindForPdfProps = {
    user_id: bigint
    assignment_id: bigint
}
export const dbAssignmentFindBookForPdf = async ({ user_id, assignment_id }: DbAssignmentFindForPdfProps) => {
    // NOTE: book으로 묶을 거니까 처음부터 book을 가져오는 게 낫겠다
    const result = await findManyBooksFromAssignment({ user_id, assignment_id })
    return result
}

type DbAssignedAssignmentUpdateProps = {
    user_id: bigint
    assignment_id: bigint
    status: session_status | null
}
export const dbAssignedAssignmentUpdate = async ({
    user_id,
    assignment_id,
    status,
}: DbAssignedAssignmentUpdateProps) => {
    const result = await prismaClient.review_assignment.update({
        where: {
            id: assignment_id,
            student: { hagwon: { principal: { user_id } } },
        },
        data: { status },
    })
    return result
}
