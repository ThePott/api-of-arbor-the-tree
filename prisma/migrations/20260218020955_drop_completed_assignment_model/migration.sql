/*
  Warnings:

  - You are about to drop the `completed_review_assignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "completed_review_assignment" DROP CONSTRAINT "completed_review_assignment_review_assignment_id_fkey";

-- DropTable
DROP TABLE "completed_review_assignment";
