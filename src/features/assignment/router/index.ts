import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import {
    dbAssignmentCreateAssignment,
    dbAssignmentFindManyAssignment,
    dbAssignmentFindManyBookWithReviewChecks,
} from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import type { review_check, review_check_status } from "@/generated/prisma/client.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

const assignmentRouter = Router()

type ReviewAssignmentArrayVerbose = Awaited<ReturnType<typeof dbAssignmentFindManyAssignment>>
const organizeReviewAssignment = (result: ReviewAssignmentArrayVerbose) => {
    const extendedReviewAssignmentArray = result.map((verboseAssignment) => {
        const { reviewAssignmentQuestions: _, ...assignment } = verboseAssignment
        const reviewAssignmentQuestionArray = verboseAssignment.reviewAssignmentQuestions
        const flatQuestionArray = reviewAssignmentQuestionArray.map((question) => {
            const { review_check, ...rest } = question
            const bookWithReviewAssignmentQuestions = { ...rest, title: review_check.question.step?.topic?.book?.title }
            return bookWithReviewAssignmentQuestions
        })
        const grouped = Object.groupBy(flatQuestionArray, ({ title }) => {
            if (!title) throw ApiError.Internal("오답 과제 목록을 정리하던 중 오류가 발생했어요")
            return title
        })
        const entryArray = Object.entries(grouped)
        const organized = entryArray.map(([title, reviewAssignmentQuestions]) => ({
            title,
            reviewAssignmentQuestions,
        }))
        return { ...assignment, books: organized }
    })
    return extendedReviewAssignmentArray
}
assignmentRouter.get("/", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    const result = await dbAssignmentFindManyAssignment({ user_id, classroom_id, student_id })
    const extended = organizeReviewAssignment(result)
    const serializable = makeSerializable(extended)
    res.status(200).json(serializable)
})

type BookWithReviewChecksArrayVerbose = Awaited<ReturnType<typeof dbAssignmentFindManyBookWithReviewChecks>>
const condenseBookWithReviewChecksArray = (bookWithReviewChecksArray: BookWithReviewChecksArrayVerbose) => {
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

export type BookWithReviewChecksFromClient = {
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
    const bookWithReviewChecksArray = req.body.bookWithReviewChecksArray as BookWithReviewChecksFromClient[]

    const result = await dbAssignmentCreateAssignment({
        user_id,
        bookWithReviewChecksArray,
        student_id,
    })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default assignmentRouter
