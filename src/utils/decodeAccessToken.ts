import type { IncomingHttpHeaders } from "http"
import { extractAccessToken } from "./extractAccessToken.js"
import jwt from "jsonwebtoken"
import { ACCESS_TOKEN_SECRET } from "../config/env.js"
import { ApiError } from "../errors/appError/AppError.js"
import type { DecodedToken } from "./types/index.js"

export const decodeAccessToken = (headers: IncomingHttpHeaders): DecodedToken => {
    const accessToken = extractAccessToken(headers)
    try {
        const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET)
        return decoded as DecodedToken
    } catch {
        throw ApiError.AccessTokenExpired()
    }
}

export const extractUserIdFromAccessToken = (headers: IncomingHttpHeaders): bigint => {
    const { userIdInString } = decodeAccessToken(headers)
    const user_id = BigInt(userIdInString)
    return user_id
}
