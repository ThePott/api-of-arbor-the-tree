import { PrismaClient } from "@/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import { checkEnvVar } from "../utils/checkEnvVar.js"

const connectionString = checkEnvVar(process.env.DATABASE_URL)
const adapter = new PrismaPg({ connectionString })
const prismaClient = new PrismaClient({ adapter })

export default prismaClient
