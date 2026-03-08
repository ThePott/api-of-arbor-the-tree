import type { CookieOptions } from "express"
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../config/env.js"
import {
    ACCESS_TOKEN_AGE,
    REFRESH_TOKEN_AGE,
    REFRESH_TOKEN_COOKIE_OPTIONS,
    REFRESH_TOKEN_NAME,
} from "../constants/cookieOptions/index.js"
import jwt from "jsonwebtoken"
import type { role } from "@/generated/prisma/enums.js"

export type Token = {
    userIdInString: string
    role: role | null
}
type IssueTokensReturns = {
    access_token: string
    resCookieParams: [string, string, CookieOptions]
}
export const issueTokens = ({ userIdInString, role }: Token): IssueTokensReturns => {
    const tokenBody = { userIdInString, role }
    const access_token = jwt.sign(tokenBody, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_AGE,
    })
    const refresh_token = jwt.sign(tokenBody, REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_AGE,
    })

    return {
        access_token,
        resCookieParams: [REFRESH_TOKEN_NAME, refresh_token, REFRESH_TOKEN_COOKIE_OPTIONS],
    }
}
