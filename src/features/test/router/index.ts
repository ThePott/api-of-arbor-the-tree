import { Router } from "express"
import makeAssignmentPdf from "../../assignment/pdf/index.js"
import testBook from "./test-book/index.js"

const testRouter = Router()

testRouter.get("/pdf", async (req, res) => {
    const multiplier = Number(req.query.multiplier)
    console.time(`>>>> pdf requsted with multiplier ${multiplier}`)
    const pdf = makeAssignmentPdf({
        id: BigInt(1),
        studentName: "홍길동",
        assigned_at: new Date(),
        bookForPdfArray: Array(multiplier).fill(testBook),
    })
    console.timeEnd(`>>>> pdf requsted with multiplier ${multiplier}`)
    res.contentType("application/pdf")
    res.status(200).send(pdf)
    // res.status(200).send()
})

export default testRouter
