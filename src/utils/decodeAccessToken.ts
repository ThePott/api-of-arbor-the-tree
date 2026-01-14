import type { IncomingHttpHeaders } from "http"
import { extractAccessToken } from "./extractAccessToken.js"
import jwt from "jsonwebtoken"
import { ACCESS_TOKEN_SECRET } from "../config/env.js"
import { AppError } from "../errors/AppError.js"

export const decodeAccessToken = (headers: IncomingHttpHeaders) => {
    const accessToken = extractAccessToken(headers)
    try {
        const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET)
        return decoded
    } catch {
        throw AppError.Unauthorized("토큰이 올바르지 않아요")
    }
}
