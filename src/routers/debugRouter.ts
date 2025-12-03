// NOTE: THIS FILE MUST BE DELETED BEFORE PRODUCTION

import { Router } from "express"
import { DEBUG_dbFindManyUser } from "../db/authDb.js"

const debugRouter = Router()

debugRouter.get("/user-all", async (_req, res) => {
    const result = await DEBUG_dbFindManyUser()
    res.status(200).json(result)
})

export default debugRouter
