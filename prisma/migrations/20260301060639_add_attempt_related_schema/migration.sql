-- CreateEnum
CREATE TYPE "attempt_status" AS ENUM ('CORRECT', 'WRONG');

-- CreateTable
CREATE TABLE "question_attempt" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "question_id" BIGINT NOT NULL,
    "classroom_id" BIGINT,
    "session_id" BIGINT,
    "review_assignment_id" BIGINT,
    "status" "attempt_status",
    "parent_attempt_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_assignment" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "classroom_id" BIGINT,
    "book_ids" BIGINT[],
    "status" "session_status",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "review_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_attempt_parent_attempt_id_key" ON "question_attempt"("parent_attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_attempt_student_id_question_id_session_id_review_a_key" ON "question_attempt"("student_id", "question_id", "session_id", "review_assignment_id");

-- AddForeignKey
ALTER TABLE "question_attempt" ADD CONSTRAINT "question_attempt_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "question_attempt" ADD CONSTRAINT "question_attempt_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "question_attempt" ADD CONSTRAINT "question_attempt_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "question_attempt" ADD CONSTRAINT "question_attempt_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "question_attempt" ADD CONSTRAINT "question_attempt_review_assignment_id_fkey" FOREIGN KEY ("review_assignment_id") REFERENCES "review_assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "question_attempt" ADD CONSTRAINT "question_attempt_parent_attempt_id_fkey" FOREIGN KEY ("parent_attempt_id") REFERENCES "question_attempt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review_assignment" ADD CONSTRAINT "review_assignment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review_assignment" ADD CONSTRAINT "review_assignment_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
