import { ApiError } from "@/src/errors/appError/AppError.js"

const SessionCondensingError = ApiError.Internal("묶음 이름을 정리하는 데에 문제가 생겼어요")

type TopicStep = {
    topic: string
    step: string
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
type ConciseSession = {
    start: TopicStep
    end: Partial<TopicStep>
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
const condenseTopicStepArray = (topicStepArray: TopicStep[]): ConciseSession => {
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
        result.push(current)
        current = {
            title: session.start.topic,
            conciseSessionArray: [session],
        }
    })
    return result
}
const groupSessionsByTopic = (sessionArray: ExtendedSession[]) => {
    const conciseSessionArray = sessionArray.map((session) => {
        const uniqueTopicStepArray = extractUnqueTopicStepArray(session)
        return condenseTopicStepArray(uniqueTopicStepArray)
    })
    const sessionsByTopic = groupConciseSessionsByTopic(conciseSessionArray)

    return sessionsByTopic
}

export default groupSessionsByTopic
