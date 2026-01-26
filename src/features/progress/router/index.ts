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
import type { book } from "@/generated/prisma/client.js"

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
const summarizeTopicStepArray = (topicStepArray: TopicStep[]): ConciseSession => {
    const first = topicStepArray[0]
    const last = topicStepArray[topicStepArray.length - 1]
    if (!first) throw ApiError.Internal("묶음 이름을 정리하는 데에 문제가 생겼어요")
    if (!last) throw ApiError.Internal("묶음 이름을 정리하는 데에 문제가 생겼어요")

    if (topicStepArray.length === 0) throw ApiError.Internal("묶음 단원 정보를 정리하는 데에 실패했어요")
    if (!first.topic || !first.step) throw ApiError.Internal("묶음 단원 정보를 정리하는 데에 실패했어요")

    if (topicStepArray.length === 1) return { firstTopic: first.topic, firstStep: first.step }

    if (first.topic === last.topic) {
        return {
            firstTopic: first.topic,
            firstStep: first.step,
            lastStep: last.step,
        }
    }

    return {
        firstTopic: first.topic,
        firstStep: first.step,
        lastTopic: last.topic,
        lastStep: last.step,
    }
}
type ConciseSession = {
    firstTopic: string
    firstStep: string
    lastTopic?: string | undefined
    lastStep?: string | undefined
}

type GroupedTopic = {
    title: string
    conciseSessionArray: ConciseSession[]
}
type GroupedConciseSyllabus = {
    id: bigint
    book: book
    topicWithSession: GroupedTopic[]
}
const groupByTopic = (conciseSessionArray: ConciseSession[]) => {
    const grouped = Object.groupBy(conciseSessionArray, ({ firstTopic }) => firstTopic)
    const groupedTopic: GroupedTopic[] = Object.entries(grouped).map(([key, value]) => ({
        title: key,
        conciseSessionArray: value,
    }))

    return groupedTopic
}

const summarizeSesion = (session: ExtendedSession) => {
    const uniqueTopicStepArray = extractUnqueTopicStepArray(session)
    const conciseSession = summarizeTopicStepArray(uniqueTopicStepArray)
    return conciseSession
}

const groupSessionsByTopic = (sessionArray: ExtendedSession[]) => {
    const result: GroupedTopic[] = []
    let current: GroupedTopic | null = null
    const summarizedSessionArray = sessionArray.map((elSession) => summarizeSesion(elSession))
    summarizedSessionArray.forEach((session) => {
        if (!current) {
            current = {
                title: session.firstTopic,
                conciseSessionArray: [session],
            }
            return
        }
        if (current.title === session.firstTopic) {
            current.conciseSessionArray.push(session)
            return
        }
        result.push(current)
        current = {
            title: session.firstTopic,
            conciseSessionArray: [session],
        }
    })

    return result
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
        sessionsByTopic: groupSessionsByTopic(el.sessions),
    }))

    const serializable = makeSerializable(conciseResult)
    res.status(200).json(serializable)
})

export default progressRouter
