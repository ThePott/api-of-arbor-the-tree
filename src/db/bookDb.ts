import prismaClient from "./prismaClient.js"
import type { BookWritePayload } from "../interfaces/interfaces.js"

export const dbCheckIfBookExists = async (title: string): Promise<boolean> => {
    const result = await prismaClient.book.findFirst({ where: { title } })
    return Boolean(result)
}

const dbCreateBookWithConcurrency = async ({ title, published_year, data }: BookWritePayload) => {
    const groupedByTopic = Object.groupBy(data, ({ topic }) => topic)
    const topicArray = Object.keys(groupedByTopic)

    const bookResult = await prismaClient.book.create({ data: { title, published_year } })
    const book_id = bookResult.id
    const topicPromiseArray = topicArray.map(async (topic) => {
        const topicResult = await prismaClient.topic.create({ data: { title: topic, book_id } })
        const topic_id = topicResult.id
        const rowArrayOfTopic = groupedByTopic[topic]
        if (!rowArrayOfTopic) return

        const groupedByStep = Object.groupBy(rowArrayOfTopic, ({ step }) => step)
        const stepArray = Object.keys(groupedByStep)
        const stepPromiseArray = stepArray.map(async (step) => {
            const stepResult = await prismaClient.step.create({ data: { title: step, topic_id } })
            const step_id = stepResult.id
            const rowArrayOfStep = groupedByStep[step]
            if (!rowArrayOfStep) return
            await prismaClient.question.createMany({
                data: rowArrayOfStep.map((row) => ({
                    name: row.question_name,
                    page: Number(row.question_page),
                    solution_page: Number(row.solution_page),
                    step_id,
                })),
            })
        })

        await Promise.all(stepPromiseArray)
    })

    await Promise.all(topicPromiseArray)
}

const dbCreateBookWithRelation = async ({ title, published_year, data }: BookWritePayload) => {
    const groupedByTopic = Object.groupBy(data, ({ topic }) => topic)

    const bookResult = await prismaClient.book.create({
        data: {
            title,
            published_year,
            topics: {
                create: Object.entries(groupedByTopic).map(([topic, rowArrayOfTopic]) => ({
                    title: topic,
                    steps: {
                        create: Object.entries(Object.groupBy(rowArrayOfTopic!, ({ step }) => step)).map(
                            ([step, rowArrayOfStep]) => ({
                                title: step,
                                questions: {
                                    create: rowArrayOfStep!.map((row) => ({
                                        name: row.question_name,
                                        page: Number(row.question_page),
                                        solution_page: Number(row.solution_page),
                                    })),
                                },
                            })
                        ),
                    },
                })),
            },
        },
    })

    return bookResult // TODO: 나중에 어떻게 보낼지 생각하자
}

export const dbCreateBook = async ({ title, published_year, data }: BookWritePayload) => {
    // NOTE: 4초 -> 0.5초 미만
    dbCreateBookWithRelation({ title, published_year, data })

    // NOTE: 6초 -> 1.8초
    // dbCreateBookWithConcurrency({ title, published_year, data })
}
