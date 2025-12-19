import { PrismaPg } from "@prisma/adapter-pg"
import { checkEnvVar } from "../utils/checkEnvVar.js"
import { PrismaClient } from "../../generated/prisma/client.js"

const connectionString = checkEnvVar(process.env.DATABASE_URL)
const adapter = new PrismaPg({ connectionString })
const prismaClient = new PrismaClient({ adapter, omit: { app_user: { password: true } } })

export default prismaClient
