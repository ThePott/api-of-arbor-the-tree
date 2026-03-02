import type {
    question_attemptWhereInput,
    questionWhereInput,
    stepWhereInput,
    topicWhereInput,
    bookWhereInput,
} from "@/generated/prisma/models.js"

type FilterByAssignment = {
    forWhat: "book" | "topic" | "step" | "question" | "questionAttempt"
    assignment_id: bigint
}
function filterByAssignment(props: { forWhat: "questionAttempt"; assignment_id: bigint }): question_attemptWhereInput
function filterByAssignment(props: { forWhat: "question"; assignment_id: bigint }): questionWhereInput
function filterByAssignment(props: { forWhat: "step"; assignment_id: bigint }): stepWhereInput
function filterByAssignment(props: { forWhat: "topic"; assignment_id: bigint }): topicWhereInput
function filterByAssignment(props: { forWhat: "book"; assignment_id: bigint }): bookWhereInput
function filterByAssignment({ forWhat, assignment_id }: FilterByAssignment) {
    const questionAttemptWhereInput: question_attemptWhereInput = {
        child_attempt: null, // TODO: 이게 필요한가? 이 오답과제의 모든 체크를 가져온다고 하면 없어도 되지 않나???
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

export default filterByAssignment
