/*
  Warnings:

  - You are about to drop the column `assigned_at` on the `review_assignment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "review_assignment" DROP COLUMN "assigned_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
