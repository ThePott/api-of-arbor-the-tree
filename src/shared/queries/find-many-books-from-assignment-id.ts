import prismaClient from "@/src/db/prismaClient.js"
import filterByAssignment from "./filter-by-assignment.js"

type FindManyBooksFromAssignmentProps = {
    hagwon_id: bigint
    assignment_id: bigint
}
export const findManyBooksFromAssignment = async ({ hagwon_id, assignment_id }: FindManyBooksFromAssignmentProps) => {
    const result = await prismaClient.book.findMany({
        where: {
            ...filterByAssignment({ forWhat: "book", assignment_id }),
            hagwon_id,
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
                                include: {
                                    questionAttempts: {
                                        where: filterByAssignment({ forWhat: "questionAttempt", assignment_id }),
                                        include: { child_attempt: true },
                                    },
                                },
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
