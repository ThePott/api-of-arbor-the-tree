import type { attempt_status, session_status } from "@/generated/prisma/enums.js"
import type { dbReviewCheckFindMany } from "../db/index.js"
import type findManyBooksWithAttempts from "@/src/shared/queries/find-many-books-with-attempts.js"

type WithAttemptInfo = {
    attempt_id: bigint | null
    attempt_status: attempt_status | null
    attempt_status_visual: attempt_status | null
    isReviewed: boolean
    session_id: bigint | null // NOTE: idToChangedInfo에 들어 있어야 한다
    session_status: session_status | null // NOTE: session이 할당된 것만 오답체크할 수 있다
}

export const addAttemptInfoToSingleBook = (result: Awaited<ReturnType<typeof dbReviewCheckFindMany>>) => {
    const topics = result?.topics.map((topic) => {
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
                }

                questionWithAttemptInfo.attempt_id = attempt?.id ?? null
                questionWithAttemptInfo.attempt_status = attempt?.status ?? null
                questionWithAttemptInfo.attempt_status_visual = attempt?.status ?? null
                questionWithAttemptInfo.isReviewed = Boolean(attempt?.child_attempt)

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

    const joinedBookResult = { ...result, topics }

    return joinedBookResult
}

export const addAttemptInfoToBookArray = (result: Awaited<ReturnType<typeof findManyBooksWithAttempts>>) => {
    const bookArray = result.map((book) => addAttemptInfoToSingleBook(book))
    return bookArray
}
