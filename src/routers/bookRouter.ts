import { Router } from "express"
import { bookArrayDummy, type Book } from "../dummy/bookDummy.js"

const bookRouter = Router()

type BookActivity = "active" | "inactive" | "total"

bookRouter.get("/", async (req, res) => {
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

export default bookRouter
