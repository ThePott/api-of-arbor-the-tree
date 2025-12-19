/*
  Warnings:

  - You are about to drop the `Hagwon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Helper` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Parent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Principal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `School` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Helper" DROP CONSTRAINT "Helper_principal_id_fkey";

-- DropForeignKey
ALTER TABLE "Helper" DROP CONSTRAINT "Helper_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Parent" DROP CONSTRAINT "Parent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Principal" DROP CONSTRAINT "Principal_hagwon_id_fkey";

-- DropForeignKey
ALTER TABLE "Principal" DROP CONSTRAINT "Principal_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_hagwon_id_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_school_id_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_user_id_fkey";

-- DropForeignKey
ALTER TABLE "parent_student" DROP CONSTRAINT "parent_student_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "parent_student" DROP CONSTRAINT "parent_student_student_id_fkey";

-- DropTable
DROP TABLE "Hagwon";

-- DropTable
DROP TABLE "Helper";

-- DropTable
DROP TABLE "Parent";

-- DropTable
DROP TABLE "Principal";

-- DropTable
DROP TABLE "School";

-- DropTable
DROP TABLE "Student";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "app_user" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255),
    "phone_number" VARCHAR(16),
    "kakao_id" BIGINT NOT NULL,
    "email" BIGINT NOT NULL,
    "password" VARCHAR(255),

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principal" (
    "id" BIGINT NOT NULL,
    "hagwon_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "is_approved" BOOLEAN,

    CONSTRAINT "principal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hagwon" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "hagwon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "school_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "school_id" BIGINT NOT NULL,
    "hagwon_id" BIGINT,
    "grade" INTEGER,
    "is_approved" BOOLEAN,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "is_approved" BOOLEAN,

    CONSTRAINT "parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helper" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "principal_id" BIGINT NOT NULL,
    "is_approved" BOOLEAN,

    CONSTRAINT "helper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_kakao_id_key" ON "app_user"("kakao_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE INDEX "idx_student_user_id" ON "student"("user_id");

-- AddForeignKey
ALTER TABLE "principal" ADD CONSTRAINT "principal_hagwon_id_fkey" FOREIGN KEY ("hagwon_id") REFERENCES "hagwon"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "principal" ADD CONSTRAINT "principal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_hagwon_id_fkey" FOREIGN KEY ("hagwon_id") REFERENCES "hagwon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent" ADD CONSTRAINT "parent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "helper" ADD CONSTRAINT "helper_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "principal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "helper" ADD CONSTRAINT "helper_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
