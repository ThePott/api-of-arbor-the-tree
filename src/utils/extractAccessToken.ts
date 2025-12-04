import type { IncomingHttpHeaders } from "http"

export const extractAccessToken = (headers: IncomingHttpHeaders) => {
    const authorization = headers.authorization
    if (!authorization) {
        throw new Error("---- Unauthorized")
    }
    return authorization.split(" ")[1]
}
