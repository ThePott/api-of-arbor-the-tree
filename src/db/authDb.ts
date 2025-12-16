import type { SignupPayload, LoginProvider, LoginPayload, MePatchPayload } from "../interfaces/interfaces.js"
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

    const hagwonResult = hagwon ? await prismaClient.hagwon.findUnique({ where: { name: hagwon } }) : null

    if (role === "MAINTAINER") {
        return
    }
    if (role === "PARENT") {
        throw new Error("---- 학부모 기능은 구현되지 않았습니다")
    }

    if (role === "PRINCIPAL") {
        // TODO: 개인 정보만 수정하는 건 위에서 처리했으니 여기에서는 없어야 한다
        const existingPrincipal = await prismaClient.principal.findUnique({ where: { user_id: id } })

        if (!existingPrincipal) {
            if (hagwon && !hagwonResult) {
                // NOTE: 원장 및 학원 신규 등록
                const newHagwonResult = await prismaClient.hagwon.create({ data: { name: hagwon } })
                await prismaClient.principal.create({
                    data: { hagwon_id: newHagwonResult.id, user_id: id },
                })
                return
            }

            throw new Error("---- Bad Request")
        }

        if (hagwonResult && existingPrincipal.hagwon_id !== hagwonResult.id) {
            throw new Error("---- Bad Request")
        }

        await prismaClient.hagwon.update({
            where: { id: existingPrincipal.hagwon_id },
            data: { name: hagwon ?? null },
        })
        return
    }

    if (!hagwonResult) {
        return
    }

    if (role === "HELPER") {
        await prismaClient.helper.upsert({
            where: { user_id: id },
            update: { hagwon_id: hagwonResult.id },
            create: { hagwon_id: hagwonResult.id, user_id: id },
        })
        return
    }

    if (role === "STUDENT") {
        await prismaClient.student.upsert({
            where: { user_id: id },
            update: { hagwon_id: hagwonResult.id },
            create: { hagwon_id: hagwonResult.id, user_id: id, school: school ?? "이게 보이면 안 됩니다" },
        })
        if (school) {
            await prismaClient.student.update({ where: { user_id: id }, data: { school } })
        }
        return
    }

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
