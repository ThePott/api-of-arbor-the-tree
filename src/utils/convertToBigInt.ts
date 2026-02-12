import { ApiError } from "../errors/appError/AppError.js"

export const convertToBigIntOrThrow = (target: unknown): bigint => {
    const numberTarget = Number(target)
    if (Number.isNaN(numberTarget)) throw ApiError.BadRequest("올바른 아이디로 요청해주세요")

    return BigInt(numberTarget)
}

export const convertToBigIntOrNull = (target: unknown): bigint | null => {
    try {
        return convertToBigIntOrThrow(target)
    } catch {
        return null
    }
}
