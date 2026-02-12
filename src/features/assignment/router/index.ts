import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import { dbAssignmentCreateAssignment, dbAssignmentFindManyBookWithReviewChecks } from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import type { review_check, review_check_status } from "@/generated/prisma/client.js"

const assignmentRouter = Router()

assignmentRouter.get("/", async (req, res) => {
    res.status(200).send("---- good")
})

type BookWithReviewChecksArrayForApi = Awaited<ReturnType<typeof dbAssignmentFindManyBookWithReviewChecks>>
const condenseBookWithReviewChecksArray = (bookWithReviewChecksArray: BookWithReviewChecksArrayForApi) => {
    const newData = bookWithReviewChecksArray.map((book) => {
        const reviewChecks: review_check[] = []
        book.topics.forEach((topic) => {
            topic.steps.forEach((step) => {
                step.questions.forEach((question) => {
                    reviewChecks.push(...question.reviewChecks)
                })
            })
        })
        return { title: book.title, reviewChecks }
    })
    return newData
}

assignmentRouter.get("/create", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    const result = await dbAssignmentFindManyBookWithReviewChecks({ user_id, classroom_id, student_id })
    const condensedResult = condenseBookWithReviewChecksArray(result)
    const serializable = makeSerializable(condensedResult)
    // const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export type CondensedBookWithReviewChecksFromClient = {
    title: string
    reviewChecks: {
        student_id: string
        id: string
        session_id: string
        question_id: string
        status: review_check_status
    }[]
}
assignmentRouter.post("/create", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const student_id = convertToBigIntOrThrow(req.body.student_id)
    const condensedBookArray = req.body.condensedBookArray as CondensedBookWithReviewChecksFromClient[]

    const result = await dbAssignmentCreateAssignment({ user_id, condensedBookArray, student_id })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default assignmentRouter
