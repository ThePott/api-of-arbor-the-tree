import { Router } from "express"
import { dbFindHagwonMany } from "../db/hagwonDb.js"

const hagwonRouter = Router()

hagwonRouter.get("/", async (req, res) => {
    const name = String(req.query.name)

    const result = await dbFindHagwonMany(name)
    const serializabe = result.map((hagwon) => ({ ...hagwon, id: hagwon.id.toString() }))

    res.status(200).json(serializabe)
})

export default hagwonRouter
