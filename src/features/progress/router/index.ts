import { Router } from "express"
import { dbProgressCreateBook } from "../db/index.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

const progressRouter = Router()

progressRouter.post("/book", async (req, res) => {
    const body = req.body // NOTE: book_id, classroom_id, student_id_array
    const user_id = extractUserId(req.headers)
    console.log({ body, user_id })
    const result = await dbProgressCreateBook({ ...body, user_id })
    const serializable = makeSerializable(result)
    console.log({ serializable })
    res.status(200).json(serializable)
})

progressRouter.get("/book", async (req, res) => {
    const classroom_id = req.query.classroom_id ? String(req.query.classroom_id) : null
    const student_id = req.query.student_id ? String(req.query.student_id) : null

    if (!classroom_id && !student_id) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    res.status(200).json({ classroom_id, student_id })
})

export default progressRouter
