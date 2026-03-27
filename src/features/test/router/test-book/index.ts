import type { condenseBookForPdf } from "@/src/features/assignment/router/index.js"

const testQuestion = {
    repeat_count: 1,
    id: BigInt(1),
    name: "1",
    order: 1,
    page: 1,
    solution_page: 1,
    step_id: BigInt(1),
    sub_question_id: null,
}
const testTopic = {
    questions: Array(6).fill(testQuestion),
    id: 1,
    title: "다항식의 연산",
    order: 1,
    book_id: 1,
}
const testBook: ReturnType<typeof condenseBookForPdf>[number] = {
    topics: Array(2).fill(testTopic),
    hagwon_id: BigInt(1),
    id: BigInt(1),
    user_id: BigInt(1),
    title: "수학의 비정석",
    published_year: 2026,
}

export default testBook
