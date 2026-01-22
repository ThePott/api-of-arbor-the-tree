import prismaClient from "@/src/db/prismaClient.js"
import { ApiError } from "@/src/errors/appError/AppError.js"

type DbProgressCreateBook = {
    book_id: bigint
    classroom_id?: bigint
    student_id_array: bigint[]
    user_id: bigint
}
export const dbProgressCreateBook = async ({
    book_id,
    classroom_id,
    student_id_array,
    user_id,
}: DbProgressCreateBook) => {
    const studentArrayPromise = await prismaClient.student.findMany({
        where: {
            id: { in: student_id_array },
            hagwon: { principal: { user_id } },
        },
    })
    const classroomPromise = classroom_id
        ? await prismaClient.classroom.findUnique({
              where: {
                  id: classroom_id,
                  hagwon: { principal: { user_id } },
              },
          })
        : Promise.resolve(null)
    const [studentArray, classroom] = await Promise.all([studentArrayPromise, classroomPromise])

    if (studentArray.length !== student_id_array.length) throw ApiError.Forbidden("학원 내의 학생만 관리할 수 있어요")
    if (classroom_id && !classroom) throw ApiError.Forbidden("학원 내의 반만 관리할 수 있어요")

    const result = await prismaClient.book_classroom_student.createMany({
        data: student_id_array.map((student_id) => ({
            book_id,
            student_id,
            classroom_id: classroom_id ? classroom_id : null,
        })),
    })

    return result
}
