import type { session_status } from "@/generated/prisma/enums.js"
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

export const dbProgressFindManySyllabus = async (user_id: bigint) => {
    const result = await prismaClient.syllabus.findMany({ where: { user_id }, include: { book: true } })
    return result
}

type DbProgressFindManySyllabusAssignedProps = {
    classroom_id: bigint | null
    student_id: bigint | null
}
export const dbProgressFindManySyllabusAssigned = async ({
    classroom_id,
    student_id,
}: DbProgressFindManySyllabusAssignedProps) => {
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
    syllabus_id: bigint | null
    user_id: bigint
}
const selectConciseSyllabus = {
    id: true,
    book: true,
    // NOTE: 각 세션에 제목을 붙이려면 문제집 정보 싹 긁어와야 함
    sessions: {
        select: {
            id: true,
            sessionQuestions: {
                select: {
                    question: {
                        select: {
                            step: {
                                select: {
                                    title: true,
                                    topic: { select: { title: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}
// NOTE: THIS RETURNS DUPLICATED DATA. NEED TO DEDUPLICATE
export const dbProgressFindManySyllabusWithSession = async ({
    classroom_id,
    student_id,
    user_id,
    syllabus_id,
}: DbProgressFindManySessionProps) => {
    // TODO: 현재 반에서 한 명을 선택했을 때 그 학생의 정보 받아오는 건 없음

    // NOTE: 반에 할당된 특정 실라버스의 세션만 받아오기 (raw + with status)
    if (classroom_id && syllabus_id) {
        // TODO: 반의 학생 세부 진도 받아오는 것도 만들어야
        const result = await prismaClient.syllabus.findMany({
            where: { id: syllabus_id, user_id },
            select: selectConciseSyllabus,
        })
        return result
    }

    // NOTE: 반에 할당된 모든 실라버스의 세션 전체 받아오기 (raw + with status)
    if (classroom_id && !syllabus_id) {
        const result = await prismaClient.syllabus.findMany({
            where: { user_id, classroomSyllabuses: { some: { classroom_id } } },
            select: selectConciseSyllabus,
        })
        return result
    }

    if (!student_id) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    if (syllabus_id) {
        const result = await prismaClient.syllabus.findMany({
            where: { user_id, id: syllabus_id },
            select: selectConciseSyllabus,
        })
        return result
    }

    const result = await prismaClient.syllabus.findMany({
        where: { user_id, studentSyllabuses: { some: { student_id } } },
        select: selectConciseSyllabus,
    })
    return result
}

type DbProgressAssignSessionProps = {
    user_id: bigint
    session_id: bigint
    classroom_id: bigint | null
    student_id: bigint | null
    session_status: session_status
}
export const dbProgressAssignSession = async ({
    user_id,
    session_id,
    session_status,
    classroom_id,
    student_id,
}: DbProgressAssignSessionProps) => {
    if (Boolean(classroom_id) === Boolean(student_id)) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    if (classroom_id) {
        const result = await prismaClient.assigned_session_classroom.upsert({
            where: { session_id_classroom_id: { session_id, classroom_id }, session: { syllabus: { user_id } } },
            create: { session_id, classroom_id, status: session_status },
            update: { status: session_status },
        })
        return result
    }

    if (!student_id) throw ApiError.Internal("학생을 선택해주세요")

    const result = await prismaClient.assigned_session_student.upsert({
        where: { session_id_student_id: { session_id, student_id }, session: { syllabus: { user_id } } },
        create: { session_id, student_id, status: session_status },
        update: { status: session_status },
    })
    return result
}
