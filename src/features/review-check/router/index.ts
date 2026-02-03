import { Router } from "express"

const reviewCheckRouter = Router()

reviewCheckRouter.get("/", async (req, res) => {
    res.status(200).send("---- good")
})

export default reviewCheckRouter
