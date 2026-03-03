import { Router } from "express"
import { dbCreateBook, dbDeleteBook, dbFindManyBook } from "../db/bookDb.js"
import { validateBody } from "../utils/validateBody.js"
import { makeSerializable } from "../utils/makeSerializable.js"
import { extractUserId } from "../utils/decodeAccessToken.js"
import { convertToBigIntOrThrow } from "../utils/convertToBigInt.js"

// NOTE: MUST SERIALIZE before respond result
const bookRouter = Router()

bookRouter.get("/", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const result = await dbFindManyBook(user_id)
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

bookRouter.delete("/:bookId", async (req, res) => {
    const user_id = extractUserId(req.headers) // TODO: 지금은 access token을 검증하지 않음
    const book_id = convertToBigIntOrThrow(req.params.bookId)
    await dbDeleteBook({ user_id, book_id })
    res.status(204).send()
})

bookRouter.post("/write", async (req, res) => {
    const user_id = extractUserId(req.headers) // TODO: 지금은 access token을 검증하지 않음

    const { title, published_year, data } = req.body
    validateBody({ title, published_year, data })

    await dbCreateBook({ title: String(title), published_year: Number(published_year), data, user_id })

    res.status(204).send()
})

export default bookRouter
