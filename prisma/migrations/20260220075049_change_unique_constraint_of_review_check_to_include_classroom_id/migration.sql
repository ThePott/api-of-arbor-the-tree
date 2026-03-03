/*
  Warnings:

  - A unique constraint covering the columns `[session_id,classroom_id,student_id,question_id]` on the table `review_check` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "review_check_session_id_student_id_question_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "review_check_session_id_classroom_id_student_id_question_id_key" ON "review_check"("session_id", "classroom_id", "student_id", "question_id");
