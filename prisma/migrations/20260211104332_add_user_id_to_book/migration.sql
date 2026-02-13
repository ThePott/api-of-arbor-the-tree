-- AlterTable
ALTER TABLE "book" ADD COLUMN     "user_id" BIGINT NOT NULL DEFAULT 4;

-- AddForeignKey
ALTER TABLE "book" ADD CONSTRAINT "book_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
