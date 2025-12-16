/*
  Warnings:

  - You are about to drop the column `school_id` on the `student` table. All the data in the column will be lost.
  - Added the required column `school` to the `student` table without a default value. This is not possible if the table is not empty.
  - Made the column `hagwon_id` on table `student` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_hagwon_id_fkey";

-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_school_id_fkey";

-- AlterTable
ALTER TABLE "student" DROP COLUMN "school_id",
ADD COLUMN     "school" VARCHAR(20) NOT NULL,
ALTER COLUMN "hagwon_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_hagwon_id_fkey" FOREIGN KEY ("hagwon_id") REFERENCES "hagwon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
