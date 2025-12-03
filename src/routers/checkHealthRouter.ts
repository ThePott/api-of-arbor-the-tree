import { Router } from "express"

const checkHealthRouter = Router()

checkHealthRouter.get("/", async (_req, res) => {
    res.status(200).send("you are good")
})

checkHealthRouter.get("/checkhealth", async (_req, res) => {
    res.status(200).json({ message: "you are healthy" })
})

export default checkHealthRouter
