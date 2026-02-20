/*
  Warnings:

  - You are about to drop the column `classroom_id` on the `completed_session_student` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "completed_session_student" DROP CONSTRAINT "completed_session_student_classroom_id_fkey";

-- AlterTable
ALTER TABLE "completed_session_student" DROP COLUMN "classroom_id";
