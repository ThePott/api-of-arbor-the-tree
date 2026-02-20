import type { session_status } from "@/generated/prisma/enums.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

const SessionCondensingError = ApiError.Internal("묶음 이름을 정리하는 데에 문제가 생겼어요")

type TopicStep = {
    topic: string
    step: string
}
type ExtendedSessionBase = {
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
type WithAssignedSessionClassrooms = {
    assignedSessionClassrooms: {
        status: session_status
        assigned_at: Date
    }[]
    completedSessionClassrooms: {
        completed_at: Date
    }[]
}
type WithAssignedSessionStudents = {
    assignedSessionStudents: {
        status: session_status
        assigned_at: Date
    }[]
    completedSessionStudents: {
        completed_at: Date
    }[]
}
type ExtendedSession =
    | (ExtendedSessionBase & WithAssignedSessionClassrooms)
    | (ExtendedSessionBase & WithAssignedSessionStudents)
type ConciseSession = {
    id: bigint
    start: TopicStep
    end: Partial<TopicStep>
    completed_at: Date | null
    status: session_status | null
    assigned_at: Date | null // NOTE: status가 없으면 assinged_at이 null이다
}
type GroupedTopic = {
    title: string
    conciseSessionArray: ConciseSession[]
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
        if (!splitted[0] || !splitted[1]) throw SessionCondensingError
        return {
            topic: splitted[0],
            step: splitted[1],
        }
    })
    return topicStepArray
}
const condenseTopicStepArray = (topicStepArray: TopicStep[]): Pick<ConciseSession, "start" | "end"> => {
    const start = topicStepArray[0]
    const end = topicStepArray[topicStepArray.length - 1]
    if (!start) throw ApiError.Internal("묶음 이름을 정리하는 데에 문제가 생겼어요")
    if (!end) throw ApiError.Internal("묶음 이름을 정리하는 데에 문제가 생겼어요")

    if (topicStepArray.length === 0) throw ApiError.Internal("묶음 단원 정보를 정리하는 데에 실패했어요")
    if (!start.topic || !start.step) throw ApiError.Internal("묶음 단원 정보를 정리하는 데에 실패했어요")

    if (topicStepArray.length === 1) return { start, end: {} }

    if (start.topic === end.topic) {
        return {
            start,
            end: { step: end.step },
        }
    }

    return { start, end }
}
const groupConciseSessionsByTopic = (conciseSessionArray: ConciseSession[]) => {
    const result: GroupedTopic[] = []
    let current: GroupedTopic | null = null
    conciseSessionArray.forEach((session) => {
        if (!current) {
            current = {
                title: session.start.topic,
                conciseSessionArray: [session],
            }
            return
        }
        if (current.title === session.start.topic) {
            current.conciseSessionArray.push(session)
            return
        }

        // NOTE: 새로운 게 생겼으면 지금까지의 current를 result에 합치고
        result.push(current)
        // NOTE: 새 current를 만들어 여기에 쌓기 시작한다
        current = {
            title: session.start.topic,
            conciseSessionArray: [session],
        }
    })
    // NOTE: 그리고 다 끝나면 마지막으로 쌓인 current도 result에 합친다
    if (current) {
        result.push(current)
    }
    return result
}
const groupSessionsByTopic = (sessionArray: ExtendedSession[]) => {
    const conciseSessionArray: ConciseSession[] = sessionArray.map((session) => {
        const uniqueTopicStepArray = extractUnqueTopicStepArray(session)
        return {
            ...condenseTopicStepArray(uniqueTopicStepArray),
            id: session.id,
            status:
                "assignedSessionClassrooms" in session
                    ? (session.assignedSessionClassrooms[0]?.status ?? null)
                    : "assignedSessionStudents" in session
                      ? (session.assignedSessionStudents[0]?.status ?? null)
                      : null,
            completed_at:
                "completedSessionClassrooms" in session
                    ? (session.completedSessionClassrooms[0]?.completed_at ?? null)
                    : "completedSessionStudents" in session
                      ? (session.completedSessionStudents[0]?.completed_at ?? null)
                      : null,
            assigned_at:
                "assignedSessionClassrooms" in session
                    ? (session.assignedSessionClassrooms[0]?.assigned_at ?? null)
                    : "assignedSessionStudents" in session
                      ? (session.assignedSessionStudents[0]?.assigned_at ?? null)
                      : null,
        }
    })
    const sessionsByTopicArray = groupConciseSessionsByTopic(conciseSessionArray)

    return sessionsByTopicArray
}

export default groupSessionsByTopic
