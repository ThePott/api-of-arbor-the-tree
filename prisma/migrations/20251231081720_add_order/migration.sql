/*
  Warnings:

  - A unique constraint covering the columns `[name,step_id]` on the table `question` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order,step_id]` on the table `question` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,topic_id]` on the table `step` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order,topic_id]` on the table `step` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,book_id]` on the table `topic` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order,book_id]` on the table `topic` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order` to the `question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `step` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `topic` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "step_title_key";

-- DropIndex
DROP INDEX "topic_title_key";

-- AlterTable
ALTER TABLE "question" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "step" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "topic" ADD COLUMN     "order" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "question_name_step_id_key" ON "question"("name", "step_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_order_step_id_key" ON "question"("order", "step_id");

-- CreateIndex
CREATE UNIQUE INDEX "step_title_topic_id_key" ON "step"("title", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "step_order_topic_id_key" ON "step"("order", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "topic_title_book_id_key" ON "topic"("title", "book_id");

-- CreateIndex
CREATE UNIQUE INDEX "topic_order_book_id_key" ON "topic"("order", "book_id");
