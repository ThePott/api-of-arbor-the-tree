/*
  Warnings:

  - Added the required column `hagwon_id` to the `book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "book" ADD COLUMN     "hagwon_id" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "book" ADD CONSTRAINT "book_hagwon_id_fkey" FOREIGN KEY ("hagwon_id") REFERENCES "hagwon"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
