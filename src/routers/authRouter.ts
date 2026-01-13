import { Router } from "express"
import { checkEnvVar } from "../utils/checkEnvVar.js"
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
import { AppError } from "../errors/AppError.js"

const authRouter = Router()
const headers = {
    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
}

authRouter.post("/kakao/code-to-token", async (req, res) => {
    const { code } = req.body

    const url = checkEnvVar(process.env.KAKAO_REQUEST_TOKEN_URL)
    const body = {
        grant_type: "authorization_code",
        client_id: checkEnvVar(process.env.KAKAO_CLIENT_ID),
        redirect_uri: checkEnvVar(process.env.KAKAO_REDIRECT_URI),
        code,
    }
    const response = await axios.post(url, body, { headers })

    const access_token = response.data.access_token
    const refresh_token = response.data.refresh_token
    console.log({ refresh_token })

    res.status(200).json({ access_token, refresh_token })
})

authRouter.post("/kakao/me", async (req, res) => {
    const { access_token } = req.body
    const url = checkEnvVar(process.env.KAKAO_ME_URL)
    const response = await axios.post(url, undefined, {
        headers: {
            ...headers,
            Authorization: `Bearer ${access_token}`,
        },
    })

    const kakaoMe = response.data

    const loginPayload: LoginPayload = {
        kakao_id: kakaoMe.id,
    }
    const meResult = await dbFindMeInLogin("kakao", loginPayload)

    if (meResult) {
        mutateToSerializable(meResult)
        res.status(200).json(meResult)
        return
    }

    const signupPayload: SignupPayload = {
        name: kakaoMe.properties.nickname,
        kakao_id: Number(kakaoMe.id),
    }
    const signupResult = await dbCreateMe(signupPayload)
    mutateToSerializable(signupResult)
    res.status(200).json(signupResult)
})

authRouter.post("/kakao/logout", async (req, res) => {
    const access_token = extractAccessToken(req.headers)
    const url = checkEnvVar(process.env.KAKAO_LOGOUT_URL)
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

// TODO: 나중엔 userId 없이 토큰 만으로 이게 누구인지를 서버에서 판단할 수가 있어야 하는데...
authRouter.get("/me/:userId", async (req, res) => {
    extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음
    const id = Number(req.params.userId)
    const { result, resume, additional_info } = await dbFindMe(id)
    if (!result) {
        res.status(400).json({ message: "---- 와 이게 없네" })
        return
    }

    mutateToSerializable(result)
    if (resume) {
        mutateToSerializable(resume)
    }
    res.status(200).json({ result, resume, additional_info })
})

// TODO: 나중엔 userId 없이 토큰 만으로 이게 누구인지를 서버에서 판단할 수가 있어야 하는데...
authRouter.patch("/me", async (req, res) => {
    extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음

    const { id, ...mePatchPayload } = req.body

    await dbPatchMe(id, mePatchPayload)

    res.status(204).send()
})

// TODO: 나중엔 userId 없이 토큰 만으로 이게 누구인지를 서버에서 판단할 수가 있어야 하는데...
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
        const url = checkEnvVar(process.env.KAKAO_UNLINK_URL)
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
    mutateToSerializable(result)
    res.status(200).json(result)
})

authRouter.post("/email/login", async (req, res) => {
    const { email, password: rawPassword } = req.body
    const result = await dbFindMeInLogin("email", { email, password: rawPassword })
    if (!result) throw AppError.NotFound("이메일과 비밀번호를 다시 확인해주세요")
    mutateToSerializable(result)
    res.status(200).json(result)
})

// TODO: 나중엔 userId 없이 토큰 만으로 이게 누구인지를 서버에서 판단할 수가 있어야 하는데...
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

export default authRouter
