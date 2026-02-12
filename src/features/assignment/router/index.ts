import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import { dbAssignmentFindManyCanditateReviewCheck } from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"

const assignmentRouter = Router()

assignmentRouter.get("/", async (req, res) => {
    res.status(200).send("---- good")
})

assignmentRouter.get("/create", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    const result = await dbAssignmentFindManyCanditateReviewCheck({ user_id, classroom_id, student_id })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

assignmentRouter.post("/create", async (req, res) => {
    res.status(200).send("---- real good")
})

export default assignmentRouter
