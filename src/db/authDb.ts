import type { role } from "@/generated/prisma/enums.js"
import { AppError } from "../errors/AppError.js"
import type { SignupPayload, LoginProvider, LoginPayload, MePatchPayload } from "../interfaces/interfaces.js"
import prismaClient from "./prismaClient.js"
import bcrypt from "bcrypt"

export const dbFindMeInLogin = async (loginProvider: LoginProvider, loginPayload: LoginPayload) => {
    switch (loginProvider) {
        case "kakao": {
            const kakao_id = loginPayload.kakao_id
            if (!kakao_id) {
                throw new Error("---- MISSING KAKAO ID")
            }
            return prismaClient.app_user.findUnique({ where: { kakao_id } })
        }
        case "email": {
            const { email, password } = loginPayload
            if (!email || !password) throw AppError.BadRequest("이메일 혹은 비밀번호를 다시 확인해주세요")

            const result = await prismaClient.app_user.findUnique({ where: { email } })
            if (!result) throw AppError.NotFound("이메일 혹은 비밀번호를 다시 확인해주세요")

            const { password: hashedPassword, ...rest } = result
            if (!hashedPassword) throw AppError.Internal("알 수 없는 오류가 발생했어요")

            const isMatch = await bcrypt.compare(password, hashedPassword)
            if (!isMatch) throw AppError.BadRequest("이메일 혹은 비밀번호를 다시 확인해주세요")

            return rest
        }
    }
}

export const dbFindMe = async (id: number) => {
    const result = await prismaClient.app_user.findUnique({ where: { id } })

    const additional_info: { school_name: string | null; hagwon_name: string | null } = {
        school_name: null,
        hagwon_name: null,
    }
    if (result && result.role === "PRINCIPAL") {
        const principalResult = await prismaClient.principal.findUnique({
            where: { user_id: id },
            select: { hagwon: { select: { name: true } } },
        })
        additional_info.hagwon_name = principalResult?.hagwon.name ?? null
    }
    if (result && result.role === "STUDENT") {
        const studentResult = await prismaClient.student.findUnique({
            where: { user_id: id },
            select: {
                hagwon: { select: { name: true } },
                school: { select: { name: true } },
            },
        })
        additional_info.hagwon_name = studentResult?.hagwon.name ?? null
        additional_info.school_name = studentResult?.school.name ?? null
    }

    const resume = await prismaClient.resume.findUnique({ where: { user_id: id } })

    return { result, resume, additional_info }
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
}

export const dbAcceptResume = async (id: number) => {
    const user = await prismaClient.app_user.findUnique({ where: { id } })
    const resume = await prismaClient.resume.findUnique({ where: { user_id: id } })

    if (!user) throw new Error("---- 유저가 없는데")
    if (!resume) throw new Error("---- 지원서가 없는데?")

    // NOTE: 권한이 바뀐다면 이전 권한의 원장(학생) 행 삭제
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

    // NOTE: 새 권한으로 유저 정보 갱신
    await prismaClient.app_user.update({ where: { id }, data: { role: resume.role } })

    // NOTE: 입력된 이름에 해당하는 학교, 학원 결과 (없으면 새로 만듦)
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

    // NOTE: 권한에 맞게 새 원장(학생) 행 추가
    switch (resume.role) {
        case "STUDENT":
            await prismaClient.student.create({ data: { hagwon_id: hagwon!.id, user_id: id, school_id: school!.id } })
            break
        case "PARENT":
            break
        case "PRINCIPAL":
            await prismaClient.principal.create({ data: { hagwon_id: hagwon!.id, user_id: id } })
            break
        case "HELPER":
            break
        case "MAINTAINER":
            throw new Error("---- 이걸 고르는 일은 없어야 해")
    }

    // NOTE: resume 삭제
    await prismaClient.resume.delete({ where: { user_id: id } })
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

export const dbFindManyResume = async (user_id: bigint) => {
    const user = await prismaClient.app_user.findUnique({ where: { id: user_id } })
    const allowedRoleArray: role[] = ["MAINTAINER", "PRINCIPAL"]
    const allowedCondition = user && user.role && allowedRoleArray.includes(user.role)
    if (!allowedCondition) throw AppError.Forbidden("이 기능은 이용할 수 없어요")

    if (user.role === "MAINTAINER") {
        const result = await prismaClient.resume.findMany()
        return result
    }

    const principal = await prismaClient.principal.findUnique({
        where: { user_id },
        include: { hagwon: true },
    })

    if (!principal || !principal.hagwon.name) throw AppError.Forbidden("이 기능은 이용할 수 없어요")
    const result = await prismaClient.resume.findMany({ where: { hagwon_name: principal.hagwon.name } })
    return result
}
