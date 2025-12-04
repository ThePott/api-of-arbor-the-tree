import type { SignupPayload, LoginProvider, LoginPayload } from "../interfaces/interfaces.js"
import prismaClient from "./prismaClient.js"

export const dbFindMe = async (loginProvider: LoginProvider, loginPayload: LoginPayload) => {
    switch (loginProvider) {
        case "kakao": {
            const kakao_id = loginPayload.kakao_id
            if (!kakao_id) {
                throw new Error("---- MISSING KAKAO ID")
            }
            return prismaClient.app_user.findUnique({ where: { kakao_id } })
        }
        case "email":
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

export const dbDeleteUser = async (id: number) => prismaClient.app_user.delete({ where: { id } })

export const DEBUG_dbFindManyUser = async () => {
    const result = await prismaClient.app_user.findMany()
    const serializable = result.map((user) => ({
        ...user,
        id: user.id.toString(),
        kakao_id: user.kakao_id?.toString(),
    }))
    return serializable
}
