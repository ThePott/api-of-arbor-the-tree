import type { attempt_status, session_status } from "@/generated/prisma/enums.js"
import type { dbReviewCheckFindMany } from "../db/index.js"

type WithAttemptInfo = {
    attempt_id: bigint | null
    attempt_status: attempt_status | null
    attempt_status_visual: attempt_status | null
    assignment_status: session_status | null
    isReviewed: boolean
    session_id: bigint | null // NOTE: idToChangedInfo에 들어 있어야 한다
    session_status: session_status | null // NOTE: session이 할당된 것만 오답체크할 수 있다
}

type AddAttemptInfoToSingleBookProps = {
    book: Awaited<ReturnType<typeof dbReviewCheckFindMany>>
    assignment_status?: session_status | null
}
export const addAttemptInfoToSingleBook = ({ book, assignment_status = null }: AddAttemptInfoToSingleBookProps) => {
    const topics = book?.topics.map((topic) => {
        const steps = topic.steps.map((step) => {
            const questions = step.questions.map((question) => {
                const { questionAttempts, sessionQuestions, ...rest } = question
                const attempt = questionAttempts?.[0]
                const session = sessionQuestions?.[0]?.session

                type QuestionWithAttemptInfo = Omit<typeof question, "questionAttempts" | "sessionQuestions"> &
                    WithAttemptInfo
                const questionWithAttemptInfo: QuestionWithAttemptInfo = {
                    ...rest,
                    attempt_id: null,
                    attempt_status: null,
                    attempt_status_visual: null,
                    isReviewed: false,
                    session_id: null,
                    session_status: null,
                    assignment_status: null,
                }

                questionWithAttemptInfo.attempt_id = attempt?.id ?? null
                questionWithAttemptInfo.attempt_status = attempt?.status ?? null
                questionWithAttemptInfo.attempt_status_visual = attempt?.status ?? null
                questionWithAttemptInfo.isReviewed = Boolean(attempt?.child_attempt)
                questionWithAttemptInfo.assignment_status = assignment_status

                questionWithAttemptInfo.session_id = session?.id ?? null
                questionWithAttemptInfo.session_status =
                    session?.assignedSessionClassrooms?.[0]?.status ??
                    session?.assignedSessionStudents?.[0]?.status ??
                    null

                return questionWithAttemptInfo
            })
            return { ...step, questions }
        })
        return { ...topic, steps }
    })

    const joinedBookResult = { ...book, topics }

    return joinedBookResult
}
