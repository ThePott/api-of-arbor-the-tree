import prismaClient from "@/src/db/prismaClient.js"
import type { BookWithReviewChecksFromClient } from "../router/index.js"
import { convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import type { bookWhereInput, questionWhereInput, stepWhereInput, topicWhereInput } from "@/generated/prisma/models.js"
import type { session_status } from "@/generated/prisma/enums.js"

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
    // TODO: 반을 어떻게 적용하지? 이리저리 하면 될 것 같긴 하다
    const result = await prismaClient.review_assignment.findMany({
        where: {
            student_id,
            reviewAssignmentQuestions: {
                some: {
                    review_check: {
                        classroom_id,
                        session: { syllabus: { user_id } },
                    },
                },
            },
        },
        include: {
            assignedReviewAssignment: true,
            reviewAssignmentQuestions: {
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
        },
    })
    return result
}

type DbAssignmentFindManyCanditateProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
}
export const dbAssignmentFindManyBookWithReviewChecks = async ({
    user_id,
    classroom_id,
    student_id,
}: DbAssignmentFindManyCanditateProps) => {
    const result = await prismaClient.book.findMany({
        where: {
            topics: {
                some: {
                    steps: {
                        some: {
                            questions: {
                                some: {
                                    reviewChecks: {
                                        some: {
                                            student_id,
                                            ...(classroom_id && {
                                                session: {
                                                    assignedSessionClassrooms: {
                                                        some: {
                                                            classroom_id,
                                                        },
                                                    },
                                                },
                                            }),
                                            reviewAssignmentQuestions: { none: {} },
                                            status: "WRONG",
                                            student: { hagwon: { principal: { user_id } } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        select: {
            title: true,
            topics: {
                select: {
                    steps: {
                        select: {
                            questions: {
                                select: {
                                    reviewChecks: true,
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

type DbAssignmentCreateAssignmentProps = {
    user_id: bigint
    student_id: bigint
    bookWithReviewChecksArray: BookWithReviewChecksFromClient[]
}
export const dbAssignmentCreateAssignment = async ({
    user_id: _user_id,
    student_id,
    bookWithReviewChecksArray,
}: DbAssignmentCreateAssignmentProps) => {
    // TODO
    // TODO: NEED TO VALIDATE with user_id
    // TODO
    const result = await prismaClient.review_assignment.create({
        data: {
            student_id,
            reviewAssignmentQuestions: {
                create: bookWithReviewChecksArray
                    .flatMap((book) => book.reviewChecks)
                    .map((reviewCheck) => ({
                        review_check_id: convertToBigIntOrThrow(reviewCheck.id),
                    })),
            },
        },
    })
    return result
}

type FilterInBookProps = {
    forWhat: "topics" | "steps" | "questions" | "reviewChecks"
    assignment_id: bigint
}
function filterByAssignment(props: { forWhat: "reviewChecks"; assignment_id: bigint }): questionWhereInput
function filterByAssignment(props: { forWhat: "questions"; assignment_id: bigint }): stepWhereInput
function filterByAssignment(props: { forWhat: "steps"; assignment_id: bigint }): topicWhereInput
function filterByAssignment(props: { forWhat: "topics"; assignment_id: bigint }): bookWhereInput
function filterByAssignment({ forWhat, assignment_id }: FilterInBookProps) {
    const reviewChecksFilter: questionWhereInput = {
        reviewChecks: {
            some: {
                reviewAssignmentQuestions: {
                    some: { review_assignment_id: assignment_id },
                },
            },
        },
    }
    if (forWhat === "reviewChecks") return reviewChecksFilter

    const questionsFilter: stepWhereInput = {
        questions: {
            some: {
                reviewChecks: {
                    some: {
                        reviewAssignmentQuestions: {
                            some: { review_assignment_id: assignment_id },
                        },
                    },
                },
            },
        },
    }
    if (forWhat === "questions") return questionsFilter

    const stepsFilter: topicWhereInput = { steps: { some: { ...questionsFilter } } }
    if (forWhat === "steps") return stepsFilter

    const topicsFilter: bookWhereInput = { topics: { some: { ...stepsFilter } } }
    return topicsFilter
}
type DbAssignmentFindForPdfProps = {
    user_id: bigint
    assignment_id: bigint
}
export const dbAssignmentFindBookForPdf = async ({ user_id, assignment_id }: DbAssignmentFindForPdfProps) => {
    // NOTE: book으로 묶을 거니까 처음부터 book을 가져오는 게 낫겠다
    const result = await prismaClient.book.findMany({
        where: {
            ...filterByAssignment({ forWhat: "topics", assignment_id }),
            user_id,
        },
        include: {
            topics: {
                where: filterByAssignment({ forWhat: "steps", assignment_id }),
                include: {
                    steps: {
                        where: filterByAssignment({ forWhat: "questions", assignment_id }),
                        include: {
                            questions: {
                                where: filterByAssignment({ forWhat: "reviewChecks", assignment_id }),
                            },
                        },
                    },
                },
            },
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
