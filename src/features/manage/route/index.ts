import { decodeAccessToken, extractUserId } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import {
    dbAppendStudentToClassroom,
    dbCreateClassroom,
    dbDeleteClassroom,
    dbDeleteClassroomStudent,
    dbFindManyByClassroom,
} from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"

const manageRouter = Router()

manageRouter.get("/student", async (req, res) => {
    const { userIdInString } = decodeAccessToken(req.headers)
    const user_id = BigInt(userIdInString)
    const result = await dbFindManyByClassroom(user_id)
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

manageRouter.post("/classroom", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const { classroom_name } = req.body

    const result = await dbCreateClassroom({ classroom_name, user_id })
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
    res.status(201).json(serializable)
})

manageRouter.delete("/classroom-student/:classroomStudentId", async (req, res) => {
    const _user_id = extractUserId(req.headers)
    const classroom_student_id = BigInt(req.params.classroomStudentId)
    const result = await dbDeleteClassroomStudent(classroom_student_id)
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

manageRouter.delete("/classroom/:classroomId", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = BigInt(req.params.classroomId)
    const result = await dbDeleteClassroom({ user_id, classroom_id })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default manageRouter
