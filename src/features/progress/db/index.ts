import type { session_status } from "@/generated/prisma/enums.js"
import prismaClient from "@/src/db/prismaClient.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import {
    checkClassroomStudentExclusiveness,
    ClassroomStudentAuthorizationError,
    ClassroomStudentExclusivenessError,
} from "../utils/classroomStudentErrors.js"
import type { syllabusWhereInput } from "@/generated/prisma/models.js"

// export type ProgressBase = {
//     classroom_id: bigint | null
//     student_id: bigint | null
//     user_id: bigint
//     hagwon_id: bigint
// }
// export type ProgressSyllabusRelated = ProgressBase & {
//     syllabus_id: bigint
// }
// export type ProgressOptionalSyllabusRelated = ProgressBase & {
//     syllabus_id: bigint | null
// }

type DbProgressCreateSyllabusProps = {
    classroom_id: bigint | null
    student_id: bigint | null
    hagwon_id: bigint
    syllabus_id: bigint
}
export const dbProgressCreateSyllabus = async ({
    syllabus_id,
    classroom_id,
    student_id,
    hagwon_id,
}: DbProgressCreateSyllabusProps) => {
    if (student_id) {
        const student = await prismaClient.student.findUnique({
            where: {
                id: student_id,
                hagwon: { id: hagwon_id },
            },
        })
        if (!student) throw ClassroomStudentAuthorizationError

        const result = await prismaClient.student_syllabus.create({ data: { syllabus_id, student_id } })
        return result
    }

    if (classroom_id) {
        const classroom = await prismaClient.classroom.findUnique({
            where: {
                id: classroom_id,
                hagwon: { id: hagwon_id },
            },
        })

        if (!classroom) throw ClassroomStudentAuthorizationError
        const result = await prismaClient.classroom_syllabus.create({ data: { syllabus_id, classroom_id } })
        return result
    }

    throw ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")
}

export const dbProgressFindManySyllabus = async (hagwon_id: bigint) => {
    const result = await prismaClient.syllabus.findMany({ where: { hagwon_id }, include: { book: true } })
    return result
}

type DbProgressFindManySyllabusAssignedProps = {
    classroom_id: bigint | null
    student_id: bigint | null
    hagwon_id: bigint
}
export const dbProgressFindManySyllabusAssigned = async ({
    classroom_id,
    student_id,
    hagwon_id,
}: DbProgressFindManySyllabusAssignedProps) => {
    if (classroom_id) {
        const result = await prismaClient.classroom_syllabus.findMany({
            where: { classroom_id, classroom: { hagwon_id } },
            include: { syllabus: { include: { book: true } } },
        })
        return result
    }

    if (!student_id) throw ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")

    const result = await prismaClient.student_syllabus.findMany({
        where: { student_id, syllabus: { hagwon_id } },
        include: { syllabus: { include: { book: true } } },
    })
    return result
}

type DbProgressDeleteSyllabusProps = {
    classroom_id: bigint | null
    student_id: bigint | null
    user_id: bigint
    hagwon_id: bigint
    syllabus_id: bigint
}
export const dbProgressDeleteSyllabus = async ({
    classroom_id,
    student_id,
    user_id,
    hagwon_id,
    syllabus_id,
}: DbProgressDeleteSyllabusProps) => {
    if (classroom_id) {
        const result = prismaClient.classroom_syllabus.delete({
            where: {
                classroom_id_syllabus_id: { classroom_id, syllabus_id },
                classroom: { hagwon: { id: hagwon_id, principal: { user_id } } },
            },
        })
        return result
    }
    if (!student_id) throw ApiError.BadRequest("반 혹은 학생을 선택해주세요")
    const result = prismaClient.student_syllabus.delete({
        where: {
            student_id_syllabus_id: { syllabus_id, student_id },
            student: { hagwon: { id: hagwon_id, principal: { user_id } } },
        },
    })
    return result
}

const baseSelect = {
    id: true,
    book: true,
    // NOTE: 각 세션에 제목을 붙이려면 문제집 정보 싹 긁어와야 함
    sessions: {
        select: {
            id: true,
            sessionQuestions: {
                select: {
                    question: {
                        select: { step: { select: { title: true, topic: { select: { title: true } } } } },
                    },
                },
            },
        },
    },
}

type DbProgressFindManySyllabusWithSessionsProps = {
    classroom_id: bigint | null
    student_id: bigint | null
    hagwon_id: bigint
    syllabus_id: bigint | null
}
// NOTE: props 그대로 받아 넣음
const makeWhereForSyllabusWithSession = ({
    classroom_id,
    student_id,
    hagwon_id,
    syllabus_id,
}: DbProgressFindManySyllabusWithSessionsProps): syllabusWhereInput => {
    if (classroom_id && syllabus_id) return { id: syllabus_id, hagwon_id }

    if (classroom_id && !syllabus_id) return { hagwon_id, classroomSyllabuses: { some: { classroom_id } } }

    if (!student_id) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    if (syllabus_id) return { hagwon_id, id: syllabus_id }

    return { hagwon_id, studentSyllabuses: { some: { student_id } } }
}
export const dbProgressFindManySyllabusWithSessions = async (props: DbProgressFindManySyllabusWithSessionsProps) => {
    const { student_id, classroom_id } = props
    const result = await prismaClient.syllabus.findMany({
        where: makeWhereForSyllabusWithSession(props),
        select: {
            ...baseSelect,
            sessions: {
                select: {
                    ...baseSelect.sessions.select,
                    ...(classroom_id && {
                        assignedSessionClassrooms: {
                            select: { status: true, assigned_at: true },
                            where: {
                                classroom_id,
                            },
                        },
                    }),
                    ...(classroom_id &&
                        !student_id && {
                            completedSessionClassrooms: {
                                select: { completed_at: true },
                                where: { classroom_id },
                            },
                        }),
                    ...(student_id &&
                        !classroom_id && {
                            assignedSessionStudents: {
                                select: { status: true, assigned_at: true },
                                where: {
                                    student_id,
                                },
                            },
                        }),
                    ...(student_id && {
                        completedSessionStudents: {
                            select: { completed_at: true },
                            where: { student_id },
                        },
                    }),
                },
            },
        },
    })
    return result
}

type DbProgressAssignSessionProps = {
    classroom_id: bigint | null
    student_id: bigint | null
    hagwon_id: bigint
    session_id: bigint
    session_status: session_status
}
export const dbProgressAssignSession = async ({
    classroom_id,
    student_id,
    hagwon_id,
    session_id,
    session_status,
}: DbProgressAssignSessionProps) => {
    if (Boolean(classroom_id) === Boolean(student_id)) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    if (classroom_id) {
        const result = await prismaClient.assigned_session_classroom.upsert({
            where: { session_id_classroom_id: { session_id, classroom_id }, session: { syllabus: { hagwon_id } } },
            create: { session_id, classroom_id, status: session_status },
            update: { status: session_status },
        })
        return result
    }

    if (!student_id) throw ApiError.Internal("학생을 선택해주세요")

    const result = await prismaClient.assigned_session_student.upsert({
        where: { session_id_student_id: { session_id, student_id }, session: { syllabus: { hagwon_id } } },
        create: { session_id, student_id, status: session_status },
        update: { status: session_status },
    })
    return result
}

type DbProgressDeleteAssignedSessionProps = {
    user_id: bigint
    hagwon_id: bigint
    classroom_id: bigint | null
    student_id: bigint | null
    session_id: bigint
}
export const dbProgressDeleteAssignedSession = async ({
    user_id,
    hagwon_id,
    classroom_id,
    student_id,
    session_id,
}: DbProgressDeleteAssignedSessionProps) => {
    checkClassroomStudentExclusiveness({ classroom_id, student_id })

    if (classroom_id) {
        const result = await prismaClient.assigned_session_classroom.delete({
            where: {
                session_id_classroom_id: { session_id, classroom_id },
                classroom: { hagwon_id, hagwon: { principal: { user_id } } },
            },
        })
        return result
    }

    if (!student_id) throw ClassroomStudentExclusivenessError

    const result = await prismaClient.assigned_session_student.delete({
        where: {
            session_id_student_id: { session_id, student_id },
            student: { hagwon_id, hagwon: { principal: { user_id } } },
        },
    })
    return result
}

type DbProgressCreateCompleteSessionProps = {
    hagwon_id: bigint
    classroom_id: bigint | null
    student_id: bigint | null
    session_id: bigint
}
export const dbProgressCreateCompleteSession = async ({
    hagwon_id,
    classroom_id,
    session_id,
    student_id,
}: DbProgressCreateCompleteSessionProps) => {
    // NOTE: MUST early return for STUDENT FIRST
    if (student_id) {
        const studentResult = await prismaClient.student.findUnique({
            where: { id: student_id, hagwon_id },
        })
        if (!studentResult) throw ClassroomStudentAuthorizationError

        const result = await prismaClient.completed_session_student.create({
            data: { session_id, student_id },
        })
        return result
    }

    // NOTE: 배타적이어서 던지는 게 아니라 그냥 없어서 던지는 거기는 하다
    if (!classroom_id) throw ClassroomStudentExclusivenessError
    const classroomResult = await prismaClient.classroom.findUnique({
        where: { id: classroom_id, hagwon_id },
    })
    if (!classroomResult) throw ClassroomStudentAuthorizationError

    const result = await prismaClient.completed_session_classroom.create({
        data: { session_id, classroom_id },
    })
    return result
}

type DbProgressDeleteCompleteSessionProps = {
    user_id: bigint
    hagwon_id: bigint
    classroom_id: bigint | null
    student_id: bigint | null
    session_id: bigint
}
export const dbProgressDeleteCompleteSession = async ({
    user_id,
    hagwon_id,
    classroom_id,
    session_id,
    student_id,
}: DbProgressDeleteCompleteSessionProps) => {
    // NOTE: MUST early return for STUDENT FIRST
    if (student_id) {
        const result = await prismaClient.completed_session_student.delete({
            where: {
                session_id_student_id: { session_id, student_id },
                student: { hagwon_id, hagwon: { principal: { user_id } } },
            },
        })
        return result
    }

    // NOTE: 배타적이어서 던지는 게 아니라 그냥 없어서 던지는 거기는 하다
    if (!classroom_id) throw ClassroomStudentExclusivenessError
    const result = await prismaClient.completed_session_classroom.delete({
        where: {
            session_id_classroom_id: { session_id, classroom_id },
            classroom: { hagwon_id, hagwon: { principal: { user_id } } },
        },
    })
    return result
}
