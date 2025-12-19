/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `hagwon` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "hagwon_name_key" ON "hagwon"("name");
