import prismaClient from "@/src/db/prismaClient.js"
import type { BookWithExtendedReviewChecksFromClient } from "../router/index.js"
import { convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import type {
    bookWhereInput,
    question_attemptWhereInput,
    questionWhereInput,
    stepWhereInput,
    topicWhereInput,
} from "@/generated/prisma/models.js"
import type { session_status } from "@/generated/prisma/enums.js"
import findManyBooksWithAttempts from "@/src/shared/queries/find-many-books-with-attempts.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

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

type FilterInBookProps = {
    forWhat: "book" | "topic" | "step" | "question" | "questionAttempt"
    assignment_id: bigint
}
function filterByAssignment(props: { forWhat: "questionAttempt"; assignment_id: bigint }): question_attemptWhereInput
function filterByAssignment(props: { forWhat: "question"; assignment_id: bigint }): questionWhereInput
function filterByAssignment(props: { forWhat: "step"; assignment_id: bigint }): stepWhereInput
function filterByAssignment(props: { forWhat: "topic"; assignment_id: bigint }): topicWhereInput
function filterByAssignment(props: { forWhat: "book"; assignment_id: bigint }): bookWhereInput
function filterByAssignment({ forWhat, assignment_id }: FilterInBookProps) {
    const questionAttemptWhereInput: question_attemptWhereInput = {
        child_attempt: null,
        review_assignment_id: assignment_id,
    }
    if (forWhat === "questionAttempt") return questionAttemptWhereInput

    const questionWhereInput: questionWhereInput = {
        questionAttempts: {
            some: questionAttemptWhereInput,
        },
    }
    if (forWhat === "question") return questionWhereInput

    const stepWhereInput: stepWhereInput = {
        questions: { some: questionWhereInput },
    }
    if (forWhat === "step") return stepWhereInput

    const topicWhereInput: topicWhereInput = {
        steps: { some: stepWhereInput },
    }
    if (forWhat === "topic") return topicWhereInput

    const bookWhereInput: bookWhereInput = {
        topics: { some: topicWhereInput },
    }
    return bookWhereInput
}
type DbAssignmentFindForPdfProps = {
    user_id: bigint
    assignment_id: bigint
}
export const dbAssignmentFindBookForPdf = async ({ user_id, assignment_id }: DbAssignmentFindForPdfProps) => {
    // NOTE: book으로 묶을 거니까 처음부터 book을 가져오는 게 낫겠다
    const result = await prismaClient.book.findMany({
        where: {
            ...filterByAssignment({ forWhat: "book", assignment_id }),
            user_id,
        },
        include: {
            topics: {
                where: filterByAssignment({ forWhat: "topic", assignment_id }),
                orderBy: { order: "asc" },
                include: {
                    steps: {
                        where: filterByAssignment({ forWhat: "step", assignment_id }),
                        orderBy: { order: "asc" },
                        include: {
                            questions: {
                                where: filterByAssignment({ forWhat: "question", assignment_id }),
                                orderBy: { order: "asc" },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            title: "asc",
        },
    })
    return result
}

type DbAssignedAssignmentCreateProps = {
    user_id: bigint
    assignment_id: bigint
    status: session_status
}
export const dbAssignedAssignmentUpsert = async ({
    user_id,
    assignment_id,
    status,
}: DbAssignedAssignmentCreateProps) => {
    await prismaClient.review_assignment.findUniqueOrThrow({
        where: {
            id: assignment_id,
            student: { hagwon: { principal: { user_id } } },
        },
    })
    const result = await prismaClient.assigned_review_assignment.upsert({
        where: { review_assignment_id: assignment_id },
        create: {
            review_assignment_id: assignment_id,
            status,
        },
        update: { status },
    })
    return result
}

type DbAssignedAssignmentDeleteProps = {
    user_id: bigint
    assignment_id: bigint
}
export const dbAssignedAssignmentDelete = async ({ user_id, assignment_id }: DbAssignedAssignmentDeleteProps) => {
    const result = await prismaClient.assigned_review_assignment.delete({
        where: {
            review_assignment_id: assignment_id,
            review_assignment: { student: { hagwon: { principal: { user_id } } } },
        },
    })
    return result
}
