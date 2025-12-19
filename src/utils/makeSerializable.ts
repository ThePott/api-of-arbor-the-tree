export const makeSerializable = (obj: Record<string, unknown>) => {
    Object.entries(obj).forEach(([key, value]) => {
        if (typeof value !== "bigint") {
            return
        }

        obj[key] = value.toString()
    })
}
