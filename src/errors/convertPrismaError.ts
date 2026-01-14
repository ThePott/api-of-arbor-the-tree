import { PrismaClientKnownRequestError } from "../../generated/prisma/internal/prismaNamespace.js"
import { ApiError } from "./appError/AppError.js"

const convertPrismaError = (error: unknown): ApiError => {
    if (error instanceof PrismaClientKnownRequestError) {
        console.log({ meta: error.meta, code: error.code })
        switch (error.code) {
            case "P2002":
                return ApiError.Conflict("중복된 데이터예요")
            case "P2025":
                return ApiError.NotFound("데이터를 찾을 수 없어요")
            case "P2003":
                return ApiError.BadRequest("참조하려는 데이터가 없어요")
            default:
                return ApiError.Internal("데이터베이스 오류가 발생했어요")
        }
    }
    return ApiError.Internal("알 수 없는 오류가 발생했어요")
}

export default convertPrismaError
