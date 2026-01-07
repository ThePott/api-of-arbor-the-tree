import prismaClient from "./prismaClient.js"
import type {
    BookPayload,
    BookWritePayload,
    QuestionPayload,
    StepPayload,
    TopicPayload,
} from "../interfaces/interfaces.js"
import type { session_question } from "@/generated/prisma/browser.js"

export const dbCheckIfBookExists = async (title: string): Promise<boolean> => {
    const result = await prismaClient.book.findFirst({ where: { title } })
    return Boolean(result)
}

export const dbCreateBook = async ({
    title,
    published_year,
    data,
    user_id,
}: BookWritePayload & { user_id: number }) => {
    console.time("book write ____ payload conversion")
    const groupedByTopic = Object.groupBy(data, ({ topic }) => topic)
    const topicEntryArray = Object.entries(groupedByTopic)
    const sessionOrderArray = [...new Set(data.map((row) => row.session))]

    const topics: TopicPayload[] = topicEntryArray.reduce((acc, [topicTitle, rowArrayInTopic], topicIndex) => {
        const steps: StepPayload[] = Object.entries(Object.groupBy(rowArrayInTopic!, ({ step }) => step)).map(
            ([step, rowArrayInStep], stepIndex) => {
                const questions: QuestionPayload[] = rowArrayInStep!.map(
                    ({ question_name, question_page, solution_page, sub_question_name, session }, questionIndex) =>
                        ({
                            name: question_name,
                            order: questionIndex + 1,
                            page: Number(question_page),
                            solution_page: Number(solution_page),
                            session: Number(session),
                            sub_question_name,
                        }) as QuestionPayload
                )

                return {
                    title: step,
                    order: stepIndex + 1,
                    questions,
                } as StepPayload
            }
        )

        const topicPayload: TopicPayload = {
            title: topicTitle,
            order: topicIndex + 1,
            steps,
        } as TopicPayload
        return [...acc, topicPayload]
    }, [] as TopicPayload[])

    const bookPayload: BookPayload = { title, published_year, topics }
    console.timeEnd("book write ____ payload conversion")

    console.time("book write ____ book create")
    const bookResult = await prismaClient.book.create({
        data: {
            title: bookPayload.title,
            published_year: bookPayload.published_year,
            topics: {
                create: bookPayload.topics.map((topicPayload) => ({
                    title: topicPayload.title,
                    order: topicPayload.order,
                    steps: {
                        create: topicPayload.steps.map((stepPayload) => ({
                            title: stepPayload.title,
                            order: stepPayload.order,
                            questions: {
                                create: stepPayload.questions.map((questionPayload) => ({
                                    name: questionPayload.name,
                                    order: questionPayload.order,
                                    page: questionPayload.page,
                                    solution_page: questionPayload.solution_page,
                                })),
                            },
                        })),
                    },
                })),
            },
        },
        include: {
            topics: {
                include: {
                    steps: {
                        include: {
                            questions: true,
                        },
                    },
                },
            },
        },
    })
    console.timeEnd("book write ____ book create")

    console.time("book write ____ syllabus create")
    const syllabusResult = await prismaClient.syllabus.create({
        data: {
            user_id,
            book_id: bookResult.id,
            sessions: {
                create: sessionOrderArray.map((order) => ({
                    order: Number(order),
                })),
            },
        },
        include: {
            sessions: true,
        },
    })
    console.timeEnd("book write ____ syllabus create")

    console.time("book write ____ result conversion")
    const questionKeyToSessionOrder: Map<string, number> = new Map()
    const questionKeyToId: Map<string, bigint> = new Map()
    const sessionOrderToId: Map<number, bigint> = new Map()

    data.forEach((row) => {
        questionKeyToSessionOrder.set(`${row.topic}|${row.step}|${row.question_name}`, Number(row.session))
    })
    bookResult.topics.forEach((topic) => {
        topic.steps.forEach((step) => {
            step.questions.forEach((question) => {
                const questionKey = `${topic.title}|${step.title}|${question.name}`
                questionKeyToId.set(questionKey, question.id)
            })
        })
    })
    syllabusResult.sessions.forEach((session) => {
        sessionOrderToId.set(session.order, session.id)
    })

    const sessionQuestionArray: Omit<session_question, "id">[] = []
    for (const [questionKey, sessionOrder] of questionKeyToSessionOrder) {
        const question_id = questionKeyToId.get(questionKey)
        const session_id = sessionOrderToId.get(sessionOrder)

        if (!question_id || !session_id) throw new Error("---- mapping question and session id failed")

        sessionQuestionArray.push({ question_id, session_id })
    }
    console.timeEnd("book write ____ result conversion")

    console.time("book write ____ session quesion join create")
    await prismaClient.session_question.createMany({ data: sessionQuestionArray })
    console.timeEnd("book write ____ session quesion join create")
}

export const dbFindManyBook = async () => await prismaClient.book.findMany()

export const dbDeleteBook = async (id: number) => await prismaClient.book.delete({ where: { id } })
