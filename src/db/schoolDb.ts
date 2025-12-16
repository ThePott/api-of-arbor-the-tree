import prismaClient from "./prismaClient.js"

export const dbFindManySchool = async (name: string) =>
    prismaClient.school.findMany({ where: { name: { contains: name } } })
