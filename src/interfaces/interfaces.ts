export type LoginProvider = "kakao" | "email"

export interface SignupPayload {
    name: string
    kakao_id?: number
    email?: string
    password?: string
}

export type LoginPayload = Omit<SignupPayload, "name">
