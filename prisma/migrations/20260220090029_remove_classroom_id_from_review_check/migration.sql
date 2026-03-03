/*
  Warnings:

  - You are about to drop the column `classroom_id` on the `review_check` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[session_id,student_id,question_id]` on the table `review_check` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "review_check" DROP CONSTRAINT "review_check_classroom_id_fkey";

-- DropIndex
DROP INDEX "review_check_session_id_classroom_id_student_id_question_id_key";

-- AlterTable
ALTER TABLE "review_check" DROP COLUMN "classroom_id";

-- CreateIndex
CREATE UNIQUE INDEX "review_check_session_id_student_id_question_id_key" ON "review_check"("session_id", "student_id", "question_id");
