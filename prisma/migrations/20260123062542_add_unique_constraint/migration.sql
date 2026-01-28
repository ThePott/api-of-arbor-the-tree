/*
  Warnings:

  - A unique constraint covering the columns `[session_id,classroom_id]` on the table `assigned_session_classroom` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_id,student_id]` on the table `assigned_session_student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[classroom_id,syllabus_id]` on the table `classroom_syllabus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[student_id,syllabus_id]` on the table `student_syllabus` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "assigned_session_classroom_session_id_classroom_id_key" ON "assigned_session_classroom"("session_id", "classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "assigned_session_student_session_id_student_id_key" ON "assigned_session_student"("session_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_syllabus_classroom_id_syllabus_id_key" ON "classroom_syllabus"("classroom_id", "syllabus_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_syllabus_student_id_syllabus_id_key" ON "student_syllabus"("student_id", "syllabus_id");
