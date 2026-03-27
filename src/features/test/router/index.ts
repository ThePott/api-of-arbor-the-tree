import { Router } from "express"
import makeAssignmentPdf from "../../assignment/pdf/index.js"
import testBook from "./test-book/index.js"

const testRouter = Router()

testRouter.get("/pdf", async (req, res) => {
    const multiplier = Number(req.query.multiplier)
    console.log({ multiplier })
    const pdf = makeAssignmentPdf({
        id: BigInt(1),
        studentName: "홍길동",
        assigned_at: new Date(),
        bookForPdfArray: Array(multiplier).fill(testBook),
    })
    res.contentType("application/pdf")
    res.status(200).send(pdf)
})

export default testRouter
