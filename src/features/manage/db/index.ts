import prismaClient from "@/src/db/prismaClient.js"

type DbFindManyStudentProps = { user_id: bigint }
export const dbFindManyStudent = async ({ user_id }: DbFindManyStudentProps) => {
    const result = await prismaClient.student.findMany({
        where: { hagwon: { principal: { user_id } } },
        include: { users: true, school: true },
    })
    return result
}
