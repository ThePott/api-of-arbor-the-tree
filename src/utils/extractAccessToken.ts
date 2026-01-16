import type { IncomingHttpHeaders } from "http"
import { ApiError } from "../errors/appError/AppError.js"

// TODO: 지금은 이 토큰이 asdf여도 통과됨
// TODO: 토큰 검증하는 로직이 있어야 함
// TODO: 만료되었을 때의 로직도 필요함
// NOTE: 만료되면 그냥 401 띄운 다음 클라이언트에서 리프레시 하게 해야 하나?
export const extractAccessToken = (headers: IncomingHttpHeaders): string => {
    const authorization = headers.authorization
    if (!authorization) throw ApiError.Unauthorized("토큰이 필요해요")

    const access_token = authorization.split(" ")[1]
    if (!access_token) throw ApiError.Unauthorized("토큰이 필요해요")

    return access_token
}
