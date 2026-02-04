/*
  Warnings:

  - A unique constraint covering the columns `[assigned_session_student_id,question_id]` on the table `review_check` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "review_check_assigned_session_student_id_question_id_key" ON "review_check"("assigned_session_student_id", "question_id");
