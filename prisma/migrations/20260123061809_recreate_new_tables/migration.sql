-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('HOMEWORK', 'TODAY');

-- CreateTable
CREATE TABLE "classroom_syllabus" (
    "id" BIGSERIAL NOT NULL,
    "classroom_id" BIGINT NOT NULL,
    "syllabus_id" BIGINT NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "classroom_syllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_syllabus" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "syllabus_id" BIGINT NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "student_syllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assigned_session_classroom" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "classroom_id" BIGINT NOT NULL,
    "status" "session_status" NOT NULL,

    CONSTRAINT "assigned_session_classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assigned_session_student" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "status" "session_status" NOT NULL,

    CONSTRAINT "assigned_session_student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completed_session_student" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completed_session_student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "completed_session_student_session_id_student_id_key" ON "completed_session_student"("session_id", "student_id");

-- AddForeignKey
ALTER TABLE "classroom_syllabus" ADD CONSTRAINT "classroom_syllabus_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classroom_syllabus" ADD CONSTRAINT "classroom_syllabus_syllabus_id_fkey" FOREIGN KEY ("syllabus_id") REFERENCES "syllabus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_syllabus" ADD CONSTRAINT "student_syllabus_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_syllabus" ADD CONSTRAINT "student_syllabus_syllabus_id_fkey" FOREIGN KEY ("syllabus_id") REFERENCES "syllabus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "assigned_session_classroom" ADD CONSTRAINT "assigned_session_classroom_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "assigned_session_classroom" ADD CONSTRAINT "assigned_session_classroom_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "assigned_session_student" ADD CONSTRAINT "assigned_session_student_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "assigned_session_student" ADD CONSTRAINT "assigned_session_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "completed_session_student" ADD CONSTRAINT "completed_session_student_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "completed_session_student" ADD CONSTRAINT "completed_session_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
