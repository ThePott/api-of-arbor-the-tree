import { Router } from "express"
import type { review_check_status, session_status } from "@/generated/prisma/enums.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import type { QuestionIdToInfo, QuestionIdToInfoFromClient } from "../types/index.js"
import { dbReviewCheckFindMany, dbReviewCheckBulkWrite } from "../db/index.js"

const reviewCheckRouter = Router()

const addStatusToBook = (result: Awaited<ReturnType<typeof dbReviewCheckFindMany>>) => {
    const topics = result.bookResult?.topics.map((topic) => {
        const steps = topic.steps.map((step) => {
            const questions = step.questions.map((question) => {
                type JoinedQuestion = Omit<typeof question, "reviewChecks" | "sessionQuestions"> & {
                    session_status: session_status | null
                    review_check_status: review_check_status | null
                    review_check_status_visual: review_check_status | null
                    review_check_id: bigint | null
                    assigned_session_student_id: bigint | null
                }
                const { reviewChecks, sessionQuestions, ...rest } = question
                const joinedQuestion: JoinedQuestion = {
                    ...rest,
                    session_status: null,
                    review_check_id: null,
                    review_check_status: null,
                    review_check_status_visual: null,
                    assigned_session_student_id: null,
                }
                joinedQuestion.review_check_status = reviewChecks[0]?.status ?? null
                joinedQuestion.review_check_status_visual = reviewChecks[0]?.status ?? null
                joinedQuestion.session_status = sessionQuestions[0]?.session.assignedSessionStudents[0]?.status ?? null
                joinedQuestion.assigned_session_student_id =
                    sessionQuestions[0]?.session.assignedSessionStudents[0]?.id ?? null
                joinedQuestion.review_check_id = reviewChecks[0]?.id ?? null
                return joinedQuestion
            })
            return { ...step, questions }
        })
        return { ...topic, steps }
    })

    const joinedBookResult = { ...result.bookResult, topics }

    return joinedBookResult
}
reviewCheckRouter.get("/check", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    const syllabus_id = req.query.syllabus_id ? BigInt(String(req.query.syllabus_id)) : null
    const review_assignment_id = req.query.review_assignment_id ? BigInt(String(req.query.review_assignment_id)) : null
    if (!student_id || !syllabus_id) throw ApiError.BadRequest("학생과 문제집을 선택해주세요")
    const result = await dbReviewCheckFindMany({ user_id, student_id, syllabus_id, review_assignment_id })
    const joinedResult = addStatusToBook(result)

    const serializable = makeSerializable(joinedResult)
    res.status(200).json(serializable)
})

// NOTE: bulk update
reviewCheckRouter.post("/check", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const changedReviewChecksFromClient = req.body.changedReviewChecks as QuestionIdToInfoFromClient

    const changedReviewChecks: QuestionIdToInfo = Object.fromEntries(
        Object.entries(changedReviewChecksFromClient).map(
            ([key, { status, review_check_id, assigned_session_student_id }]) => [
                key,
                {
                    status,
                    review_check_id: review_check_id ? BigInt(review_check_id) : null,
                    assigned_session_student_id: BigInt(assigned_session_student_id),
                },
            ]
        )
    )

    const result = await dbReviewCheckBulkWrite({ user_id, changedReviewChecks })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default reviewCheckRouter
