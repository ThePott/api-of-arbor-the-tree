import { Router } from "express"
import { checkEnvVar } from "../utils/checkEnvVar.js"
import axios from "axios"
import type { SignupPayload } from "../interfaces/interfaces.js"
import { dbCreateUser } from "../db/authDb.js"

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

    res.status(200).json({ access_token })
})

authRouter.post("/kakao/me", async (req, res) => {
    const { access_token } = req.body
    const url = checkEnvVar(process.env.KAKAO_ME_URL)
    console.log({ access_token })
    const response = await axios.post(url, undefined, {
        headers: {
            ...headers,
            Authorization: `Bearer ${access_token}`,
        },
    })

    const signupPayload: SignupPayload = {
        name: response.data.properties.nickname,
        kakao_id: Number(response.data.id),
    }
    console.log({ signupPayload })

    const result = await dbCreateUser(signupPayload)
    console.log("---- created")
    console.log({ result })
    const smallIntResult = { ...result, id: result.id.toString(), kakao_id: result.id.toString() }
    res.status(200).json(smallIntResult)
})

authRouter.post("/kakao/logout", async (req, res) => {
    const access_token = req.body
    const url = checkEnvVar(process.env.KAKAO_LOGOUT_URL)
    const response = await axios.post(url, undefined, {
        headers: {
            ...headers,
            Authorization: `Bearer ${access_token}`,
        },
    })
    console.log({ response })
    res.status(200).json({ data: response.data })
})

export default authRouter
