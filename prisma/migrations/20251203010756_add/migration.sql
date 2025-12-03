/*
  Warnings:

  - The `role` column on the `app_user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "role" AS ENUM ('STUDENT', 'PARENT', 'PRINCIPAL', 'HELPER', 'MAINTAINER');

-- AlterTable
ALTER TABLE "app_user" DROP COLUMN "role",
ADD COLUMN     "role" "role";
