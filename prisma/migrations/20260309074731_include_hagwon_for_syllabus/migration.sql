/*
  Warnings:

  - Added the required column `hagwon_id` to the `syllabus` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "syllabus" DROP CONSTRAINT "syllabus_user_id_fkey";

-- AlterTable
ALTER TABLE "syllabus" ADD COLUMN     "hagwon_id" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "syllabus" ADD CONSTRAINT "syllabus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "syllabus" ADD CONSTRAINT "syllabus_hagwon_id_fkey" FOREIGN KEY ("hagwon_id") REFERENCES "hagwon"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
