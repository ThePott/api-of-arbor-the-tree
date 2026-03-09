import type { role } from "@/generated/prisma/enums.js"

export const makeAllowedRoleArray = (minimumRole: role): role[] => {
    const baseRoleArray: role[] = ["MAINTAINER", "PRINCIPAL", "HELPER", "STUDENT", "PARENT"]
    const index = baseRoleArray.findIndex((role) => role === minimumRole)
    return baseRoleArray.slice(0, index + 1)
}
