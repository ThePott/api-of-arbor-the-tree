import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import {
    dbAssignedAssignmentUpsert,
    dbAssignedAssignmentDelete,
    dbAssignmentCreateAssignment,
    dbAssignmentFindBookForPdf,
    dbAssignmentFindManyAssignment,
    dbAssignmentFindManyBookWithReviewChecks,
} from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import type { review_check, review_check_status, session_status } from "@/generated/prisma/client.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import makeAssignmentPdf from "../pdf/index.js"
import { validateBody } from "@/src/utils/validateBody.js"

const assignmentRouter = Router()

type ReviewAssignmentArrayVerbose = Awaited<ReturnType<typeof dbAssignmentFindManyAssignment>>
type AssignmentMetaInfo = {
    id: bigint
    student_id: bigint
    created_at: Date
    assigned_at: Date | null
    status: session_status | null
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
            assigned_at: verboseAssignment.assignedReviewAssignment?.assigned_at ?? null,
            status: verboseAssignment.assignedReviewAssignment?.status ?? null,
            bookTitleArray: Array.from(bookTitleSet),
            questionCount,
        }
        return metaInfo
    })
    return assignmentMetaInfoArray
}
assignmentRouter.get("/", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const result = await dbAssignmentFindManyAssignment({ user_id, classroom_id, student_id })
    const condensed = condenseAssignmentMetaInfo(result)
    const serializable = makeSerializable(condensed)
    // const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

// NOTE: 얘는 오답과제를 만들려고 하는데 거기에 들어갈 문제들이 무엇인지 보여주는 용도(틀린 문제들 종합한 결과 정리해서 보여준다)
// NOTE: 지금까지의 모든 체크를 보려면 get check를 봐야 한다
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
    const classroom_id = convertToBigIntOrNull(req.body.classroom_id)
    const bookWithReviewChecksArray = req.body.bookWithReviewChecksArray as BookWithReviewChecksFromClient[]

    const result = await dbAssignmentCreateAssignment({
        user_id,
        bookWithReviewChecksArray,
        classroom_id,
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
    const assignment_id = convertToBigIntOrThrow(req.params.assignment_id)
    const status = req.body.status as session_status
    validateBody({ status })

    const result = await dbAssignedAssignmentUpsert({ user_id, assignment_id, status })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})
assignmentRouter.delete("/:assignment_id/assigned", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const assignment_id = convertToBigIntOrThrow(req.params.assignment_id)
    const result = await dbAssignedAssignmentDelete({ user_id, assignment_id })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default assignmentRouter
