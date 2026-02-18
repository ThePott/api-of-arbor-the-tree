import { ApiError } from "../errors/appError/AppError.js"

export const validateBody = <T extends object>(destructuedBody: T): void => {
    const valueArray = Object.values(destructuedBody)
    const isValid = valueArray.every((value) => value)

    if (!isValid) throw ApiError.BadRequest("본문에 누락된 항목이 있어요")
}
