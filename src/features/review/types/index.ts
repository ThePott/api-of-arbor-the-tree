import type { attempt_status } from "@/generated/prisma/enums.js"

export type SourceToIdType = {
    client: string
    api: bigint // NOTE: should be never null when bulk write
}

export type ForWhatToReviewCheckChangedInfo<TSource extends keyof SourceToIdType> = {
    session: {
        forWhat: "session"
        status: attempt_status | null
        session_id: SourceToIdType[TSource]
    }
    assignment: {
        forWhat: "assignment"
        status: attempt_status | null
    }
}

export type ReviewCheckChangedInfo<
    TSource extends keyof SourceToIdType,
    TForWhat extends keyof ForWhatToReviewCheckChangedInfo<TSource>,
> = ForWhatToReviewCheckChangedInfo<TSource>[TForWhat]

// NOTE: for session, id is question_id, when upsert, use question_student_session_id
// NOTE: for assignment, id is question_attempt_id
export type IdToChangedInfo<
    TSource extends keyof SourceToIdType,
    TForWhat extends keyof ForWhatToReviewCheckChangedInfo<TSource>,
> = Record<string, ReviewCheckChangedInfo<TSource, TForWhat>>
