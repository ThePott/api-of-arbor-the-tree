/*
  Warnings:

  - Added the required column `repeat_count` to the `question_attempt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "question_attempt" ADD COLUMN     "repeat_count" INTEGER NOT NULL;
