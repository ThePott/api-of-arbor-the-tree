import type { role } from "@/generated/prisma/enums.js"
import { ApiError } from "../errors/appError/AppError.js"
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
            if (!email || !password) throw ApiError.BadRequest("이메일 혹은 비밀번호를 다시 확인해주세요")

            const result = await prismaClient.app_user.findUnique({ where: { email }, omit: { password: false } })
            if (!result) throw ApiError.NotFound("이메일 혹은 비밀번호를 다시 확인해주세요")

            const { password: hashedPassword, ...rest } = result
            if (!hashedPassword) throw ApiError.Internal("알 수 없는 오류가 발생했어요")

            const isMatch = await bcrypt.compare(password, hashedPassword)
            if (!isMatch) throw ApiError.BadRequest("이메일 혹은 비밀번호를 다시 확인해주세요")

            return rest
        }
    }
}

export const dbFindMe = async (id: bigint) => {
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
    return result
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

type DbAcceptResumeProps = { resume_id: bigint }
export const dbAcceptResume = async ({ resume_id }: DbAcceptResumeProps) => {
    const resume = await prismaClient.resume.findUnique({ where: { id: resume_id }, include: { users: true } })
    if (!resume) throw ApiError.NotFound("해당 지원서를 못 찾았어요")

    // NOTE: 이전 권한이 존재한다면...
    // NOTE: 이전 권한은 지움
    // NOTE: 업데이트하지 않고 통으로 지우는 이유
    // NOTE: 학원 이름, 학교 이름만 받기 때문에 이들이 아직 db에 저장되어 있지 않다면 id를 뽑아올 수가 없음
    if (resume.users.role && resume.role) {
        switch (resume.users.role) {
            case "STUDENT":
                await prismaClient.student.delete({ where: { user_id: resume.users.id } })
                break
            case "PARENT":
                await prismaClient.parent.delete({ where: { user_id: resume.users.id } })
                break
            case "PRINCIPAL":
                await prismaClient.principal.delete({ where: { user_id: resume.users.id } })
                break
            case "HELPER":
                await prismaClient.helper.delete({ where: { user_id: resume.users.id } })
                break
            case "MAINTAINER":
                throw new Error("---- 이거를 어찌 하셨소?")
        }
    }

    // NOTE: 새 권한으로 유저 정보 갱신
    await prismaClient.app_user.update({ where: { id: resume.users.id }, data: { role: resume.role } })

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
            await prismaClient.student.create({
                data: { hagwon_id: hagwon!.id, user_id: resume.users.id, school_id: school!.id },
            })
            break
        case "PARENT":
            break
        case "PRINCIPAL":
            await prismaClient.principal.create({ data: { hagwon_id: hagwon!.id, user_id: resume.users.id } })
            break
        case "HELPER":
            break
        case "MAINTAINER":
            throw new Error("---- 이걸 고르는 일은 없어야 해")
    }

    // NOTE: resume 삭제
    await prismaClient.resume.delete({ where: { id: resume_id } })
}

export const dbDeleteMe = async (id: number) => prismaClient.app_user.delete({ where: { id } })

export const dbFindManyResume = async (user_id: bigint) => {
    const user = await prismaClient.app_user.findUnique({
        where: { id: user_id },
        include: { principal: { include: { hagwon: true } } },
    })

    const allowedRoleArray: role[] = ["MAINTAINER", "PRINCIPAL"]
    if (!user) throw ApiError.NotFound("사용자를 찾을 수 없어요")
    const allowedCondition = user.role && allowedRoleArray.includes(user.role)
    if (!allowedCondition) throw ApiError.Forbidden("이 기능을 쓰려면 권한이 필요해요")

    if (user.role === "MAINTAINER") {
        const result = await prismaClient.resume.findMany({ include: { users: true }, orderBy: { applied_at: "desc" } })
        return result
    }

    if (!user.principal || !user.principal.hagwon.name) throw ApiError.Internal("원장 정보에 문제가 있어요")
    const result = await prismaClient.resume.findMany({
        where: { hagwon_name: user.principal.hagwon.name },
        include: { users: true },
    })
    return result
}

export const dbFindManyUser = async (user_id: bigint) => {
    const user = await prismaClient.app_user.findUnique({
        where: { id: user_id },
        include: { principal: { include: { hagwon: true } } },
    })

    const allowedRoleArray: role[] = ["MAINTAINER", "PRINCIPAL"]
    if (!user) throw ApiError.NotFound("사용자를 찾을 수 없어요")
    const allowedCondition = user.role && allowedRoleArray.includes(user.role)
    if (!allowedCondition) throw ApiError.Forbidden("이 기능을 쓰려면 권한이 필요해요")

    if (user.role === "MAINTAINER") {
        const result = await prismaClient.app_user.findMany({
            where: { NOT: { id: user_id } },
            // TODO: 필요 없으면 삭제하자
            // include: {
            //     principal: true,
            //     helper: true,
            //     student: true,
            //     parent: true,
            // },
        })
        return result
    }

    if (!user.principal || !user.principal.hagwon.name) throw ApiError.Internal("원장 정보에 문제가 있어요")
    const result = await prismaClient.app_user.findMany({
        where: {
            OR: [
                { student: { hagwon_id: user.principal.hagwon_id } },
                { helper: { hagwon_id: user.principal.hagwon_id } },
            ],
        },
        include: {
            // TODO: 필요 없으면 삭제하자
            // helper: true,
            // student: true,
            // NOTE: 넣는게 좋을지 아닐지 모르겠다
            // principal: true,
            // parent: true,
        },
    })
    return result
}

export const dbDeleteUser = async (user_id: bigint) => {
    await prismaClient.app_user.delete({ where: { id: user_id } })
}
