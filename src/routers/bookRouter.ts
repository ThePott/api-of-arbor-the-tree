import { Router } from "express"
import { extractAccessToken } from "../utils/extractAccessToken.js"
import { dbCreateBook, dbDeleteBook, dbFindManyBook } from "../db/bookDb.js"
import { validateBody } from "../utils/validateBody.js"
import { mutateToSerializable } from "../utils/makeSerializable.js"

// NOTE: MUST SERIALIZE before respond result
const bookRouter = Router()

bookRouter.get("/", async (req, res) => {
    try {
        extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음
        const result = await dbFindManyBook()
        result.map((el) => mutateToSerializable(el))
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "something is wrong with book find many" })
    }
})

bookRouter.delete("/:bookId", async (req, res) => {
    try {
        extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음
        const bookId = Number(req.params.bookId)
        if (!bookId) throw new Error("---- no book id")
        await dbDeleteBook(bookId)
        res.status(204).send()
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "---- failed deleting book" })
    }
})

bookRouter.post("/write", async (req, res) => {
    extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음

    const { title, published_year, data, user_id } = req.body
    validateBody({ title, published_year, data, user_id })

    await dbCreateBook({ title: String(title), published_year: Number(published_year), data, user_id: BigInt(user_id) })

    res.status(204).send()
})

export default bookRouter
