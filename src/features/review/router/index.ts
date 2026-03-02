import { Router } from "express"
import type { attempt_status, review_check_status, session_status } from "@/generated/prisma/enums.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import {
    dbReviewCheckFindMany,
    dbReviewCheckBulkWrite,
    dbReviewCheckForAssignmentFindMany,
    dbReviewCheckAssignmentBulkWrite,
} from "../db/index.js"
import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { validateBody } from "@/src/utils/validateBody.js"
import type { IdToChangedInfo } from "../types/index.js"

const reviewCheckRouter = Router()

export const ReviewCheckError = ApiError.Internal("오답 체크를 정리하던 중 문제가 발생했어요")

type WithAttemptInfo = {
    attempt_id: bigint | null
    attempt_status: attempt_status | null
    attempt_status_visual: attempt_status | null
    isReviewed: boolean
    session_id: bigint | null // NOTE: idToChangedInfo에 들어 있어야 한다
    session_status: session_status | null // NOTE: session이 할당된 것만 오답체크할 수 있다
}

const addAttemptInfo = (result: Awaited<ReturnType<typeof dbReviewCheckFindMany>>) => {
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
reviewCheckRouter.get("/check", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const student_id = convertToBigIntOrNull(req.query.student_id)
    const syllabus_id = convertToBigIntOrNull(req.query.syllabus_id)
    if (!student_id || !syllabus_id) throw ApiError.BadRequest("학생과 문제집을 선택해주세요")

    const result = await dbReviewCheckFindMany({ user_id, classroom_id, student_id, syllabus_id })
    const joinedResult = addAttemptInfo(result)

    const serializable = makeSerializable(joinedResult)
    // const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

// NOTE: bulk update
reviewCheckRouter.post("/check", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id) // NOTE: MUST put in query params
    const student_id = convertToBigIntOrThrow(req.query.student_id) // NOTE: MUT put in query params
    const idToChangedInfoFromClient = req.body.changedReviewChecks as IdToChangedInfo<"client", "session">
    validateBody({ idToChangedInfoFromClient })

    const idToChangedInfo: IdToChangedInfo<"api", "session"> = Object.fromEntries(
        Object.entries(idToChangedInfoFromClient).map(([key, value]) => [
            key,
            { ...value, session_id: convertToBigIntOrThrow(value.session_id) },
        ])
    )

    const result = await dbReviewCheckBulkWrite({ user_id, classroom_id, student_id, idToChangedInfo })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

const condenseAssignmentWithQuestions = (
    verboseAssignmentArray: Awaited<ReturnType<typeof dbReviewCheckForAssignmentFindMany>>
) => {
    const condensed = verboseAssignmentArray.map((assignment) => {
        const grouped = Object.groupBy(assignment.reviewAssignmentQuestions, (assignmentQuestion) => {
            const bookTitle = assignmentQuestion.review_check.question.step?.topic?.book?.title
            if (!bookTitle) throw ApiError.Internal("오답 과제를 정리하는 도중에 오류가 발생했어요")
            return bookTitle
        })
        const entryArray = Object.entries(grouped)
        const bookArray = entryArray.map(([bookTitle, reviewAssignmentQuestions]) => {
            if (!reviewAssignmentQuestions) throw ApiError.Internal("오답 과제를 정리하는 도중에 오류가 발생했어요")
            const condensedAssignmentQuestions = reviewAssignmentQuestions.map((assignmentQuestion) => {
                const { review_check: _, status, ...rest } = assignmentQuestion
                return {
                    ...rest,
                    review_check_status: status,
                    review_check_status_visual: status,
                    session_status: assignment.assignedReviewAssignment?.status ?? null,
                }
            })
            return { bookTitle: bookTitle, reviewAssignmentQuestions: condensedAssignmentQuestions }
        })
        return {
            id: assignment.id,
            student_id: assignment.student_id,
            classroom_id: assignment.classroom_id,
            created_at: assignment.created_at,
            completed_at: assignment.completed_at,
            // NOTE: addtional
            books: bookArray,
            question_count: assignment.reviewAssignmentQuestions.length,
        }
    })
    return condensed
}
reviewCheckRouter.get("/check/assignment", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const result = await dbReviewCheckForAssignmentFindMany({ user_id, student_id, classroom_id })
    const condensed = condenseAssignmentWithQuestions(result)
    const serializable = makeSerializable(condensed)
    res.status(200).json(serializable)
})

reviewCheckRouter.post("/check/assignment", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const idToChangedInfoFromClient = req.body.idToChangedInfo as IdToChangedInfo<"client", "assignment">
    const student_id = convertToBigIntOrThrow(req.body.student_id)
    validateBody({ idToChangedInfoFromClient, student_id })

    const idToChangedInfo: IdToChangedInfo<"api", "assignment"> = Object.fromEntries(
        Object.entries(idToChangedInfoFromClient)
            .filter(([_, { forWhat }]) => forWhat === "assignment") // NOTE: defence error for accessing assignment_id at below
            .map(([key, { status }]) => [
                key,
                {
                    forWhat: "assignment",
                    status: status,
                },
            ])
    )

    const result = await dbReviewCheckAssignmentBulkWrite({ user_id, student_id, idToChangedInfo })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default reviewCheckRouter
