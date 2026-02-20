-- AlterTable
ALTER TABLE "completed_session_student" ADD COLUMN     "classroom_id" BIGINT;

-- AddForeignKey
ALTER TABLE "completed_session_student" ADD CONSTRAINT "completed_session_student_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
