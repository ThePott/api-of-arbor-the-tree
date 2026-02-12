import { Router } from "express"

const assignmentRouter = Router()

assignmentRouter.get("/", async (req, res) => {
    res.status(200).send("---- good")
})

assignmentRouter.get("/create", async (req, res) => {
    res.status(200).send("---- real good")
})

assignmentRouter.post("/create", async (req, res) => {
    res.status(200).send("---- real good")
})

export default assignmentRouter
