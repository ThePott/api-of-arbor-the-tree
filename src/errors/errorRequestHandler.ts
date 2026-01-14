import type { ErrorRequestHandler } from "express"
import { ApiError } from "./AppError.js"
import { PrismaClientKnownRequestError } from "../../generated/prisma/internal/prismaNamespace.js"
import convertPrismaError from "./convertPrismaError.js"

const errorRequestHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    let appError: ApiError

    if (err instanceof ApiError) {
        appError = err
    } else if (err instanceof PrismaClientKnownRequestError) {
        appError = convertPrismaError(err)
    } else {
        appError = ApiError.Internal("알 수 없는 오류가 발생했어요")
    }

    res.status(appError.statusCode).json({
        code: appError.code,
        message: appError.message,
    })
}

export default errorRequestHandler
