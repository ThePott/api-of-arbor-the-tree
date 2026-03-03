import { ApiError } from "../errors/appError/AppError.js"

const validateValue = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.length > 0
    return Boolean(value)
}

export const validateBody = <T extends object>(destructuedBody: T): void => {
    const valueArray = Object.values(destructuedBody)
    const isValid = valueArray.every((value) => validateValue(value))

    if (!isValid) throw ApiError.BadRequest("본문에 누락된 항목이 있어요")
}
