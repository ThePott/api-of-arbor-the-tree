/*
  Warnings:

  - You are about to drop the `assigned_review_assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `review_assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `review_assignment_question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `review_check` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "assigned_review_assignment" DROP CONSTRAINT "assigned_review_assignment_review_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "review_assignment" DROP CONSTRAINT "review_assignment_classroom_id_fkey";

-- DropForeignKey
ALTER TABLE "review_assignment" DROP CONSTRAINT "review_assignment_student_id_fkey";

-- DropForeignKey
ALTER TABLE "review_assignment_question" DROP CONSTRAINT "review_assignment_question_review_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "review_assignment_question" DROP CONSTRAINT "review_assignment_question_review_check_id_fkey";

-- DropForeignKey
ALTER TABLE "review_check" DROP CONSTRAINT "review_check_question_id_fkey";

-- DropForeignKey
ALTER TABLE "review_check" DROP CONSTRAINT "review_check_session_id_fkey";

-- DropForeignKey
ALTER TABLE "review_check" DROP CONSTRAINT "review_check_student_id_fkey";

-- DropTable
DROP TABLE "assigned_review_assignment";

-- DropTable
DROP TABLE "review_assignment";

-- DropTable
DROP TABLE "review_assignment_question";

-- DropTable
DROP TABLE "review_check";

-- DropEnum
DROP TYPE "review_check_status";
