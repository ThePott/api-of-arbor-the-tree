import type { role } from "@/generated/prisma/enums.js"
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
    const { name, role, phone_number, hagwon, school } = mePatchPayload

    await prismaClient.app_user.update({
        where: { id },
        data: { ...(name && { name }), ...(phone_number && { phone_number }) },
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

export const dbAcceptResume = async (id: number) => {
    const user = await prismaClient.app_user.findUnique({ where: { id } })
    const resume = await prismaClient.resume.findUnique({ where: { user_id: id } })

    if (!user) throw new Error("---- 유저가 없는데")
    if (!resume) throw new Error("---- 지원서가 없는데?")

    if (user.role && resume.role && user.role !== resume.role) {
        switch (user.role) {
            case "STUDENT":
                await prismaClient.student.delete({ where: { user_id: id } })
                break
            case "PARENT":
                await prismaClient.parent.delete({ where: { user_id: id } })
                break
            case "PRINCIPAL":
                await prismaClient.principal.delete({ where: { user_id: id } })
                break
            case "HELPER":
                await prismaClient.helper.delete({ where: { user_id: id } })
                break
            case "MAINTAINER":
                throw new Error("---- 이거를 어찌 하셨소?")
        }
    }

    if (!resume.role) return

    let school = resume.school_name
        ? await prismaClient.school.findFirst({ where: { name: resume.school_name } })
        : null
    if (!school && resume.school_name) {
        school = await prismaClient.school.create({ data: { name: resume.school_name } })
    }

    let hagwon = resume.hagwon_name
        ? await prismaClient.hagwon.findFirst({ where: { name: resume.hagwon_name } })
        : null
    if (!hagwon && resume.hagwon_name) {
        hagwon = await prismaClient.hagwon.create({ data: { name: resume.hagwon_name } })
    }

    switch (resume.role) {
        case "STUDENT":
            await prismaClient.student.create({ data: {} })
            break
        case "PARENT":
            break
        case "PRINCIPAL":
            break
        case "HELPER":
            break
        case "MAINTAINER":
            throw new Error("---- 이걸 고르는 일은 없어야 해")
    }
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
