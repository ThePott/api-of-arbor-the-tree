import type { dbAssignmentFindManyBookWithReviewNeededAttempts } from "@/src/features/assignment/db/index.js"

// NOTE: 이게 필요한가??
type BookWithReviewNeededAttemptsArray = Awaited<ReturnType<typeof dbAssignmentFindManyBookWithReviewNeededAttempts>>
const condenseBookWithReviewChecksArray = (bookWithReviewNeededAttemptsArray: BookWithReviewNeededAttemptsArray) => {
    const newData = bookWithReviewNeededAttemptsArray.map((book) => {
        book.topics.forEach((topic) => {
            const topic_order = topic.order
            topic.steps.forEach((step) => {
                const step_order = step.order
                step.questions.forEach((question) => {
                    const question_order = question.order
                    const extendedArray: ExtendedReviewCheck[] = question.reviewChecks.map((review_check) => ({
                        ...review_check,
                        topic_order,
                        step_order,
                        question_order,
                    }))
                    extendedReviewChecks.push(...extendedArray)
                })
            })
        })
        return { title: book.title, extendedReviewChecks }
    })
    return newData
}

export default condenseBookWithReviewChecksArray
