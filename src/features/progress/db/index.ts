import type { session_status } from "@/generated/prisma/enums.js"
import prismaClient from "@/src/db/prismaClient.js"
import { ApiError } from "@/src/errors/appError/AppError.js"
import {
    checkClassroomStudentExclusiveness,
    ClassroomStudentAuthorizationError,
    ClassroomStudentExclusivenessError,
} from "../utils/classroomStudentErrors.js"

export type ProgressBase = {
    classroom_id: bigint | null
    student_id: bigint | null
    user_id: bigint
}
export type ProgressSyllabusRelated = ProgressBase & {
    syllabus_id: bigint
}
export type ProgressOptionalSyllabusRelated = ProgressBase & {
    syllabus_id: bigint | null
}

export const dbProgressCreateSyllabus = async ({
    syllabus_id,
    classroom_id,
    student_id,
    user_id,
}: ProgressSyllabusRelated) => {
    if (student_id) {
        const student = await prismaClient.student.findUnique({
            where: {
                id: student_id,
                hagwon: { principal: { user_id } },
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
                hagwon: { principal: { user_id } },
            },
        })

        if (!classroom) throw ClassroomStudentAuthorizationError
        const result = await prismaClient.classroom_syllabus.create({ data: { syllabus_id, classroom_id } })
        return result
    }

    throw ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")
}

export const dbProgressFindManySyllabus = async (user_id: bigint) => {
    const result = await prismaClient.syllabus.findMany({ where: { user_id }, include: { book: true } })
    return result
}

export const dbProgressFindManySyllabusAssigned = async ({ user_id, classroom_id, student_id }: ProgressBase) => {
    if (classroom_id) {
        const result = await prismaClient.classroom_syllabus.findMany({
            where: { classroom_id, classroom: { hagwon: { principal: { user_id } } } },
            include: { syllabus: { include: { book: true } } },
        })
        return result
    }

    if (!student_id) throw ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")

    const result = await prismaClient.student_syllabus.findMany({
        where: { student_id, syllabus: { user_id } },
        include: { syllabus: { include: { book: true } } },
    })
    return result
}

export const dbProgressDeleteSyllabus = async ({
    classroom_id,
    student_id,
    user_id,
    syllabus_id,
}: ProgressSyllabusRelated) => {
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

const makeWhereForSyllabusWithSession = ({
    classroom_id,
    student_id,
    user_id,
    syllabus_id,
}: ProgressOptionalSyllabusRelated) => {
    if (classroom_id && syllabus_id) return { id: syllabus_id, user_id }

    if (classroom_id && !syllabus_id) return { user_id, classroomSyllabuses: { some: { classroom_id } } }

    if (!student_id) throw ApiError.BadRequest("학생 혹은 반을 선택해주세요")

    if (syllabus_id) return { user_id, id: syllabus_id }

    return { user_id, studentSyllabuses: { some: { student_id } } }
}
// NOTE: THIS RETURNS DUPLICATED DATA. NEED TO DEDUPLICATE
export const dbProgressFindManySyllabusWithSessions = async (props: ProgressOptionalSyllabusRelated) => {
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

type DbProgressAssignSessionProps = ProgressBase & {
    session_id: bigint
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

type DbProgressDeleteAssignedSessionProps = ProgressBase & {
    session_id: bigint
}
export const dbProgressDeleteAssignedSession = async ({
    user_id,
    session_id,
    classroom_id,
    student_id,
}: DbProgressDeleteAssignedSessionProps) => {
    checkClassroomStudentExclusiveness({ classroom_id, student_id })

    if (classroom_id) {
        const result = await prismaClient.assigned_session_classroom.delete({
            where: {
                session_id_classroom_id: { session_id, classroom_id },
                classroom: { hagwon: { principal: { user_id } } },
            },
        })
        return result
    }

    if (!student_id) throw ClassroomStudentExclusivenessError

    const result = await prismaClient.assigned_session_student.delete({
        where: {
            session_id_student_id: { session_id, student_id },
            student: { hagwon: { principal: { user_id } } },
        },
    })
    return result
}

type DbProgressCompleteSessionProps = ProgressBase & { session_id: bigint }
export const dbProgressCreateCompleteSession = async ({
    classroom_id,
    session_id,
    user_id,
    student_id,
}: DbProgressCompleteSessionProps) => {
    // NOTE: MUST early return for STUDENT FIRST
    if (student_id) {
        const studentResult = await prismaClient.student.findUnique({
            where: { id: student_id, hagwon: { principal: { user_id } } },
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
        where: { id: classroom_id, hagwon: { principal: { user_id } } },
    })
    if (!classroomResult) throw ClassroomStudentAuthorizationError

    const result = await prismaClient.completed_session_classroom.create({
        data: { session_id, classroom_id },
    })
    return result
}
export const dbProgressDeleteCompleteSession = async ({
    classroom_id,
    session_id,
    user_id,
    student_id,
}: DbProgressCompleteSessionProps) => {
    // NOTE: MUST early return for STUDENT FIRST
    if (student_id) {
        const studentResult = await prismaClient.student.findUnique({
            where: { id: student_id, hagwon: { principal: { user_id } } },
        })
        if (!studentResult) throw ClassroomStudentAuthorizationError

        const result = await prismaClient.completed_session_student.delete({
            where: { session_id_student_id: { session_id, student_id } },
        })
        return result
    }

    // NOTE: 배타적이어서 던지는 게 아니라 그냥 없어서 던지는 거기는 하다
    if (!classroom_id) throw ClassroomStudentExclusivenessError
    const classroomResult = await prismaClient.classroom.findUnique({
        where: { id: classroom_id, hagwon: { principal: { user_id } } },
    })
    if (!classroomResult) throw ClassroomStudentAuthorizationError

    const result = await prismaClient.completed_session_classroom.delete({
        where: { session_id_classroom_id: { session_id, classroom_id } },
    })
    return result
}
