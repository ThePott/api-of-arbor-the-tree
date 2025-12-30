export const validateBody = <T extends object>(destructuedBody: T): void => {
    const valueArray = Object.values(destructuedBody)
    const isValid = valueArray.every((value) => value)

    if (!isValid) throw new Error("---- body props missing")
}
