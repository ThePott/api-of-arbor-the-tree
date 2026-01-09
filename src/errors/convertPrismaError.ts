import { PrismaClientKnownRequestError } from "../../generated/prisma/internal/prismaNamespace.js"
import { AppError } from "./AppError.js"

const convertPrismaError = (error: unknown): AppError => {
    if (error instanceof PrismaClientKnownRequestError) {
        console.log({ meta: error.meta, code: error.code })
        switch (error.code) {
            case "P2002":
                return AppError.Conflict("중복된 데이터예요")
            case "P2025":
                return AppError.NotFound("데이터를 찾을 수 없어요")
            case "P2003":
                return AppError.BadRequest("참조하려는 데이터가 없어요")
            default:
                return AppError.Internal("데이터베이스 오류가 발생했어요")
        }
    }
    return AppError.Internal("알 수 없는 오류가 발생했어요")
}

export default convertPrismaError
