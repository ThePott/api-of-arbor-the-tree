import { Router } from "express"
import {
    dbProgressAssignSession,
    dbProgressCompleteSession,
    dbProgressCreateSyllabus,
    dbProgressDeleteAssignedSession,
    dbProgressDeleteSyllabus,
    dbProgressFindManySyllabus,
    dbProgressFindManySyllabusAssigned,
    dbProgressFindManySyllabusWithSession,
} from "../db/index.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import type { session_status } from "@/generated/prisma/enums.js"
import groupSessionsByTopic from "./utils/session.js"
import { checkClassroomStudentExclusiveness } from "../utils/classroomStudentErrors.js"

const progressRouter = Router()

// NOTE: auto complete에 사용할 실라버스 받아와야
progressRouter.get("/syllabus", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const result = await dbProgressFindManySyllabus(user_id)
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

// NOTE: 과정 추가할 때
progressRouter.post("/syllabus/assigned", async (req, res) => {
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

// NOTE: 학생, 반한테 등록된 실라버스를 받아올 때
progressRouter.get("/syllabus/assigned", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null

    if (!classroom_id && !student_id) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    const result = await dbProgressFindManySyllabusAssigned({ user_id, classroom_id, student_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.delete("/syllabus/assigned/:syllabus_id", async (req, res) => {
    const syllabus_id = BigInt(req.params.syllabus_id)
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    const user_id = extractUserId(req.headers)

    const result = await dbProgressDeleteSyllabus({ classroom_id, student_id, user_id, syllabus_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.get("/session", async (req, res) => {
    const syllabus_id = req.query.syllabus_id ? BigInt(String(req.query.syllabus_id)) : null
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null

    const user_id = extractUserId(req.headers)
    const syllabusArray = await dbProgressFindManySyllabusWithSession({
        classroom_id,
        syllabus_id,
        student_id,
        user_id,
    })

    const conciseSyllabusArray = syllabusArray.map((syllabus) => ({
        id: syllabus.id,
        book: syllabus.book,
        sessionsByTopicArray: groupSessionsByTopic(syllabus.sessions),
    }))

    const serializable = makeSerializable(conciseSyllabusArray)
    // const serializable = makeSerializable(syllabusArray)
    res.status(200).json(serializable)
})

progressRouter.post("/session/assigned", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const body = req.body
    const session_id = BigInt(body.session_id)
    const session_status = body.session_status as session_status
    const student_id = body.student_id ? BigInt(body.student_id) : null
    const classroom_id = body.classroom_id ? BigInt(body.classroom_id) : null

    if (Boolean(classroom_id) === Boolean(student_id)) {
        console.log(classroom_id, student_id)
        throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")
    }

    const result = await dbProgressAssignSession({ session_id, session_status, user_id, classroom_id, student_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.delete("/session/assigned/:session_id", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    const session_id = BigInt(req.params.session_id)

    checkClassroomStudentExclusiveness({ classroom_id, student_id })
    const result = await dbProgressDeleteAssignedSession({ user_id, classroom_id, student_id, session_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.post("/session/completed/:session_id", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    const session_id = BigInt(req.params.session_id)

    const result = await dbProgressCompleteSession({ student_id, classroom_id, session_id, user_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

export default progressRouter
