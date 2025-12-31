import prismaClient from "./prismaClient.js"
import type {
    BookPayload,
    BookWritePayload,
    QuestionPayload,
    StepPayload,
    TopicPayload,
} from "../interfaces/interfaces.js"

export const dbCheckIfBookExists = async (title: string): Promise<boolean> => {
    const result = await prismaClient.book.findFirst({ where: { title } })
    return Boolean(result)
}

export const dbCreateBook = async ({
    title,
    published_year,
    data,
    user_id,
}: BookWritePayload & { user_id: number }) => {
    const groupedByTopic = Object.groupBy(data, ({ topic }) => topic)
    const topicEntryArray = Object.entries(groupedByTopic)
    const sessionOrderArray = [...new Set(data.map((row) => row.session))]

    const topics: TopicPayload[] = topicEntryArray.reduce((acc, [topicTitle, rowArrayInTopic], topicIndex) => {
        const steps: StepPayload[] = Object.entries(Object.groupBy(rowArrayInTopic!, ({ step }) => step)).map(
            ([step, rowArrayInStep], stepIndex) => {
                const questions: QuestionPayload[] = rowArrayInStep!.map(
                    ({ question_name, question_page, solution_page, sub_question_name, session }, questionIndex) =>
                        ({
                            name: question_name,
                            order: questionIndex + 1,
                            page: Number(question_page),
                            solution_page: Number(solution_page),
                            session: Number(session),
                            sub_question_name,
                        }) as QuestionPayload
                )

                return {
                    title: step,
                    order: stepIndex + 1,
                    questions,
                } as StepPayload
            }
        )

        const topicPayload: TopicPayload = {
            title: topicTitle,
            order: topicIndex + 1,
            steps,
        } as TopicPayload
        return [...acc, topicPayload]
    }, [] as TopicPayload[])

    const bookPayload: BookPayload = { title, published_year, topics }

    const bookResult = await prismaClient.book.create({
        data: {
            title: bookPayload.title,
            published_year: bookPayload.published_year,
            topics: {
                create: bookPayload.topics.map((topicPayload) => ({
                    title: topicPayload.title,
                    order: topicPayload.order,
                    steps: {
                        create: topicPayload.steps.map((stepPayload) => ({
                            title: stepPayload.title,
                            order: stepPayload.order,
                            questions: {
                                create: stepPayload.questions.map((questionPayload) => ({
                                    name: questionPayload.name,
                                    order: questionPayload.order,
                                    page: questionPayload.page,
                                    solution_page: questionPayload.solution_page,
                                })),
                            },
                        })),
                    },
                })),
            },
        },
    })

    const syllabusResult = await prismaClient.syllabus.create({
        data: {
            user_id,
            book_id: bookResult.id,
            sessions: {
                create: sessionOrderArray.map((order) => ({
                    order: Number(order),
                })),
            },
        },
    })

    // NOTE: need to create map
}
