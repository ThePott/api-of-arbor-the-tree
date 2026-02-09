import { Router } from "express"
import type { review_check_status, session_status } from "@/generated/prisma/enums.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import { dbReviewCheckBulkWrite, dbReviewCheckFindMany, type QuestionIdToInfo } from "../db/index.js"

const reviewCheckRouter = Router()

const addStatusToBook = (result: Awaited<ReturnType<typeof dbReviewCheckFindMany>>) => {
    const topics = result.bookResult?.topics.map((topic) => {
        const steps = topic.steps.map((step) => {
            const questions = step.questions.map((question) => {
                type JoinedQuestion = Omit<typeof question, "reviewChecks" | "sessionQuestions"> & {
                    session_status: session_status | null
                    review_check_status: review_check_status | null
                    review_check_id: bigint | null
                    assigned_session_student_id: bigint | null
                }
                const { reviewChecks, sessionQuestions, ...rest } = question
                const joinedQuestion: JoinedQuestion = {
                    ...rest,
                    review_check_status: null,
                    session_status: null,
                    review_check_id: null,
                    assigned_session_student_id: null,
                }
                joinedQuestion.review_check_status = reviewChecks[0]?.status ?? null
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

type QuestionIdToInfoFromClient = Record<
    string, // NOTE: question_id
    {
        status: review_check_status | null // NOTE: use to delete if null
        review_check_id: string | null
        assigned_session_student_id: string // NOTE: 오답 체크는 부여된 묶음에서만 가능함
    }
>
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

// reviewCheckRouter.post("/check", async (req, res) => {
//     const user_id = extractUserId(req.headers)
//     const student_id = BigInt(req.body.student_id)
//     const syllabus_id = BigInt(req.body.syllabus_id)
//     const question_id = BigInt(req.body.question_id)
//     const status = req.body.status as review_check_status
//     const result = await dbReviewCheckCreate({ user_id, status, student_id, syllabus_id, question_id })
//     const serializable = makeSerializable(result)
//     res.status(200).json(serializable)
// })

// reviewCheckRouter.patch("/create/:review_check_id", async (req, res) => {
//     const user_id = extractUserId(req.headers)
//     const review_check_id = BigInt(req.params.review_check_id)
//     const status = req.body.status as review_check_status
//     const result = await dbReviewCheckUpdate({ user_id, status, review_check_id })
//     const serializable = makeSerializable(result)
//     res.status(200).json(serializable)
// })
//
// reviewCheckRouter.delete("/create/:review_check_id", async (req, res) => {
//     const user_id = extractUserId(req.headers)
//     const review_check_id = BigInt(req.params.review_check_id)
//     const result = await dbReviewCheckDelete({ user_id, review_check_id })
//     const serializable = makeSerializable(result)
//     res.status(200).json(serializable)
// })

export default reviewCheckRouter
