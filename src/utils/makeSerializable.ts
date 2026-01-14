import { ApiError } from "../errors/appError/AppError.js"

export const mutateToSerializable = (obj: Record<string, unknown>) => {
    Object.entries(obj).forEach(([key, value]) => {
        if (typeof value !== "bigint") {
            return
        }

        obj[key] = value.toString()
    })
}

export const makeSerializable = (obj: unknown): unknown => {
    if (obj instanceof Promise) throw ApiError.Internal("약속을 기다려주세요")

    if (typeof obj === "bigint") return obj.toString()

    if (Array.isArray(obj)) {
        return obj.map((el) => makeSerializable(el))
    }

    const isNormalObject = obj !== null && typeof obj === "object" && !(obj instanceof Date)
    if (isNormalObject) {
        const entryArray = Object.entries(obj)
        const newEntryArray = entryArray.map(([key, value]) => [key, makeSerializable(value)])
        const newObj = Object.fromEntries(newEntryArray)
        return newObj
    }

    return obj
}
