/*
  Warnings:

  - A unique constraint covering the columns `[student_id,question_id,session_id]` on the table `question_attempt` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[student_id,question_id,review_assignment_id]` on the table `question_attempt` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "question_attempt_student_id_question_id_session_id_review_a_key";

-- CreateIndex
CREATE UNIQUE INDEX "question_attempt_student_id_question_id_session_id_key" ON "question_attempt"("student_id", "question_id", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_attempt_student_id_question_id_review_assignment_i_key" ON "question_attempt"("student_id", "question_id", "review_assignment_id");
