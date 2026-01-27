import { ApiError } from "@/src/errors/appError/AppError.js"

export const ClassroomStudentExclusivenessError = ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")
type CheckClassroomStudentExclusivenessProps = {
    classroom_id: bigint | null
    student_id: bigint | null
}
export const checkClassroomStudentExclusiveness = ({
    classroom_id,
    student_id,
}: CheckClassroomStudentExclusivenessProps) => {
    if (Boolean(classroom_id) === Boolean(student_id)) throw ClassroomStudentExclusivenessError
}
