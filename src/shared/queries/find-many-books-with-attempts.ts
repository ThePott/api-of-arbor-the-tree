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
    isReviewNeeded: boolean
}
function makeWhereInput(props: {
    forWhat: "questionAttempt"
    classroom_id: bigint | null
    student_id: bigint
    isReviewNeeded: boolean
}): question_attemptWhereInput
function makeWhereInput(props: {
    forWhat: "question"
    classroom_id: bigint | null
    student_id: bigint
    isReviewNeeded: boolean
}): questionWhereInput
function makeWhereInput(props: {
    forWhat: "step"
    classroom_id: bigint | null
    student_id: bigint
    isReviewNeeded: boolean
}): stepWhereInput
function makeWhereInput(props: {
    forWhat: "topic"
    classroom_id: bigint | null
    student_id: bigint
    isReviewNeeded: boolean
}): topicWhereInput
function makeWhereInput(props: {
    forWhat: "book"
    classroom_id: bigint | null
    student_id: bigint
    isReviewNeeded: boolean
}): bookWhereInput
function makeWhereInput({ forWhat, classroom_id, student_id, isReviewNeeded: isReviewNeeded }: MakeWhereInputProps) {
    const questionAttemptWhereInput: question_attemptWhereInput = {
        student_id,
        classroom_id,
        child_attempt: null,
        ...(isReviewNeeded && { status: "WRONG" }),
    }
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

// NOTE: isReviewNeeded - assignment/create: 후보 찾을 때 << 몇 문제가 복습이 필요한지 확인
// NOTE: !isReviewNeeded - check/assignment: attempt까지 끌고 와야 체크 상태를 알 수 있음
type FindManyBooksWithAttemptsProps = {
    user_id: bigint
    classroom_id: bigint | null
    student_id: bigint
    isReviewNeeded: boolean
}
const findManyBooksWithAttempts = async (props: FindManyBooksWithAttemptsProps) => {
    const { user_id } = props

    const result = await prismaClient.book.findMany({
        where: {
            user_id,
            topics: {
                some: makeWhereInput({ forWhat: "topic", ...props }),
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
                                include: {
                                    // NOTE: 조건부로 넣으면 접근이 안 된다
                                    questionAttempts: {
                                        where: makeWhereInput({ forWhat: "questionAttempt", ...props }),
                                    },
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

export default findManyBooksWithAttempts
