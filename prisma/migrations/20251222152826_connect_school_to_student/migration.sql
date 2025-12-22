/*
  Warnings:

  - You are about to drop the column `school` on the `student` table. All the data in the column will be lost.
  - Added the required column `school_id` to the `student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "student" DROP COLUMN "school",
ADD COLUMN     "school_id" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
