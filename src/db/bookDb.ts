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
    const topicPromiseArray = topicArray.map((topic) => {
        return prismaClient.topic.create({ data: { title: topic, book_id } })
    })
    const topicResolvedArray = await Promise.all(topicPromiseArray)
    console.log("---- topics created")

    return bookResult // TODO: 나중에 어떻게 보낼지 생각하자
}
