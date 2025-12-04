/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `parent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hagwon_id]` on the table `principal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `principal` will be added. If there are existing duplicate values, this will fail.
  - Made the column `user_id` on table `principal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "principal" ALTER COLUMN "user_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "parent_user_id_key" ON "parent"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "principal_hagwon_id_key" ON "principal"("hagwon_id");

-- CreateIndex
CREATE UNIQUE INDEX "principal_user_id_key" ON "principal"("user_id");
