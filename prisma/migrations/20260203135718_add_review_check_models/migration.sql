-- CreateEnum
CREATE TYPE "review_check_status" AS ENUM ('CORRECT', 'WRONG');

-- CreateTable
CREATE TABLE "review_check" (
    "id" BIGSERIAL NOT NULL,
    "assigned_session_student_id" BIGINT NOT NULL,
    "question_id" BIGINT NOT NULL,
    "status" "review_check_status" NOT NULL,

    CONSTRAINT "review_check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_assignment" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "review_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_assignment_question" (
    "id" BIGSERIAL NOT NULL,
    "review_assignment_id" BIGINT NOT NULL,
    "review_check_id" BIGINT NOT NULL,
    "status" "review_check_status",
    "completed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_assignment_question_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "review_check" ADD CONSTRAINT "review_check_assigned_session_student_id_fkey" FOREIGN KEY ("assigned_session_student_id") REFERENCES "assigned_session_student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review_check" ADD CONSTRAINT "review_check_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review_assignment" ADD CONSTRAINT "review_assignment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review_assignment_question" ADD CONSTRAINT "review_assignment_question_review_assignment_id_fkey" FOREIGN KEY ("review_assignment_id") REFERENCES "review_assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review_assignment_question" ADD CONSTRAINT "review_assignment_question_review_check_id_fkey" FOREIGN KEY ("review_check_id") REFERENCES "review_check"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
