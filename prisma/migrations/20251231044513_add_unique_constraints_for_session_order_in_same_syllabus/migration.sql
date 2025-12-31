/*
  Warnings:

  - A unique constraint covering the columns `[order,syllabus_id]` on the table `session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "session_order_syllabus_id_key" ON "session"("order", "syllabus_id");
