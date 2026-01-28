/*
  Warnings:

  - You are about to drop the `book_student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "book_student" DROP CONSTRAINT "book_student_book_id_fkey";

-- DropForeignKey
ALTER TABLE "book_student" DROP CONSTRAINT "book_student_student_id_fkey";

-- DropTable
DROP TABLE "book_student";

-- CreateTable
CREATE TABLE "book_classroom_student" (
    "id" BIGSERIAL NOT NULL,
    "book_id" BIGINT NOT NULL,
    "classroom_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,

    CONSTRAINT "book_classroom_student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_classroom_student_book_id_student_id_key" ON "book_classroom_student"("book_id", "student_id");

-- AddForeignKey
ALTER TABLE "book_classroom_student" ADD CONSTRAINT "book_classroom_student_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_classroom_student" ADD CONSTRAINT "book_classroom_student_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_classroom_student" ADD CONSTRAINT "book_classroom_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
