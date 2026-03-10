import prismaClient from "@/src/db/prismaClient.js"

// NOTE: 함수 파라미터 작성 원칙
// NOTE: 파라미터가 하나 -> 그냥 파라미터로
// NOTE: 파라미터가 두 개 이상 -> object param으로, props type 위에 작성

export const dbFindManyByClassroom = async (hagwon_id: bigint) => {
    const studentPromise = prismaClient.student.findMany({
        where: { hagwon_id },
        include: { users: true, school: true },
    })

    const classroomPromise = prismaClient.classroom.findMany({ where: { hagwon_id } })
    const classroomStudentPromise = prismaClient.classroom_student.findMany({
        where: { classroom: { hagwon_id } },
    })

    const [studentArray, classroomArray, classroomStudentArray] = await Promise.all([
        studentPromise,
        classroomPromise,
        classroomStudentPromise,
    ])
    return { studentArray, classroomArray, classroomStudentArray }
}

type DbCreateClassroomProps = {
    classroom_name: string
    hagwon_id: bigint
}
export const dbCreateClassroom = async ({ classroom_name, hagwon_id }: DbCreateClassroomProps) => {
    const result = await prismaClient.classroom.create({
        data: { name: classroom_name, hagwon_id: hagwon_id },
    })
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

type DbDeleteClassroomStudentProps = {
    classroom_student_id: bigint
    user_id: bigint
}
export const dbDeleteClassroomStudent = async ({ classroom_student_id, user_id }: DbDeleteClassroomStudentProps) => {
    const result = await prismaClient.classroom_student.delete({
        where: { id: classroom_student_id, student: { hagwon: { principal: { user_id } } } },
    })
    return result
}

type DbDeleteClassroomProps = {
    user_id: bigint
    classroom_id: bigint
}
export const dbDeleteClassroom = async ({ user_id, classroom_id }: DbDeleteClassroomProps) => {
    const result = await prismaClient.classroom.delete({
        where: { id: classroom_id, hagwon: { principal: { user_id } } },
    })
    return result
}
