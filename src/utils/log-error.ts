export const logError = (fn: () => void) => {
    try {
        fn()
    } catch (error) {
        console.error(error)
    }
}
