import { Router } from "express"
import { bookArrayDummy, type Book } from "../dummy/bookDummy.js"
import { extractAccessToken } from "../utils/extractAccessToken.js"
import { dbCheckIfBookExists, dbCreateBook } from "../db/bookDb.js"
import { validateBody } from "../utils/validateBody.js"
import { makeSerializable } from "../utils/makeSerializable.js"

const bookRouter = Router()

type BookActivity = "active" | "inactive" | "total"

bookRouter.get("/", async (req, res) => {
    extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음
    const activity = String(req.query.activity) as BookActivity

    // NOTE: THIS IS TEMPORARY DUMMY DATA
    const bookArray: Book[] = bookArrayDummy

    // NOTE: MUST FILTER VIA Prisma
    const filteredBookArray = bookArray.filter((book) => {
        switch (activity) {
            case "active":
                return book.isActive
            case "inactive":
                return !book.isActive
            case "total":
                return true
            default:
                return true
        }
    })
    res.status(200).json(filteredBookArray)
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

        const { title, published_year, data } = req.body
        validateBody({ title, published_year, data })

        const isBookExisting = await dbCheckIfBookExists(title)

        if (isBookExisting) {
            res.status(409).json({ message: "---- book already exists", name: "ConflictError" })
            return
        }

        // NOTE: 개발 중에는 else에 넣어 쓰지만
        // TODO: early return 으로 수정해야
        const result = await dbCreateBook({ title: String(title), published_year: Number(published_year), data })

        makeSerializable(result)
        res.status(200).json({ result })
    } catch (error) {
        res.status(500).json({ message: "---- detail posting failed", error })
    }
})

export default bookRouter
