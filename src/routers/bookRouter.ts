import { Router } from "express"
import { bookArrayDummy, type Book } from "../dummy/bookDummy.js"
import { extractAccessToken } from "../utils/extractAccessToken.js"

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
    // extractAccessToken(req.headers) // TODO: 지금은 access token을 검증하지 않음

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

bookRouter.post("/detail", async (req, res) => {
    try {
        res.status(200).send("---- good detail post")
    } catch (error) {
        res.status(500).json({ message: "---- detail posting failed", error })
    }
})

export default bookRouter
