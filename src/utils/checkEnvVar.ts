export const checkEnvVar = (envVar: string | undefined) => {
    if (!envVar) {
        throw new Error("---- MISSING ENV VAR")
    }

    return envVar
}
