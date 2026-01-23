import { Router } from "express"
import { dbProgressCreateSyllabus, dbProgressDeleteSyllabus, dbProgressFindManySyllabus } from "../db/index.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

const progressRouter = Router()

progressRouter.post("/book", async (req, res) => {
    const body = req.body // NOTE: book_id, classroom_id, student_id
    const user_id = extractUserId(req.headers)

    const { classroom_id, student_id } = body
    if ((classroom_id && student_id) || (!classroom_id && !student_id))
        throw ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")

    const result = await dbProgressCreateSyllabus({ ...body, user_id })
    const serializable = makeSerializable(result)
    console.log({ serializable })
    res.status(200).json(serializable)
})

progressRouter.get("/syllabus", async (req, res) => {
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null

    if (!classroom_id && !student_id) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    const result = await dbProgressFindManySyllabus({ classroom_id, student_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.delete("/syllabus/:syllabus_id", async (req, res) => {
    const syllabus_id = BigInt(req.params.syllabus_id)
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    const user_id = extractUserId(req.headers)

    const result = await dbProgressDeleteSyllabus({ classroom_id, student_id, user_id, syllabus_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.get("/session", async (req, res) => {
    res.status(200).send("----good")
})

export default progressRouter
