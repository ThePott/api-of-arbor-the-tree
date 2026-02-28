import { Router } from "express"
import type { review_check_status, session_status } from "@/generated/prisma/enums.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import type { QuestionIdToInfoForApi, QuestionIdToInfoFromClient } from "../types/index.js"
import { dbReviewCheckFindMany, dbReviewCheckBulkWrite, dbReviewCheckForAssignmentFindMany } from "../db/index.js"
import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { validateBody } from "@/src/utils/validateBody.js"

const reviewCheckRouter = Router()

type AdditionalPropsForJoinedQuestion = {
    session_status: session_status | null
    session_id: bigint | null
    review_check_status: review_check_status | null
    review_check_status_visual: review_check_status | null
    review_check_id: bigint | null
}

const addStatusToBook = (result: Awaited<ReturnType<typeof dbReviewCheckFindMany>>) => {
    const topics = result?.topics.map((topic) => {
        const steps = topic.steps.map((step) => {
            const questions = step.questions.map((question) => {
                type JoinedQuestion = Omit<typeof question, "reviewChecks" | "sessionQuestions"> &
                    AdditionalPropsForJoinedQuestion
                const { reviewChecks, sessionQuestions, ...rest } = question
                const joinedQuestion: JoinedQuestion = {
                    ...rest,
                    session_status: null,
                    review_check_id: null,
                    review_check_status: null,
                    review_check_status_visual: null,
                    session_id: null,
                }
                joinedQuestion.review_check_status = reviewChecks[0]?.status ?? null
                joinedQuestion.review_check_status_visual = reviewChecks[0]?.status ?? null

                const session = sessionQuestions[0]?.session
                joinedQuestion.session_status =
                    session?.assignedSessionClassrooms[0]?.status ?? session?.assignedSessionStudents[0]?.status ?? null

                joinedQuestion.session_id = sessionQuestions[0]?.session.id ?? null
                joinedQuestion.review_check_id = reviewChecks[0]?.id ?? null
                return joinedQuestion
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
    const student_id = convertToBigIntOrNull(req.query.student_id)
    const syllabus_id = convertToBigIntOrNull(req.query.syllabus_id)
    const review_assignment_id = req.query.review_assignment_id ? BigInt(String(req.query.review_assignment_id)) : null
    if (!student_id || !syllabus_id) throw ApiError.BadRequest("학생과 문제집을 선택해주세요")

    const result = await dbReviewCheckFindMany({ user_id, student_id, syllabus_id, review_assignment_id })
    const joinedResult = addStatusToBook(result)

    const serializable = makeSerializable(joinedResult)
    // const serializable = makeSerializable(result)
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

// NOTE: bulk update
reviewCheckRouter.post("/check", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const changedReviewChecksFromClient = req.body.changedReviewChecks as QuestionIdToInfoFromClient
    const student_id = convertToBigIntOrThrow(req.body.student_id)
    validateBody({ changedReviewChecksFromClient, student_id })

    const changedReviewChecks: QuestionIdToInfoForApi = Object.fromEntries(
        Object.entries(changedReviewChecksFromClient).map(([key, { status, session_id }]) => [
            key,
            {
                status,
                session_id: convertToBigIntOrThrow(session_id),
            },
        ])
    )

    const result = await dbReviewCheckBulkWrite({ user_id, student_id, changedReviewChecks })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

reviewCheckRouter.post("/check/assignment", async (req, res) => {
    res.status(200).send("---- good")
})

export default reviewCheckRouter
