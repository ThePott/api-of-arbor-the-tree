-- CreateTable
CREATE TABLE "book_classroom" (
    "id" BIGSERIAL NOT NULL,
    "book_id" BIGINT NOT NULL,
    "classroom_id" BIGINT NOT NULL,

    CONSTRAINT "book_classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_student" (
    "id" BIGSERIAL NOT NULL,
    "book_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,

    CONSTRAINT "book_student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_classroom_book_id_classroom_id_key" ON "book_classroom"("book_id", "classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_student_book_id_student_id_key" ON "book_student"("book_id", "student_id");

-- AddForeignKey
ALTER TABLE "book_classroom" ADD CONSTRAINT "book_classroom_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_classroom" ADD CONSTRAINT "book_classroom_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_student" ADD CONSTRAINT "book_student_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_student" ADD CONSTRAINT "book_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
