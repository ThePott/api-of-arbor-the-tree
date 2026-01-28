/*
  Warnings:

  - You are about to drop the `book_classroom_student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "book_classroom_student" DROP CONSTRAINT "book_classroom_student_book_id_fkey";

-- DropForeignKey
ALTER TABLE "book_classroom_student" DROP CONSTRAINT "book_classroom_student_classroom_id_fkey";

-- DropForeignKey
ALTER TABLE "book_classroom_student" DROP CONSTRAINT "book_classroom_student_student_id_fkey";

-- DropTable
DROP TABLE "book_classroom_student";
