import type { review_check_status } from "@/generated/prisma/enums.js"

export type QuestionIdToInfo = Record<
    string, // NOTE: question_id
    {
        status: review_check_status | null // NOTE: use to delete if null
        review_check_id: bigint | null
        assigned_session_student_id: bigint
    }
>

export type QuestionIdToInfoFromClient = Record<
    string, // NOTE: question_id
    {
        status: review_check_status | null // NOTE: use to delete if null
        review_check_id: string | null
        assigned_session_student_id: string // NOTE: 오답 체크는 부여된 묶음에서만 가능함
    }
>
