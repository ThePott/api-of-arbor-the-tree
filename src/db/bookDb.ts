import prismaClient from "./prismaClient.js"
import type { BookWritePayload } from "../interfaces/interfaces.js"

export const dbCheckIfBookExists = async (title: string): Promise<boolean> => {
    const result = await prismaClient.book.findFirst({ where: { title } })
    return Boolean(result)
}

export const dbCreateBook = async ({ title, published_year, data }: BookWritePayload) => {
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
        const stepPromiseArray = stepArray.map((step) => {
            const stepPromise = prismaClient.step.create({ data: { title: step, topic_id } })
            return stepPromise
        })

        await Promise.all(stepPromiseArray)
    })

    await Promise.all(topicPromiseArray)

    return bookResult // TODO: 나중에 어떻게 보낼지 생각하자
}
