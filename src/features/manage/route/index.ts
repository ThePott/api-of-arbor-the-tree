import { decodeAccessToken, extractUserIdFromAccessToken as extractUserI } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import { dbAppendStudentToClassroom, dbCreateClassroom, dbFindManyStudentAndClassroom } from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"

const manageRouter = Router()

manageRouter.get("/student", async (req, res) => {
    const { userIdInString } = decodeAccessToken(req.headers)
    const user_id = BigInt(userIdInString)
    const result = await dbFindManyStudentAndClassroom(user_id)
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

manageRouter.post("/classroom", async (req, res) => {
    const user_id = extractUserI(req.headers)
    const { name } = req.body

    const result = await dbCreateClassroom({ name, user_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

manageRouter.post("/classroom/student", async (req, res) => {
    const { classroom_id, student_id } = req.body
    const result = await dbAppendStudentToClassroom({
        student_id: BigInt(student_id),
        classroom_id: BigInt(classroom_id),
    })
    const serializable = makeSerializable(result)
    console.log({ result, serializable })
    res.status(201).json(serializable)
})

export default manageRouter
