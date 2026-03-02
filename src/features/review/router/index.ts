import { Router } from "express"
import { ApiError } from "@/src/errors/appError/AppError.js"
import { extractUserId } from "@/src/utils/decodeAccessToken.js"
import { makeSerializable } from "@/src/utils/makeSerializable.js"
import {
    dbReviewCheckBulkWrite,
    dbReviewCheckForAssignmentFindMany,
    dbReviewCheckAssignmentBulkWrite,
    dbReviewCheckFindMany,
} from "../db/index.js"
import { convertToBigIntOrNull, convertToBigIntOrThrow } from "@/src/utils/convertToBigInt.js"
import { validateBody } from "@/src/utils/validateBody.js"
import type { IdToChangedInfo } from "../types/index.js"
import { addAttemptInfoToSingleBook, addAttemptInfoToBookArray } from "../utils/add-attempt-info.js"

const reviewCheckRouter = Router()

export const ReviewCheckError = ApiError.Internal("오답 체크를 정리하던 중 문제가 발생했어요")

reviewCheckRouter.get("/check", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const student_id = convertToBigIntOrNull(req.query.student_id)
    const syllabus_id = convertToBigIntOrNull(req.query.syllabus_id)
    if (!student_id || !syllabus_id) throw ApiError.BadRequest("학생과 문제집을 선택해주세요")

    const result = await dbReviewCheckFindMany({ user_id, classroom_id, student_id, syllabus_id })
    const joinedResult = addAttemptInfoToSingleBook(result)

    const serializable = makeSerializable(joinedResult)
    // const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

// NOTE: bulk update
reviewCheckRouter.post("/check", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id) // NOTE: MUST put in query params
    const student_id = convertToBigIntOrThrow(req.query.student_id) // NOTE: MUT put in query params
    const idToChangedInfoFromClient = req.body.changedReviewChecks as IdToChangedInfo<"client", "session">
    validateBody({ idToChangedInfoFromClient })

    const idToChangedInfo: IdToChangedInfo<"api", "session"> = Object.fromEntries(
        Object.entries(idToChangedInfoFromClient).map(([key, value]) => [
            key,
            { ...value, session_id: convertToBigIntOrThrow(value.session_id) },
        ])
    )

    const result = await dbReviewCheckBulkWrite({ user_id, classroom_id, student_id, idToChangedInfo })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

reviewCheckRouter.get("/check/assignment", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id)
    const result = await dbReviewCheckForAssignmentFindMany({ user_id, student_id, classroom_id })
    const extended = addAttemptInfoToBookArray(result)
    const serializable = makeSerializable(extended)
    res.status(200).json(serializable)
})

reviewCheckRouter.post("/check/assignment", async (req, res) => {
    const user_id = extractUserId(req.headers)
    const idToChangedInfo = req.body.idToChangedInfo as IdToChangedInfo<"api", "assignment">
    const classroom_id = convertToBigIntOrNull(req.query.classroom_id) // NOTE: 사실 question_attempt_id로 mutate하기에 불필요하지만 방어적으로 확인하느라 넣었다
    const student_id = convertToBigIntOrThrow(req.query.student_id)
    validateBody({ idToChangedInfo })

    const result = await dbReviewCheckAssignmentBulkWrite({ user_id, classroom_id, student_id, idToChangedInfo })
    const serializable = makeSerializable(result)
    res.status(200).json(serializable)
})

export default reviewCheckRouter
