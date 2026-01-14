import { decodeAccessToken } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import { dbFindManyStudent } from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"

const manageRouter = Router()

manageRouter.get("/student", async (req, res) => {
    const { userIdInString } = decodeAccessToken(req.headers)
    const user_id = BigInt(userIdInString)
    const result = await dbFindManyStudent({ user_id })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default manageRouter
