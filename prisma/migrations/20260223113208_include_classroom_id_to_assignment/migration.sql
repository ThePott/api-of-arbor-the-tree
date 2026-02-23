-- AlterTable
ALTER TABLE "review_assignment" ADD COLUMN     "classroom_id" BIGINT;

-- AddForeignKey
ALTER TABLE "review_assignment" ADD CONSTRAINT "review_assignment_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
