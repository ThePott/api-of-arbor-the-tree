import { Router } from "express"
import type { review_check_status, session_status } from "@/generated/prisma/enums.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import type { QuestionIdToInfoForApi, QuestionIdToInfoFromClient } from "../types/index.js"
import { dbReviewCheckFindMany, dbReviewCheckBulkWrite } from "../db/index.js"
import { convertToBigIntOrThrow } from "@/src/utils/convertToBigIntOrThrow.js"

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
                joinedQuestion.session_status = sessionQuestions[0]?.session.assignedSessionStudents[0]?.status ?? null
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
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    const syllabus_id = req.query.syllabus_id ? BigInt(String(req.query.syllabus_id)) : null
    const review_assignment_id = req.query.review_assignment_id ? BigInt(String(req.query.review_assignment_id)) : null
    if (!student_id || !syllabus_id) throw ApiError.BadRequest("학생과 문제집을 선택해주세요")

    const result = await dbReviewCheckFindMany({ user_id, student_id, syllabus_id, review_assignment_id })
    const joinedResult = addStatusToBook(result)

    const serializable = makeSerializable(joinedResult)
    // const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

// NOTE: bulk update
reviewCheckRouter.post("/check", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const changedReviewChecksFromClient = req.body.changedReviewChecks as QuestionIdToInfoFromClient
    const student_id = convertToBigIntOrThrow(req.body.student_id)

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

export default reviewCheckRouter
