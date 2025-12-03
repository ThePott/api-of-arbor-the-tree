import type { LoginProvider } from "../interfaces/interfaces.js"
import prismaClient from "./prismaClient.js"

export const dbFindUserWithLogin = async (loginProvider: LoginProvider, idInString: string, password?: string) => {
    switch (loginProvider) {
        case "kakao": {
            const id = Number(idInString)
            return prismaClient.app_user.findUnique({ where: { id } })
        }
        case "email":
            console.log({ password })
            return undefined
    }
}

// export const createUser = async (user: User) => prismaClient.User.create(user)

export const DEBUG_dbFindManyUser = async () => prismaClient.app_user.findMany()
