import { Router } from "express"
import { dbFindManySchool } from "../db/schoolDb.js"

const schoolRouter = Router()

schoolRouter.get("/", async (req, res) => {
    const name = String(req.query.name)

    const result = await dbFindManySchool(name)
    const serializable = result.map((school) => ({
        ...school,
        id: school.id.toString(),
    }))
    res.status(200).json(serializable)
})

export default schoolRouter
