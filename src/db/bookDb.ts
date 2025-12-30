import prismaClient from "./prismaClient.js"
import type { BookWritePayload } from "../interfaces/interfaces.js"

export const dbCheckIfBookExists = async (title: string): Promise<boolean> => {
    const result = await prismaClient.book.findFirst({ where: { title } })
    return Boolean(result)
}

export const dbCreateBook = async ({ title, published_year, data }: BookWritePayload) => {
    const groupedByTopic = Object.groupBy(data, ({ topic }) => topic)

    await prismaClient.book.create({
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
}
