import type { ApiErrorCode } from "./types/index.js"

export class ApiError extends Error {
    code: ApiErrorCode
    statusCode: number

    constructor(message: string, code: ApiErrorCode, statusCode: number) {
        super(message)
        this.code = code
        this.statusCode = statusCode
        this.name = "ApiError"
    }

    // 400 - Bad Request (invalid input, missing params)
    static BadRequest(message: string) {
        return new ApiError(message, "BAD_REQUEST", 400)
    }

    // 401 - Unauthorized (missing/invalid token)
    static Unauthorized(message: string) {
        return new ApiError(message, "UNAUTHORIZED", 401)
    }
    static AccessTokenExpired() {
        return new ApiError("액세스 토큰이 만료되었습니다", "ACCESS_TOKEN_EXPIRED", 401)
    }
    static RefreshTokenExpired() {
        return new ApiError("다시 로그인해주세요", "REFRESH_TOKEN_EXPIRED", 401)
    }

    // 403 - Forbidden (authenticated but not allowed)
    static Forbidden(message: string) {
        return new ApiError(message, "FORBIDDEN", 403)
    }

    // 404 - Not Found
    static NotFound(message: string) {
        return new ApiError(message, "NOT_FOUND", 404)
    }

    // 409 - Conflict (duplicate, already exists)
    static Conflict(message: string) {
        return new ApiError(message, "CONFLICT", 409)
    }

    // 500 - Internal Server Error
    static Internal(message: string) {
        return new ApiError(message, "INTERNAL_ERROR", 500)
    }
}
