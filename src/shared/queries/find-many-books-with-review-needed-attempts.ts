import type {
    questionWhereInput,
    stepWhereInput,
    topicWhereInput,
    bookWhereInput,
    question_attemptWhereInput,
} from "@/generated/prisma/models.js"
import prismaClient from "@/src/db/prismaClient.js"

type MakeWhereInputProps = {
    forWhat: "book" | "topic" | "step" | "question" | "questionAttempt"
    classroom_id: bigint | null
    student_id: bigint
}
function makeWhereInput(props: {
    forWhat: "questionAttempt"
    classroom_id: bigint | null
    student_id: bigint
}): question_attemptWhereInput
function makeWhereInput(props: {
    forWhat: "question"
    classroom_id: bigint | null
    student_id: bigint
}): questionWhereInput
function makeWhereInput(props: { forWhat: "step"; classroom_id: bigint | null; student_id: bigint }): stepWhereInput
function makeWhereInput(props: { forWhat: "topic"; classroom_id: bigint | null; student_id: bigint }): topicWhereInput
function makeWhereInput(props: { forWhat: "book"; classroom_id: bigint | null; student_id: bigint }): bookWhereInput
function makeWhereInput({ forWhat, classroom_id, student_id }: MakeWhereInputProps) {
    const questionAttemptWhereInput: question_attemptWhereInput = { student_id, classroom_id, child_attempt: null }
    if (forWhat === "questionAttempt") return questionAttemptWhereInput

    const questionWhereInput: questionWhereInput = { questionAttempts: { some: questionAttemptWhereInput } }
    if (forWhat === "question") return questionWhereInput

    const stepWhereInput: stepWhereInput = { questions: { some: questionWhereInput } }
    if (forWhat === "step") return stepWhereInput

    const topicWhereInput: topicWhereInput = { steps: { some: stepWhereInput } }
    if (forWhat === "topic") return topicWhereInput

    const bookWhereInput: bookWhereInput = { topics: { some: topicWhereInput } }
    return bookWhereInput
}

type FindManyBooksWithReviewNeededAttemptsProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
}
const findManyBooksWithReviewNeededAttempts = async (props: FindManyBooksWithReviewNeededAttemptsProps) => {
    const { user_id, classroom_id, student_id } = props
    const result = await prismaClient.book.findMany({
        where: {
            user_id,
            topics: {
                some: {
                    steps: {
                        some: {
                            questions: {
                                some: {
                                    questionAttempts: {
                                        some: {
                                            status: "WRONG",
                                            student_id,
                                            classroom_id,
                                            child_attempt: null,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        include: {
            topics: {
                orderBy: { order: "asc" },
                where: makeWhereInput({ forWhat: "topic", ...props }),
                include: {
                    steps: {
                        orderBy: { order: "asc" },
                        where: makeWhereInput({ forWhat: "step", ...props }),
                        include: {
                            questions: {
                                orderBy: { order: "asc" },
                                where: makeWhereInput({ forWhat: "question", ...props }),
                            },
                        },
                    },
                },
            },
        },
    })
    return result
}

export default findManyBooksWithReviewNeededAttempts
