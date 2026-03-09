import { Router } from "express"
import {
    dbProgressAssignSession,
    dbProgressCreateCompleteSession,
    dbProgressCreateSyllabus,
    dbProgressDeleteAssignedSession,
    dbProgressDeleteCompleteSession,
    dbProgressDeleteSyllabus,
    dbProgressFindManySyllabus,
    dbProgressFindManySyllabusAssigned,
    dbProgressFindManySyllabusWithSessions,
} from "../db/index.js"
import { extractPermission } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import type { session_status } from "@/generated/prisma/enums.js"
import groupSessionsByTopic from "./utils/session.js"
import { checkClassroomStudentExclusiveness } from "../utils/classroomStudentErrors.js"
import { validatePermission } from "@/src/utils/make-allowed-role-array.js"

const progressRouter = Router()

// NOTE: auto complete에 사용할 실라버스 받아와야
progressRouter.get("/syllabus", async (req, res) => {
    const { role, hagwon_id } = extractPermission(req.headers)
    validatePermission({ minimumRole: "HELPER", currentRole: role })
    const result = await dbProgressFindManySyllabus(hagwon_id)
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

// NOTE: 과정 추가할 때
progressRouter.post("/syllabus/assigned", async (req, res) => {
    const body = req.body // NOTE: book_id, classroom_id, student_id
    const { hagwon_id, role } = extractPermission(req.headers)
    validatePermission({ minimumRole: "HELPER", currentRole: role })

    const { classroom_id, student_id } = body
    if ((classroom_id && student_id) || (!classroom_id && !student_id))
        throw ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")

    const result = await dbProgressCreateSyllabus({ ...body, hagwon_id })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

// NOTE: 학생, 반한테 등록된 실라버스를 받아올 때 (사이드바 학생별 실라보스 목록) << 학생도 이거 받는다
progressRouter.get("/syllabus/assigned", async (req, res) => {
    const { hagwon_id, role } = extractPermission(req.headers)
    validatePermission({ minimumRole: "PARENT", currentRole: role })

    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    if (!classroom_id && !student_id) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    const result = await dbProgressFindManySyllabusAssigned({ hagwon_id, classroom_id, student_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.delete("/syllabus/assigned/:syllabus_id", async (req, res) => {
    const { user_id, hagwon_id, role } = extractPermission(req.headers)
    validatePermission({ minimumRole: "PRINCIPAL", currentRole: role })

    const syllabus_id = BigInt(req.params.syllabus_id)
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null

    const result = await dbProgressDeleteSyllabus({ user_id, hagwon_id, classroom_id, student_id, syllabus_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

// TODO: rename route to `syllabus-with-sessions` << 구체적인 진도표 (3열)
progressRouter.get("/syllabus-with-sessions", async (req, res) => {
    const { hagwon_id, role } = extractPermission(req.headers)
    validatePermission({ minimumRole: "PARENT", currentRole: role })

    const syllabus_id = req.query.syllabus_id ? BigInt(String(req.query.syllabus_id)) : null
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null

    const syllabusArray = await dbProgressFindManySyllabusWithSessions({
        hagwon_id,
        classroom_id,
        syllabus_id,
        student_id,
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
    const { hagwon_id, role } = extractPermission(req.headers)
    validatePermission({ minimumRole: "HELPER", currentRole: role })

    const body = req.body
    const session_id = BigInt(body.session_id)
    const session_status = body.session_status as session_status
    const student_id = body.student_id ? BigInt(body.student_id) : null
    const classroom_id = body.classroom_id ? BigInt(body.classroom_id) : null

    if (Boolean(classroom_id) === Boolean(student_id)) {
        console.log(classroom_id, student_id)
        throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")
    }

    const result = await dbProgressAssignSession({
        hagwon_id,
        session_id,
        session_status,
        classroom_id,
        student_id,
    })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.delete("/session/assigned/:session_id", async (req, res) => {
    const { hagwon_id, role } = extractPermission(req.headers)
    validatePermission({ minimumRole: "HELPER", currentRole: role })

    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    const session_id = BigInt(req.params.session_id)

    checkClassroomStudentExclusiveness({ classroom_id, student_id })
    const result = await dbProgressDeleteAssignedSession({ hagwon_id, classroom_id, student_id, session_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.post("/session/:session_id/completed", async (req, res) => {
    const { hagwon_id, role } = extractPermission(req.headers)
    validatePermission({ minimumRole: "HELPER", currentRole: role })

    const session_id = BigInt(req.params.session_id)
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null

    const result = await dbProgressCreateCompleteSession({ student_id, classroom_id, session_id, hagwon_id })
    const serializable = makeSerializable(result)

    res.status(200).json(serializable)
})

progressRouter.delete("/session/:session_id/completed", async (req, res) => {
    const { hagwon_id, role } = extractPermission(req.headers)
    validatePermission({ minimumRole: "HELPER", currentRole: role })

    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null
    const session_id = BigInt(req.params.session_id)

    const result = await dbProgressDeleteCompleteSession({ classroom_id, session_id, student_id, hagwon_id })
    const serialiazable = makeSerializable(result)

    res.status(200).json(serialiazable)
})

export default progressRouter
