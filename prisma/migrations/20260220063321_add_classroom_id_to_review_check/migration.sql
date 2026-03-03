-- AlterTable
ALTER TABLE "review_check" ADD COLUMN     "classroom_id" BIGINT;

-- AddForeignKey
ALTER TABLE "review_check" ADD CONSTRAINT "review_check_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
