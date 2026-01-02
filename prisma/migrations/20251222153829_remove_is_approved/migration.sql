/*
  Warnings:

  - You are about to drop the column `is_approved` on the `helper` table. All the data in the column will be lost.
  - You are about to drop the column `is_approved` on the `parent` table. All the data in the column will be lost.
  - You are about to drop the column `is_approved` on the `principal` table. All the data in the column will be lost.
  - You are about to drop the column `is_approved` on the `student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "helper" DROP COLUMN "is_approved";

-- AlterTable
ALTER TABLE "parent" DROP COLUMN "is_approved";

-- AlterTable
ALTER TABLE "principal" DROP COLUMN "is_approved";

-- AlterTable
ALTER TABLE "student" DROP COLUMN "is_approved";
