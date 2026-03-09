import type { IncomingHttpHeaders } from "http"
import { extractAccessToken } from "./extractAccessToken.js"
import jwt from "jsonwebtoken"
import { ACCESS_TOKEN_SECRET } from "../config/env.js"
import { ApiError } from "../errors/appError/AppError.js"
import type { Token } from "./issueTokens.js"
import { convertToBigIntOrThrow } from "./convertToBigInt.js"

export type DecodedToken = Token & {
    exp: number
    iat: number
}

export const decodeAccessToken = (headers: IncomingHttpHeaders): DecodedToken => {
    const accessToken = extractAccessToken(headers)
    try {
        const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET)
        return decoded as DecodedToken
    } catch {
        throw ApiError.AccessTokenExpired()
    }
}

export const extractPermission = (headers: IncomingHttpHeaders) => {
    const { userIdInString, hagwonIdInString, role }: Token = decodeAccessToken(headers)
    const user_id = convertToBigIntOrThrow(userIdInString)
    const hagwon_id = convertToBigIntOrThrow(hagwonIdInString)
    return { user_id, hagwon_id, role }
}
