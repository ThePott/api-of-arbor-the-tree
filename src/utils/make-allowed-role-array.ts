import type { role } from "@/generated/prisma/enums.js"
import { ApiError } from "../errors/appError/AppError.js"

type ValidatePermissionProps = {
    minimumRole: role
    currentRole: role | null
}
export const validatePermission = ({ minimumRole, currentRole }: ValidatePermissionProps): void => {
    if (!currentRole) throw ApiError.Unauthorized("권한이 없어요")

    const baseRoleArray: role[] = ["MAINTAINER", "PRINCIPAL", "HELPER", "STUDENT", "PARENT"]
    const index = baseRoleArray.findIndex((role) => role === minimumRole)
    if (index === -1) throw ApiError.Internal("권한을 찾는 데에 실패했어요")

    const allowedRoleArray = baseRoleArray.slice(0, index + 1)
    const isAllowed = allowedRoleArray.includes(currentRole)
    if (!isAllowed) throw ApiError.Forbidden("권한이 없어요")
}
