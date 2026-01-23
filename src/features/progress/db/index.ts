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

type DbProgressDeleteSyllabusProps = {
    classroom_id: bigint | null
    student_id: bigint | null
    syllabus_id: bigint
    user_id: bigint
}
export const dbProgressDeleteSyllabus = async ({
    classroom_id,
    student_id,
    user_id,
    syllabus_id,
}: DbProgressDeleteSyllabusProps) => {
    if (classroom_id) {
        const result = prismaClient.classroom_syllabus.delete({
            where: {
                classroom_id_syllabus_id: { classroom_id, syllabus_id },
                classroom: { hagwon: { principal: { user_id } } },
            },
        })
        return result
    }
    if (!student_id) throw ApiError.BadRequest("반 혹은 학생을 선택해주세요")
    const result = prismaClient.student_syllabus.delete({
        where: {
            student_id_syllabus_id: { syllabus_id, student_id },
            student: { hagwon: { principal: { user_id } } },
        },
    })
    return result
}

type DbProgressFindManySessionProps = {
    classroom_id: bigint | null
    student_id: bigint | null
    syllabus_id: bigint
    user_id: bigint
}
export const dbProgressFindManySession = async ({
    classroom_id,
    student_id,
    user_id,
    syllabus_id,
}: DbProgressFindManySessionProps) => {
    // NOTE: 반 진도 (학생 세부 사항 없음)
    if (classroom_id) {
        // TODO: 반의 학생 세부 진도 받아오는 것도 만들어야
        const result = await prismaClient.session.findMany({
            where: { syllabus_id, syllabus: { user_id } },
            include: {
                sessionQuestions: { include: { question: { include: { step: { include: { topic: true } } } } } },
            },
        })
        return result
    }

    if (student_id) {
        // TODO: 여기 채워야
        throw ApiError.Internal("---- 여기는 아직 만들지 않았어요")
    }
}
