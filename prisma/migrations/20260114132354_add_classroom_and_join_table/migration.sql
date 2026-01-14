-- CreateTable
CREATE TABLE "classroom" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "hagwon_id" BIGINT NOT NULL,

    CONSTRAINT "classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_student" (
    "id" BIGSERIAL NOT NULL,
    "classroom_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,

    CONSTRAINT "classroom_student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classroom_name_hagwon_id_key" ON "classroom"("name", "hagwon_id");

-- AddForeignKey
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_hagwon_id_fkey" FOREIGN KEY ("hagwon_id") REFERENCES "hagwon"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classroom_student" ADD CONSTRAINT "classroom_student_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classroom_student" ADD CONSTRAINT "classroom_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
