/*
  Warnings:

  - You are about to drop the column `principal_id` on the `helper` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone_number]` on the table `app_user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hagwon_id` to the `helper` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "helper" DROP CONSTRAINT "helper_principal_id_fkey";

-- AlterTable
ALTER TABLE "helper" DROP COLUMN "principal_id",
ADD COLUMN     "hagwon_id" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "app_user_phone_number_key" ON "app_user"("phone_number");

-- AddForeignKey
ALTER TABLE "helper" ADD CONSTRAINT "helper_hagwon_id_fkey" FOREIGN KEY ("hagwon_id") REFERENCES "hagwon"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
