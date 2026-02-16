import { ApiError } from "../errors/appError/AppError.js"

const TypstError = ApiError.Internal("Typst 변환 중 오류가 발생했어요")

// TODO: type checker 이용해서 더 간단하게 쓸 수도 있을 거 같은데
const makeTypstDictionary = (source: unknown): string => {
    if (typeof source !== "object" || null) throw TypstError
    if (source === null) throw TypstError

    const stringPairArray = Object.entries(source).map(([key, value]) => `${key}: ${makeTypstData(value)}`)
    const stringified = stringPairArray.toString()
    const typstDictionary = `(${stringified})`
    console.log({ dictionary: typstDictionary })
    return typstDictionary
}
const makeTypstArray = (source: unknown): string => {
    if (!Array.isArray(source)) throw TypstError

    const stringArray = source.map((el) => makeTypstData(el))
    const stringified = stringArray.toString()
    const typstArray = `(${stringified},)`
    console.log({ array: typstArray })
    return typstArray
}

const makeTypstData = (source: unknown) => {
    if (Array.isArray(source)) return makeTypstArray(source)
    if (typeof source === "object" && source !== null) return makeTypstDictionary(source)
    if (typeof source === "string") return `"${source}"`
    if (typeof source === "bigint") return `${source.toString()}`
    if (typeof source === "number") return `${source}`
    return `none`
}

export default makeTypstData
