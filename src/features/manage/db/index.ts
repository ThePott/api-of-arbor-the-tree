import prismaClient from "@/src/db/prismaClient.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

// NOTE: 함수 파라미터 작성 원칙
// NOTE: 파라미터가 하나 -> 그냥 파라미터로
// NOTE: 파라미터가 두 개 이상 -> object param으로, props type 위에 작성

export const dbFindManyByClassroom = async (user_id: bigint) => {
    const isolatedStudentPropmise = prismaClient.student.findMany({
        where: {
            hagwon: { principal: { user_id } },
            classroomStudents: { none: {} },
        },
        include: { users: true, school: true },
    })
    const classroomPromise = prismaClient.classroom.findMany({
        where: { hagwon: { principal: { user_id } } },
        include: {
            classroomStudents: {
                include: {
                    student: {
                        include: {
                            users: true,
                            school: true,
                            classroomStudents: { include: { classroom: true } },
                        },
                    },
                },
            },
        },
    })
    const [isolatedStudentArray, classroomArray] = await Promise.all([isolatedStudentPropmise, classroomPromise])
    return { isolatedStudentArray, classroomArray }
}
// export const dbFindManyByStudent = async (user_id: bigint) => {}

type DbCreateClassroomProps = {
    name: string
    user_id: bigint
}
export const dbCreateClassroom = async ({ name, user_id }: DbCreateClassroomProps) => {
    const principalResult = await prismaClient.principal.findUnique({ where: { user_id } })
    if (!principalResult) throw ApiError.NotFound("학원을 못 찾았어요")
    const result = await prismaClient.classroom.create({ data: { name, hagwon_id: principalResult.hagwon_id } })
    return result
}

type DbAppendStudentToClassroom = {
    student_id: bigint
    classroom_id: bigint
}
export const dbAppendStudentToClassroom = async ({ student_id, classroom_id }: DbAppendStudentToClassroom) => {
    const result = await prismaClient.classroom_student.create({ data: { student_id, classroom_id } })
    return result
}

export const dbDeleteClassroomStudent = async (classroom_student_id: bigint) => {
    const result = await prismaClient.classroom_student.delete({ where: { id: classroom_student_id } })
    return result
}
