import type { IncomingHttpHeaders } from "http"
import { extractAccessToken } from "./extractAccessToken.js"
import jwt from "jsonwebtoken"
import { ACCESS_TOKEN_SECRET } from "../config/env.js"

export const decodeAccessToken = (headers: IncomingHttpHeaders) => {
    const accessToken = extractAccessToken(headers)
    const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET)
    return decoded
}
