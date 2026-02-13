import prismaClient from "@/src/db/prismaClient.js"
import type { BookWithReviewChecksFromClient } from "../router/index.js"
import { convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"

// TODO: clean up following when possible. they are dead code
type OLD_DbAssignmentFindManyAssignmentProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
}
export const OLD_dbAssignmentFindManyAssignment = async ({
    user_id,
    classroom_id,
    student_id,
}: OLD_DbAssignmentFindManyAssignmentProps) => {
    // TODO: 반을 어떻게 적용하지? 이리저리 하면 될 것 같긴 하다
    const result = await prismaClient.review_assignment.findMany({
        where: {
            student_id,
            reviewAssignmentQuestions: {
                some: {
                    review_check: {
                        session: {
                            ...(classroom_id && { assignedSessionClassrooms: { some: { classroom_id } } }),
                            ...(!classroom_id && { assignedSessionStudents: { some: { student_id } } }),
                            syllabus: { user_id },
                        },
                    },
                },
            },
        },
        include: {
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
// TODO: clean up above when possible. they are dead code

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
                        session: {
                            ...(classroom_id && { assignedSessionClassrooms: { some: { classroom_id } } }),
                            ...(!classroom_id && { assignedSessionStudents: { some: { student_id } } }),
                            syllabus: { user_id },
                        },
                    },
                },
            },
        },
        include: {
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
