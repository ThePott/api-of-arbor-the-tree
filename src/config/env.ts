import dotenv from "dotenv"
dotenv.config()

const checkEnvVar = (envVar: string | undefined, label: string): string => {
    if (!envVar) {
        throw new Error(`---- MISSING ENV VAR: ${String(label)}`)
    }

    return envVar
}

export const CLIENT_ORIGIN = checkEnvVar(process.env.CLIENT_ORIGIN, "CLIENT_ORIGIN")
export const DATABASE_URL = checkEnvVar(process.env.DATABASE_URL, "DATABASE_URL")

export const KAKAO_REQUEST_TOKEN_URL = checkEnvVar(process.env.KAKAO_REQUEST_TOKEN_URL, "KAKAO_REQUEST_TOKEN_URL")
export const KAKAO_CLIENT_ID = checkEnvVar(process.env.KAKAO_CLIENT_ID, "KAKAO_CLIENT_ID")
export const KAKAO_REDIRECT_URI = checkEnvVar(process.env.KAKAO_REDIRECT_URI, "KAKAO_REDIRECT_URI")
export const KAKAO_ME_URL = checkEnvVar(process.env.KAKAO_ME_URL, "KAKAO_ME_URL")
export const KAKAO_LOGOUT_URL = checkEnvVar(process.env.KAKAO_LOGOUT_URL, "KAKAO_LOGOUT_URL")
export const KAKAO_UNLINK_URL = checkEnvVar(process.env.KAKAO_UNLINK_URL, "KAKAO_UNLINK_URL")

export const ACCESS_TOKEN_SECRET = checkEnvVar(process.env.ACCESS_TOKEN_SECRET, "ACCESS_TOKEN_SECRET")
export const REFRESH_TOKEN_SECRET = checkEnvVar(process.env.REFRESH_TOKEN_SECRET, "REFRESH_TOKEN_SECRET")
