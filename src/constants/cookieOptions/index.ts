import type { CookieOptions } from "express"

// TODO: 1일로 수정해야
// export const ACCESS_TOKEN_AGE: number = 1000 * 60 * 60 * 24 // NOTE: 1일 <<<< for production
export const ACCESS_TOKEN_AGE: number = 1000 * 60 * 60 * 1 // NOTE: 1시간 <<<< for development

// TODO: 30일로 수정해야
// export const REFRESH_TOKEN_AGE: number = 1000 * 60 * 60 * 24 * 30 // NOTE: 30일 <<<< for production
export const REFRESH_TOKEN_AGE: number = 1000 * 60 * 60 * 1 // NOTE: 1시간 <<<< for development

export const REFRESH_TOKEN_NAME: string = "arbor_refresh_token" as const

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true, // Makes the cookie inaccessible to client-side JavaScript
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
    maxAge: REFRESH_TOKEN_AGE, // Cookie valid for 1 day (in milliseconds)
    sameSite: "strict", // Helps prevent CSRF attacks
} as const
