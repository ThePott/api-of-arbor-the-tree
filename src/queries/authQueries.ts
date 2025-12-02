import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const prismaUserFindMany = async () => prisma.app_user.findMany()

export const prismaUserCreate = async (user: app_user) => prisma.app_user.create({ data: user })
