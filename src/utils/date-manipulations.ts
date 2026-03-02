export const makeStartOfToday = (): Date => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return startOfToday
}
