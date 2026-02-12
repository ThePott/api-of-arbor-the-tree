import prismaClient from "@/src/db/prismaClient.js"
import type { CondensedBookWithReviewChecksFromClient } from "../router/index.js"
import { convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"

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
    condensedBookArray: CondensedBookWithReviewChecksFromClient[]
}
export const dbAssignmentCreateAssignment = async ({
    user_id: _user_id,
    student_id,
    condensedBookArray,
}: DbAssignmentCreateAssignmentProps) => {
    // TODO
    // TODO: NEED TO VALIDATE with user_id
    // TODO
    const result = await prismaClient.review_assignment.create({
        data: {
            student_id,
            reviewAssignmentQuestions: {
                create: condensedBookArray
                    .flatMap((book) => book.reviewChecks)
                    .map((reviewCheck) => ({
                        review_check_id: convertToBigIntOrThrow(reviewCheck.id),
                    })),
            },
        },
    })
    return result
}
