import type { book } from "@/generated/prisma/client.js"
import prismaClient from "./prismaClient.js"

export const dbCheckIfBookExists = async (title: string): Promise<boolean> => {
    const result = await prismaClient.book.findFirst({ where: { title } })
    return Boolean(result)
}

export const dbCreateBook = async ({ title, published_year }: Omit<book, "id">) => {
    const result = await prismaClient.book.create({ data: { title, published_year } })
    debugger
    return result
}
