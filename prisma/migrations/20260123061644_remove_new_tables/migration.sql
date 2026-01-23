/*
  Warnings:

  - You are about to drop the `book_classroom` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `book_student` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `session_student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "book_classroom" DROP CONSTRAINT "book_classroom_book_id_fkey";

-- DropForeignKey
ALTER TABLE "book_classroom" DROP CONSTRAINT "book_classroom_classroom_id_fkey";

-- DropForeignKey
ALTER TABLE "book_student" DROP CONSTRAINT "book_student_book_id_fkey";

-- DropForeignKey
ALTER TABLE "book_student" DROP CONSTRAINT "book_student_student_id_fkey";

-- DropForeignKey
ALTER TABLE "session_student" DROP CONSTRAINT "session_student_session_id_fkey";

-- DropForeignKey
ALTER TABLE "session_student" DROP CONSTRAINT "session_student_student_id_fkey";

-- AlterTable
ALTER TABLE "syllabus" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "book_classroom";

-- DropTable
DROP TABLE "book_student";

-- DropTable
DROP TABLE "session_student";

-- DropEnum
DROP TYPE "session_status";
