import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../generated/prisma/client.js"
import { DATABASE_URL } from "../config/env.js"

const connectionString = DATABASE_URL
const adapter = new PrismaPg({ connectionString })
const prismaClient = new PrismaClient({ adapter, omit: { app_user: { password: true } } })

export default prismaClient
