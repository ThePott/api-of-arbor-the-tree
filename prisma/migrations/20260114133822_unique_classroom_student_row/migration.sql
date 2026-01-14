/*
  Warnings:

  - A unique constraint covering the columns `[classroom_id,student_id]` on the table `classroom_student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "classroom_student_classroom_id_student_id_key" ON "classroom_student"("classroom_id", "student_id");
