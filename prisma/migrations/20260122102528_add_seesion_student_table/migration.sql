-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('DONE', 'HOMEWORK', 'TODAY');

-- CreateTable
CREATE TABLE "session_student" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "status" "session_status" NOT NULL,

    CONSTRAINT "session_student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_student_session_id_student_id_key" ON "session_student"("session_id", "student_id");

-- AddForeignKey
ALTER TABLE "session_student" ADD CONSTRAINT "session_student_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session_student" ADD CONSTRAINT "session_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
