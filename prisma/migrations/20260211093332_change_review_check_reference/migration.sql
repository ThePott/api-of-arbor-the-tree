/*
  Warnings:

  - You are about to drop the column `assigned_session_student_id` on the `review_check` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[session_id,student_id,question_id]` on the table `review_check` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `session_id` to the `review_check` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `review_check` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "review_check" DROP CONSTRAINT "review_check_assigned_session_student_id_fkey";

-- DropIndex
DROP INDEX "review_check_assigned_session_student_id_question_id_key";

-- AlterTable
ALTER TABLE "review_check" DROP COLUMN "assigned_session_student_id",
ADD COLUMN     "session_id" BIGINT NOT NULL,
ADD COLUMN     "student_id" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "review_check_session_id_student_id_question_id_key" ON "review_check"("session_id", "student_id", "question_id");

-- AddForeignKey
ALTER TABLE "review_check" ADD CONSTRAINT "review_check_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review_check" ADD CONSTRAINT "review_check_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
