import { Router } from "express"
import axios from "axios"
import type { LoginPayload, SignupPayload } from "../interfaces/interfaces.js"
import {
    dbAcceptResume,
    dbCreateMe,
    dbDeleteMe,
    dbDeleteUser,
    dbFindManyResume,
    dbFindManyUser,
    dbFindMe,
    dbFindMeInLogin,
    dbPatchMe,
} from "../db/authDb.js"
import { makeSerializable, mutateToSerializable } from "../utils/makeSerializable.js"
import { extractAccessToken } from "../utils/extractAccessToken.js"
import bcrypt from "bcrypt"
import { ApiError } from "../errors/appError/AppError.js"
import jwt from "jsonwebtoken"
import {
    KAKAO_REQUEST_TOKEN_URL,
    KAKAO_CLIENT_ID,
    KAKAO_REDIRECT_URI,
    KAKAO_ME_URL,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_SECRET,
    KAKAO_LOGOUT_URL,
    KAKAO_UNLINK_URL,
} from "../config/env.js"
import { decodeAccessToken, extractPermission } from "../utils/decodeAccessToken.js"
import { issueTokens } from "../utils/issueTokens.js"
import { REFRESH_TOKEN_AGE } from "../constants/cookieOptions/index.js"
import type { app_user, resume } from "@/generated/prisma/client.js"
import { convertToBigIntOrThrow } from "../utils/convertToBigInt.js"

type AdditionalInfo = { school_name: string | null; hagwon_name: string | null }
type Me = Omit<app_user, "password"> & { resume: resume | null } & { additional_info: AdditionalInfo }

const authRouter = Router()
const headers = {
    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
}

authRouter.post("/kakao/code-to-token", async (req, res) => {
    const { code } = req.body

    const url = KAKAO_REQUEST_TOKEN_URL
    const body = {
        grant_type: "authorization_code",
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
    }
    const response = await axios.post(url, body, { headers })

    const kakao_access_token = response.data.access_token

    res.status(200).json({ kakao_access_token })
})

const extractAdditionalInfo = (result: Awaited<ReturnType<typeof dbFindMe>> | null): AdditionalInfo => {
    if (!result?.role) return { hagwon_name: null, school_name: null }
    switch (result.role) {
        case "STUDENT":
            return { hagwon_name: result.student?.hagwon.name ?? null, school_name: null }
        case "PARENT":
            return { hagwon_name: null, school_name: null }
        case "PRINCIPAL":
            return { hagwon_name: result.principal?.hagwon.name ?? null, school_name: null }
        case "HELPER":
            return { hagwon_name: result.helper?.hagwon.name ?? null, school_name: null }
        case "MAINTAINER":
            return { hagwon_name: null, school_name: null }
    }
}
const extractHagwonIdFromMe = (result: Awaited<ReturnType<typeof dbFindMe>> | null): bigint | null => {
    if (!result?.role) return null
    switch (result.role) {
        case "STUDENT":
            return result.student?.hagwon_id ?? null
        case "PARENT":
            return null
        case "PRINCIPAL":
            return result.principal?.hagwon_id ?? null
        case "HELPER":
            return result.helper?.hagwon_id ?? null
        case "MAINTAINER":
            return null
    }
}
const condenseToMe = (result: Awaited<ReturnType<typeof dbFindMe>> | null): Me => {
    if (!result) throw ApiError.Internal("내 정보를 정리하던 중 오류가 발생했어요")
    const { principal: _principal, student: _student, helper: _helper, ...rest } = result
    const additional_info = extractAdditionalInfo(result)
    const me: Me = { ...rest, additional_info }
    return me
}
authRouter.post("/kakao/me", async (req, res) => {
    const { kakao_access_token } = req.body
    const url = KAKAO_ME_URL
    const response = await axios.post(url, undefined, {
        headers: {
            ...headers,
            Authorization: `Bearer ${kakao_access_token}`,
        },
    })

    const kakaoMe = response.data

    const loginPayload: LoginPayload = {
        kakao_id: kakaoMe.id,
    }
    const result = await dbFindMeInLogin("kakao", loginPayload)
    const hagwon_id = extractHagwonIdFromMe(result)

    if (result) {
        const { access_token, resCookieParams } = issueTokens({
            userIdInString: result.id.toString(),
            role: result.role,
            hagwonIdInString: hagwon_id ? hagwon_id?.toString() : null,
        })
        res.cookie(...resCookieParams)

        const condensed = condenseToMe(result)
        const serializable = makeSerializable(condensed)
        res.status(200).json({ me: serializable, access_token })
        return
    }

    const signupPayload: SignupPayload = {
        name: kakaoMe.properties.nickname,
        kakao_id: Number(kakaoMe.id),
    }
    const signupResult = await dbCreateMe(signupPayload)

    const { access_token, resCookieParams } = issueTokens({
        userIdInString: signupResult.id.toString(),
        role: signupResult.role,
        hagwonIdInString: null, // NOTE: 가입하는 순간엔 학원 없음
    })
    res.cookie(...resCookieParams)

    const serializable = makeSerializable(signupResult)
    res.status(200).json({ me: serializable, access_token })
})

authRouter.post("/kakao/logout", async (req, res) => {
    const access_token = extractAccessToken(req.headers)
    const url = KAKAO_LOGOUT_URL
    try {
        axios.post(url, undefined, {
            headers: {
                ...headers,
                Authorization: `Bearer ${access_token}`,
            },
        })
    } catch {
        console.error("---- kakao logout failed: please check why")
    }
    res.status(204).send()
})

authRouter.get("/me", async (req, res) => {
    const decoded = decodeAccessToken(req.headers)
    const id = convertToBigIntOrThrow(decoded.userIdInString)
    const result = await dbFindMe(id)
    const condensed = condenseToMe(result)
    const serializable = makeSerializable(condensed)
    res.status(200).json(serializable)
})

authRouter.patch("/me", async (req, res) => {
    const { user_id } = extractPermission(req.headers)
    const mePatchPayload = req.body
    await dbPatchMe({ user_id, mePatchPayload })

    res.status(204).send()
})

authRouter.delete("/me/:userId", async (req, res) => {
    const idInString = req.params.userId
    const id = Number(idInString)
    const authorization = req.headers.authorization
    if (!authorization) {
        res.status(401).json({ message: "---- Unauthroized Request" })
        return
    }
    const access_token = authorization.split(" ")[1]

    const result = await dbDeleteMe(id)
    mutateToSerializable(result)

    if (result.kakao_id) {
        // NOTE: NO NEED TO AWAIT
        const url = KAKAO_UNLINK_URL
        const body = {
            target_id_type: "user_id",
            target_id: result.kakao_id,
        }
        axios.post(url, body, {
            headers: { ...headers, Authorization: `Bearer ${access_token}` },
        })
    }

    res.status(200).json(result)
})

authRouter.post("/resume/:resumeId/accept", async (req, res) => {
    extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음
    const resume_id = BigInt(req.params.resumeId)
    await dbAcceptResume({ resume_id })

    res.status(200).send("----good")
})

authRouter.post("/email/signup", async (req, res) => {
    const body = req.body
    const { password: rawPassword } = body
    const hashedPassword = await bcrypt.hash(rawPassword, 10)
    const result = await dbCreateMe({ ...body, password: hashedPassword })

    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

authRouter.post("/email/login", async (req, res) => {
    const { email, password: rawPassword } = req.body
    const result = await dbFindMeInLogin("email", { email, password: rawPassword })
    if (!result) throw ApiError.BadRequest("아이디와 비밀번호를 다시 확인해주세요")
    const hagwon_id = extractHagwonIdFromMe(result)

    const { access_token, resCookieParams } = issueTokens({
        userIdInString: result.id.toString(),
        role: result.role,
        hagwonIdInString: hagwon_id?.toString() ?? null,
    })
    res.cookie(...resCookieParams)

    const serializable = makeSerializable(result)
    res.status(200).json({ me: serializable, access_token })
})

authRouter.get("/resume/user/:userId", async (req, res) => {
    extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음
    const user_id = BigInt(req.params.userId)
    const result = await dbFindManyResume(user_id)
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

authRouter.get("/all/user/:userId", async (req, res) => {
    extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음
    const user_id = BigInt(req.params.userId)

    const result = await dbFindManyUser(user_id)
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

authRouter.delete("/user/:userId", async (req, res) => {
    extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음
    const user_id = BigInt(req.params.userId)
    await dbDeleteUser(user_id)
    res.status(200).send("----good")
})

authRouter.post("/refresh", async (req, res) => {
    try {
        const refresh_token = req.cookies(REFRESH_TOKEN_AGE)
        if (!refresh_token) throw ApiError.RefreshTokenExpired()

        const decoded = jwt.verify(refresh_token, REFRESH_TOKEN_SECRET)
        const access_token = jwt.sign(decoded, ACCESS_TOKEN_SECRET)
        res.status(200).json({ access_token })
    } catch {
        throw ApiError.RefreshTokenExpired()
    }
})

export default authRouter
