-- CreateTable
CREATE TABLE "syllabus" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "book_id" BIGINT NOT NULL,

    CONSTRAINT "syllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" BIGSERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "syllabus_id" BIGINT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_question" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "question_id" BIGINT NOT NULL,

    CONSTRAINT "session_question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_question_session_id_question_id_key" ON "session_question"("session_id", "question_id");

-- AddForeignKey
ALTER TABLE "syllabus" ADD CONSTRAINT "syllabus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "syllabus" ADD CONSTRAINT "syllabus_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_syllabus_id_fkey" FOREIGN KEY ("syllabus_id") REFERENCES "syllabus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session_question" ADD CONSTRAINT "session_question_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session_question" ADD CONSTRAINT "session_question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
