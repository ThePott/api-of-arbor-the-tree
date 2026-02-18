import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import {
    DbAssignedAssignmentCreate,
    dbAssignedAssignmentDelete,
    dbAssignedAssignmentUpdate,
    dbAssignmentCreateAssignment,
    dbAssignmentFindBookForPdf,
    dbAssignmentFindManyAssignment,
    dbAssignmentFindManyBookWithReviewChecks,
} from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import type { review_assignment, review_check, review_check_status, session_status } from "@/generated/prisma/client.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import makeAssignmentPdf from "../pdf/index.js"

const assignmentRouter = Router()

type ReviewAssignmentArrayVerbose = Awaited<ReturnType<typeof dbAssignmentFindManyAssignment>>
type AssignmentMetaInfo = review_assignment & {
    assigned_at: Date | undefined
    status: session_status | null
    completed_at: Date | undefined
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
            created_at: verboseAssignment.created_at,
            completed_at: verboseAssignment.completedReviewAssignment?.completed_at,
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

export const condenseBookForPdf = (bookArray: Awaited<ReturnType<typeof dbAssignmentFindBookForPdf>>) => {
    const newBookArray = bookArray.map((book) => {
        const topics = book.topics.map((topic) => {
            const questions = topic.steps.flatMap(({ questions }) => questions)
            const { steps: _, ...rest } = topic
            return { ...rest, questions }
        })
        return { ...book, topics }
    })
    return newBookArray
}
assignmentRouter.get("/:assignment_id/pdf", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const assignment_id = convertToBigIntOrThrow(req.params.assignment_id)
    const result = await dbAssignmentFindBookForPdf({ user_id, assignment_id })
    const condensed = condenseBookForPdf(result)
    console.log("----here")
    const pdf = makeAssignmentPdf({
        studentName: "홍길동",
        assigned_at: new Date(),
        bookForPdfArray: condensed,
    })
    console.log("----pdf done")
    res.contentType("application/pdf")
    res.status(200).send(pdf)
})

assignmentRouter.post("/:assignment_id/assigned", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const assignment_id = convertToBigIntOrThrow(req.body.assignment_id)
    const status = req.body.status as session_status
    const result = DbAssignedAssignmentCreate({ user_id, assignment_id, status })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})
assignmentRouter.patch("/:assignment_id/assigned", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const assignment_id = convertToBigIntOrThrow(req.body.assignment_id)
    const status = req.body.status as session_status
    const result = dbAssignedAssignmentUpdate({ user_id, assignment_id, status })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})
assignmentRouter.delete("/:assignment_id/assigned", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const assignment_id = convertToBigIntOrThrow(req.body.assignment_id)
    const result = dbAssignedAssignmentDelete({ user_id, assignment_id })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default assignmentRouter
