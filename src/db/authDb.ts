import type { SignupPayload, LoginProvider, LoginPayload, MePatchPayload } from "../interfaces/interfaces.js"
import prismaClient from "./prismaClient.js"

export const dbFindMeInLogin = async (loginProvider: LoginProvider, loginPayload: LoginPayload) => {
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

export const dbFindMe = async (id: number) => {
    const result = await prismaClient.app_user.findUnique({ where: { id } })
    const resume = await prismaClient.resume.findUnique({ where: { user_id: id } })
    return { result, resume }
}

export const dbCreateMe = async (signupPayload: SignupPayload) => {
    const result = await prismaClient.app_user.create({ data: signupPayload })
    const serializable = {
        ...result,
        id: result.id.toString(),
        kakao_id: result.kakao_id?.toString(),
    }
    return serializable
}

export const dbPatchMe = async (id: number, mePatchPayload: MePatchPayload) => {
    const {
        name,
        role,
        phone_number,
        hagwon,
        // children,
        school,
    } = mePatchPayload

    const userUpdateData = Object.fromEntries(Object.entries({ name, role, phone_number }).filter(([, value]) => value))

    await prismaClient.app_user.update({
        where: { id },
        data: userUpdateData,
    })

    await prismaClient.resume.upsert({
        where: { user_id: id },
        update: {
            ...(hagwon && { hagwon_name: hagwon }),
            ...(school && { school_name: school }),
        },
        create: {
            user_id: id,
            role: role!,
            hagwon_name: hagwon!,
            ...(school && { school_name: school }),
        },
    })

    throw new Error("---- Unknown Error")
}

export const dbDeleteMe = async (id: number) => prismaClient.app_user.delete({ where: { id } })

export const DEBUG_dbFindManyUser = async () => {
    const result = await prismaClient.app_user.findMany()
    const serializable = result.map((user) => ({
        ...user,
        id: user.id.toString(),
        kakao_id: user.kakao_id?.toString(),
    }))
    return serializable
}
