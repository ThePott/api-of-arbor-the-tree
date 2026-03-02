import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { Router } from "express"
import {
    dbAssignedAssignmentUpsert,
    dbAssignedAssignmentDelete,
    dbAssignmentCreateAssignment,
    dbAssignmentFindBookForPdf,
    dbAssignmentFindManyAssignment,
    dbAssignmentFindManyBookWithReviewNeededAttempts,
} from "../db/index.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import type { session_status } from "@/generated/prisma/client.js"
import makeAssignmentPdf from "../pdf/index.js"
import { validateBody } from "@/src/utils/validateBody.js"
import { logError } from "@/src/utils/log-error.js"

const assignmentRouter = Router()

assignmentRouter.get("/", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const result = await dbAssignmentFindManyAssignment({ user_id, classroom_id, student_id })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

// NOTE: 얘는 오답과제를 만들려고 하는데 거기에 들어갈 문제들이 무엇인지 보여주는 용도(틀린 문제들 종합한 결과 정리해서 보여준다)
// NOTE: 지금까지의 모든 체크를 보려면 get check를 봐야 한다
type BookWithReviewNeededAttemptsVerbose = Awaited<ReturnType<typeof dbAssignmentFindManyBookWithReviewNeededAttempts>>
type AssignmentCandidate = {
    bookId: bigint
    bookTitle: string
    questionCount: number
}
const condenseBookWithReviewChecksArray = (bookWithReviewChecksArray: BookWithReviewNeededAttemptsVerbose) => {
    const assignmentCandidateArray: AssignmentCandidate[] = bookWithReviewChecksArray.map((book) => {
        const questionsInBook = book.topics.flatMap((topic) => {
            const questionsInTopic = topic.steps.flatMap((step) => step.questions)
            return questionsInTopic
        })
        return { bookId: book.id, bookTitle: book.title, questionCount: questionsInBook.length }
    })
    return assignmentCandidateArray
}
assignmentRouter.get("/create", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    // NOTE: 여기선 후보를 찾는 거니까 책별 meta data만 필요하다
    const result = await dbAssignmentFindManyBookWithReviewNeededAttempts({ user_id, classroom_id, student_id })
    const condensed = condenseBookWithReviewChecksArray(result)
    const serializable = makeSerializable(condensed)
    // const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

assignmentRouter.post("/create", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const book_ids = req.body?.book_ids // NOTE: body가 없으면 속성 접근 시 에러가 뜬다
    validateBody({ book_ids })

    const result = await dbAssignmentCreateAssignment({ user_id, classroom_id, student_id, book_ids })
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
    const pdf = makeAssignmentPdf({
        studentName: "홍길동",
        assigned_at: new Date(),
        bookForPdfArray: condensed,
    })
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
