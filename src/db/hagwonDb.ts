import prismaClient from "./prismaClient.js"

export const dbFindHagwonMany = async (name: string) =>
    prismaClient.hagwon.findMany({ where: { name: { contains: name } } })
