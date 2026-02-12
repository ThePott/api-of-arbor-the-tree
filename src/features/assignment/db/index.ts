import prismaClient from "@/src/db/prismaClient.js"

type DbAssignmentFindManyCanditateProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
}
export const dbAssignmentFindManyCanditateReviewCheck = async ({
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
