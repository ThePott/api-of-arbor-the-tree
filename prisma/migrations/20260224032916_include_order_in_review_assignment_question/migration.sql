/*
  Warnings:

  - Added the required column `order` to the `review_assignment_question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "review_assignment_question" ADD COLUMN     "order" INTEGER NOT NULL;
