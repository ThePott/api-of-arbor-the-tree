export type LoginProvider = "kakao" | "email"

export interface LoginInfo {
    kakaoIdInString?: string
    email?: string
    password?: string
}
