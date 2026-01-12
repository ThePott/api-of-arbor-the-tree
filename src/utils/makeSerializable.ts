export const mutateToSerializable = (obj: Record<string, unknown>) => {
    Object.entries(obj).forEach(([key, value]) => {
        if (typeof value !== "bigint") {
            return
        }

        obj[key] = value.toString()
    })
}

export const makeSerializable = (obj: unknown): unknown => {
    if (typeof obj === "bigint") return obj.toString()

    if (Array.isArray(obj)) {
        return obj.map((el) => makeSerializable(el))
    }

    if (obj !== null && typeof obj === "object") {
        const entryArray = Object.entries(obj)
        const newEntryArray = entryArray.map(([key, value]) => [key, makeSerializable(value)])
        const newObj = Object.fromEntries(newEntryArray)
        return newObj
    }

    return obj
}
