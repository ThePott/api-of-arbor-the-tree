import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import {
    dbAssignmentCreateAssignment,
    dbAssignmentFindManyAssignment,
    dbAssignmentFindManyBookWithReviewChecks,
    OLD_dbAssignmentFindManyAssignment,
} from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import type { review_assignment, review_check, review_check_status } from "@/generated/prisma/client.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

const assignmentRouter = Router()

// TODO: delete following code. it is dead.
type OLD_ReviewAssignmentArrayVerbose = Awaited<ReturnType<typeof OLD_dbAssignmentFindManyAssignment>>
const _OLD_organizeReviewAssignment = (result: OLD_ReviewAssignmentArrayVerbose) => {
    const extendedReviewAssignmentArray = result.map((verboseAssignment) => {
        const { reviewAssignmentQuestions: reviewAssignmentQuestionArray, ...assignment } = verboseAssignment
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
// TODO: delete above code. it is dead.

type ReviewAssignmentArrayVerbose = Awaited<ReturnType<typeof dbAssignmentFindManyAssignment>>
type AssignmentMetaInfo = review_assignment & {
    bookTitleArray: string[]
    questionCount: number
}
const condenseAssignmentMetaInfo = (result: ReviewAssignmentArrayVerbose): AssignmentMetaInfo[] => {
    const assignmentMetaInfoArray: AssignmentMetaInfo[] = result.map((verboseAssignment) => {
        const bookTitleSet = new Set<string>()
        verboseAssignment.reviewAssignmentQuestions.forEach((reviewAssignmentQuestion) => {
            const bookTitle = reviewAssignmentQuestion.review_check.question.step?.topic?.book?.title
            if (!bookTitle) throw ApiError.Internal("오답 과제 목록을 정리하던 중 오류가 발생했어요")
            bookTitleSet.add(bookTitle)
        })
        const questionCount = verboseAssignment.reviewAssignmentQuestions.length
        const metaInfo: AssignmentMetaInfo = {
            id: verboseAssignment.id,
            student_id: verboseAssignment.student_id,
            assigned_at: verboseAssignment.assigned_at,
            completed_at: verboseAssignment.completed_at,
            bookTitleArray: Array.from(bookTitleSet),
            questionCount,
        }
        return metaInfo
    })
    return assignmentMetaInfoArray
}
assignmentRouter.get("/", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    const result = await dbAssignmentFindManyAssignment({ user_id, classroom_id, student_id })
    const condensed = condenseAssignmentMetaInfo(result)
    const serializable = makeSerializable(condensed)
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
