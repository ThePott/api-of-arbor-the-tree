import { Router } from "express"
import {
    dbProgressCreateSyllabus,
    dbProgressDeleteSyllabus,
    dbProgressFindManySyllabus,
    dbProgressFindManySyllabusAssigned,
    dbProgressFindManySyllabusWithSession,
} from "../db/index.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import type { session_question } from "@/generated/prisma/client.js"

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
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null

    if (!classroom_id && !student_id) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    const result = await dbProgressFindManySyllabusAssigned({ classroom_id, student_id })
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

type TopicStep = {
    topic: string | undefined
    step: string | undefined
}
type ExtendedSession = {
    id: bigint
    sessionQuestions: {
        question: {
            step: {
                title: string
                topic: {
                    title: string
                } | null
            } | null
        }
    }[]
}

const extractUnqueTopicStepArray = (session: ExtendedSession): TopicStep[] => {
    const topicStepArray = [
        ...new Set(
            session.sessionQuestions.map(
                (sessionQuestion) =>
                    `${sessionQuestion.question.step?.topic?.title}____${sessionQuestion.question.step?.title}`
            )
        ),
    ].map((stringified) => {
        const splitted = stringified.split("____")
        return {
            topic: splitted[0],
            step: splitted[1],
        }
    })
    return topicStepArray
}
const summarizeTopicStepArray = (topicStepArray: TopicStep[]): string => {
    const topicStepJoint = " __"
    const firstLastJoint = " ~ "

    const first = topicStepArray[0]
    const last = topicStepArray[topicStepArray.length - 1]
    if (!first) throw ApiError.Internal("묶음 이름을 정리하는 데에 문제가 생겼어요")
    if (!last) throw ApiError.Internal("묶음 이름을 정리하는 데에 문제가 생겼어요")

    if (topicStepArray.length === 0) throw ApiError.Internal("묶음 단원 정보를 정리하는 데에 실패했어요")
    if (topicStepArray.length === 1) return `${first.topic}${topicStepJoint}${first.step}`
    if (first.topic !== last.topic) {
        return `${first.topic}${topicStepJoint}${first.step}${firstLastJoint}${last.topic}${topicStepJoint}${last.step}`
    }

    return `${first.topic}${topicStepJoint}${first.step}${firstLastJoint}${last.step}`
}
const summarizeSesion = (session: ExtendedSession): string => {
    const uniqueTopicStepArray = extractUnqueTopicStepArray(session)
    const summarized = summarizeTopicStepArray(uniqueTopicStepArray)
    return summarized
}

progressRouter.get("/session", async (req, res) => {
    const syllabus_id = req.query.syllabus_id ? BigInt(String(req.query.syllabus_id)) : null
    const classroom_id = req.query.classroom_id ? BigInt(String(req.query.classroom_id)) : null
    const student_id = req.query.student_id ? BigInt(String(req.query.student_id)) : null

    const user_id = extractUserId(req.headers)

    const duplicatedResult = await dbProgressFindManySyllabusWithSession({
        classroom_id,
        syllabus_id,
        student_id,
        user_id,
    })

    const conciseResult = duplicatedResult.map((el) => ({
        id: el.id,
        book: el.book,
        sessions: el.sessions.map((elSession) => ({
            id: elSession.id,
            topic_step: summarizeSesion(elSession),
        })),
    }))

    const serializable = makeSerializable(conciseResult)
    res.status(200).json(serializable)
    // res.status(200).send()
})

export default progressRouter
