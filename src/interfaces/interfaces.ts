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

export type BookDetail = Record<BookDetailKey, string>

type QuestionPayload = {
    // NOTE: biging? string? number?
    // TODO: MIGHT NEED TO FIX LASTER
    id?: number
    name: string
    order: number
    question_page: number
    solution_page: number
    session: number
    sub_question_name?: string
}

type StepPayload = {
    // NOTE: biging? string? number?
    // TODO: MIGHT NEED TO FIX LASTER
    id?: number
    title: string
    order: number
    questions: QuestionPayload[]
}

type TopicPayload = {
    // NOTE: biging? string? number?
    // TODO: MIGHT NEED TO FIX LASTER
    id?: number
    title: string
    order: number
    steps: StepPayload[]
}

export type BookPayload = {
    // NOTE: biging? string? number?
    // TODO: MIGHT NEED TO FIX LASTER
    id?: number
    title: string
    published_year: number
    topics: TopicPayload[]
}
