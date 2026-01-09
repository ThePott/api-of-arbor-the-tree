export class AppError extends Error {
    code: string
    statusCode: number

    constructor(message: string, code: string, statusCode: number) {
        super(message)
        this.code = code
        this.statusCode = statusCode
        this.name = "AppError"
    }

    // 400 - Bad Request (invalid input, missing params)
    static BadRequest(message: string) {
        return new AppError(message, "BAD_REQUEST", 400)
    }

    // 401 - Unauthorized (missing/invalid token)
    static Unauthorized(message: string) {
        return new AppError(message, "UNAUTHORIZED", 401)
    }

    // 403 - Forbidden (authenticated but not allowed)
    static Forbidden(message: string) {
        return new AppError(message, "FORBIDDEN", 403)
    }

    // 404 - Not Found
    static NotFound(message: string) {
        return new AppError(message, "NOT_FOUND", 404)
    }

    // 409 - Conflict (duplicate, already exists)
    static Conflict(message: string) {
        return new AppError(message, "CONFLICT", 409)
    }

    // 500 - Internal Server Error
    static Internal(message: string) {
        return new AppError(message, "INTERNAL_ERROR", 500)
    }
}
