import { Router } from "express"

const manageRouter = Router()

manageRouter.get("/student", async (req, res) => {
    res.status(200).send("---- good")
})

export default manageRouter
