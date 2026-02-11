import type { review_check_status } from "@/generated/prisma/enums.js"

export type QuestionIdToInfoForApi = Record<
    string, // NOTE: question_id
    {
        status: review_check_status | null // NOTE: use to delete if null
        session_id: bigint
    }
>

export type QuestionIdToInfoFromClient = Record<
    string, // NOTE: question_id
    {
        status: review_check_status | null // NOTE: use to delete if null
        session_id: string // NOTE: 오답 체크는 부여된 묶음에서만 가능함
    }
>
