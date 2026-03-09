import { Router } from "express"
import { dbCreateBook, dbDeleteBook, dbFindManyBook } from "../db/bookDb.js"
import { validateBody } from "../utils/validateBody.js"
import { makeSerializable } from "../utils/makeSerializable.js"
import { extractPermission } from "../utils/decodeAccessToken.js"
import { convertToBigIntOrThrow } from "../utils/convertToBigInt.js"
import { makeAllowedRoleArray } from "../utils/make-allowed-role-array.js"
import { ApiError } from "../errors/appError/AppError.js"
import type { BookWritePayload } from "../interfaces/interfaces.js"

// NOTE: MUST SERIALIZE before respond result
const bookRouter = Router()

// NOTE: 문제집 관리 페이지: 원장, 관리자, 실장만 볼 수 있음 -> 그렇다면 책을
bookRouter.get("/", async (req, res) => {
    const { user_id: _, role, hagwon_id } = extractPermission(req.headers)
    if (!role) throw ApiError.Forbidden("접근 권한이 없어요")
    const allowedRoleArray = makeAllowedRoleArray("HELPER")
    if (!allowedRoleArray.includes(role)) throw ApiError.Forbidden("접근 권한이 없어요")
    const result = await dbFindManyBook(hagwon_id)
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

bookRouter.delete("/:bookId", async (req, res) => {
    const { user_id, hagwon_id } = extractPermission(req.headers) // TODO: 지금은 access token을 검증하지 않음
    const book_id = convertToBigIntOrThrow(req.params.bookId)
    await dbDeleteBook({ user_id, hagwon_id, book_id })
    res.status(204).send()
})

bookRouter.post("/write", async (req, res) => {
    const { user_id, hagwon_id } = extractPermission(req.headers) // TODO: 지금은 access token을 검증하지 않음

    const { title, published_year, data } = req.body
    validateBody({ title, published_year, data })
    const payloadFromClient: BookWritePayload = { title: String(title), published_year: Number(published_year), data }

    await dbCreateBook({ user_id, hagwon_id, payloadFromClient })

    res.status(204).send()
})

export default bookRouter
