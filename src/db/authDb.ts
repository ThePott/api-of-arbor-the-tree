import type { SignupPayload, LoginProvider } from "../interfaces/interfaces.js"
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

export const dbCreateUser = async (signupPayload: SignupPayload) => {
    const result = await prismaClient.app_user.create({ data: signupPayload })
    const serializable = {
        ...result,
        id: result.id.toString(),
        kakao_id: result.kakao_id?.toString(),
    }
    return serializable
}

export const DEBUG_dbFindManyUser = async () => {
    const result = await prismaClient.app_user.findMany()
    const serializable = result.map((user) => ({
        ...user,
        id: user.id.toString(),
        kakao_id: user.kakao_id?.toString(),
    }))
    return serializable
}
