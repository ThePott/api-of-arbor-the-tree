import prismaClient from "@/src/db/prismaClient.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

type DbProgressCreateBook = {
    syllabus_id: bigint
    // NOTE: classroom_id, student_id 둘 중 하나만 있어야 함
    classroom_id?: bigint
    student_id?: bigint
    user_id: bigint
}
export const dbProgressCreateSyllabus = async ({
    syllabus_id,
    classroom_id,
    student_id,
    user_id,
}: DbProgressCreateBook) => {
    if (student_id) {
        const student = await prismaClient.student.findUnique({
            where: {
                id: student_id,
                hagwon: { principal: { user_id } },
            },
        })
        if (!student) throw ApiError.Forbidden("학원 내의 학생만 관리할 수 있어요")

        const result = await prismaClient.student_syllabus.create({ data: { syllabus_id, student_id } })
        return result
    }

    if (classroom_id) {
        const classroom = await prismaClient.classroom.findUnique({
            where: {
                id: classroom_id,
                hagwon: { principal: { user_id } },
            },
        })

        if (!classroom) throw ApiError.Forbidden("학원 내의 학생만 관리할 수 있어요")
        const result = await prismaClient.classroom_syllabus.create({ data: { syllabus_id, classroom_id } })
        return result
    }

    throw ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")
}

type DbProgressFindManySyllabusProps = {
    classroom_id: bigint | null
    student_id: bigint | null
}
export const dbProgressFindManySyllabus = async ({ classroom_id, student_id }: DbProgressFindManySyllabusProps) => {
    if (classroom_id) {
        const result = await prismaClient.classroom_syllabus.findMany({
            where: { classroom_id },
            include: { syllabus: { include: { book: true } } },
        })
        return result
    }

    if (!student_id) throw ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")

    const result = await prismaClient.student_syllabus.findMany({
        where: { student_id },
        include: { syllabus: { include: { book: true } } },
    })
    return result
}

type DbProgressDeleteBookProps = {
    classroom_id: bigint | null
    student_id: bigint | null
    book_id: bigint
    user_id: bigint
}
export const dbProgressDeleteBook = async ({
    classroom_id,
    student_id,
    user_id,
    book_id,
}: DbProgressDeleteBookProps) => {
    if (classroom_id) {
        const result = prismaClient.classroom_syllabus.delete({
            where: {
                classroom_id: { book_id, classroom_id },
                classroom: { hagwon: { principal: { user_id } } },
            },
        })
        return result
    }
    if (!student_id) throw ApiError.BadRequest("반 혹은 학생을 선택해주세요")
    const result = prismaClient.book_student.delete({
        where: {
            book_id_student_id: { book_id, student_id },
            student: { hagwon: { principal: { user_id } } },
        },
    })
    return result
}

type DbProgressSessionProps = {
    classroom_id: bigint | null
    student_id: bigint | null
    book_id: bigint
    user_id: bigint
}
export const dbProgressSession = async ({ classroom_id, student_id, user_id, book_id }: DbProgressSessionProps) => {
    // classroom yes ,student no -> 이건 선생이 정하면 자동으로 되는 거니까...
    // 로직이 다르겠구나
    // 반 -> homework, today, null
    // 학생 -> done
    // 반이면 반에서
    const result = await prismaClient.book.findMany({ where: { id: book_id }, include: { syllabi: {} } })
}
