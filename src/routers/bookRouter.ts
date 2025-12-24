import { Router } from "express"
import { bookArrayDummy } from "../dummy/bookDummy.js"

const bookRouter = Router()

bookRouter.get("/", async (req, res) => {
    // NOTE: THIS IS TEMPORARY DUMMY DATA
    const bookArray = bookArrayDummy
    res.status(200).json(bookArray)
})

export default bookRouter
