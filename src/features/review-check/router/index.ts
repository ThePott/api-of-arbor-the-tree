import { Router } from "express"
import { dbReviewCheckFindMany } from "../db/index.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"

const reviewCheckRouter = Router()

reviewCheckRouter.get("/", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    const syllabus_id = req.query.syllabus_id ? BigInt(String(req.query.syllabus_id)) : null
    const review_assignment_id = req.query.review_assignment_id ? BigInt(String(req.query.review_assignment_id)) : null
    if (!student_id || !syllabus_id) throw ApiError.BadRequest("학생과 문제집을 선택해주세요")
    const result = await dbReviewCheckFindMany({ user_id, student_id, syllabus_id, review_assignment_id })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default reviewCheckRouter
