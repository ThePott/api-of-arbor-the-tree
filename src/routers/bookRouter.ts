import { Router } from "express"
import { extractAccessToken } from "../utils/extractAccessToken.js"
import { dbCreateBook, dbDeleteBook, dbFindManyBook } from "../db/bookDb.js"
import { validateBody } from "../utils/validateBody.js"
import { makeSerializable } from "../utils/makeSerializable.js"

// NOTE: MUST SERIALIZE before respond result
const bookRouter = Router()

bookRouter.get("/", async (req, res) => {
    try {
        extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음
        console.log("---- here")
        const result = await dbFindManyBook()
        result.map((el) => makeSerializable(el))
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
        if (!bookId) await dbDeleteBook(bookId)
        res.status(204).send()
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "---- failed deleting book" })
    }
})

bookRouter.get("/detail", async (req, res) => {
    extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음

    // NOTE: 이걸로 실제로 검색을 해야 함
    const query = String(req.query.query)

    // NOTE: 지금은 더미로 보냄
    const result: string[] = [
        "p.26 확인 1 ____ [I] 나머지정리 A단계",
        "p.26 확인 2 ____ [I] 나머지정리 A단계",
        "p.26 확인 3 ____ [I] 나머지정리 A단계",
        "p.26 확인 4 ____ [I] 나머지정리 A단계",
        "p.26 확인 5 ____ [I] 나머지정리 A단계",
        "p.27 확인 6 ____ [I] 나머지정리 A단계",
        "p.27 확인 7 ____ [I] 나머지정리 A단계",
        "p.27 확인 8 ____ [I] 나머지정리 A단계",
        "p.27 확인 9 ____ [I] 나머지정리 A단계",
        "p.27 확인 10 ____ [I] 나머지정리 A단계",
    ]
    res.status(200).json(result)
})

bookRouter.post("/write", async (req, res) => {
    try {
        extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음

        const { title, published_year, data, user_id } = req.body
        validateBody({ title, published_year, data, user_id })

        await dbCreateBook({ title: String(title), published_year: Number(published_year), data, user_id })

        res.status(204).send()
    } catch (error) {
        console.error(error)
        res.status(409).json({
            // NOTE: 지금은 위에서 실패하면 무조건 이름 같은 책 있어서라고 임의 판단
            // TODO: 어떤 에러인지 어떻게 판단하지?
            message: "---- already existing",
        })
    }
})

export default bookRouter
