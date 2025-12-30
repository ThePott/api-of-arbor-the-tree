import type { role } from "@/generated/prisma/enums.js"

export type LoginProvider = "kakao" | "email"

export interface ChildOfParent {
    name: string
    phoneNumber: string
}

export interface SignupPayload {
    name: string
    kakao_id?: number
    email?: string
    password?: string
}

export type LoginPayload = Omit<SignupPayload, "name">

export interface MePatchPayload {
    name?: string
    phone_number?: string
    hagwon?: string
    role?: role
    school?: string
    children?: ChildOfParent[]
}

type BookDetailKey =
    | "topic"
    | "step"
    | "question_name"
    | "question_page"
    | "solution_page"
    | "session"
    | "sub_question_name"

type BookDetail = Record<BookDetailKey, string>

export type BookWritePayload = { title: string; published_year: number; data: BookDetail[] }
