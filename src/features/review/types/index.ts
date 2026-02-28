import type { review_check_status } from "@/generated/prisma/enums.js"

export type SourceToIdType = {
    client: string
    api: bigint // NOTE: should be never null when bulk write
}

export type ForWhatToReviewCheckChangedInfo<TSource extends keyof SourceToIdType> = {
    syllabus: {
        forWhat?: "syllabus"
        status: review_check_status | null
        session_id: SourceToIdType[TSource]
    }
    assignment: {
        forWhat: "assignment"
        status: review_check_status | null
    }
}

export type ReviewCheckChangedInfo<
    TSource extends keyof SourceToIdType,
    TForWhat extends keyof ForWhatToReviewCheckChangedInfo<TSource>,
> = ForWhatToReviewCheckChangedInfo<TSource>[TForWhat]

export type IdToChangedInfo<
    TSource extends keyof SourceToIdType,
    TForWhat extends keyof ForWhatToReviewCheckChangedInfo<TSource>,
> = Record<string, ReviewCheckChangedInfo<TSource, TForWhat>>
