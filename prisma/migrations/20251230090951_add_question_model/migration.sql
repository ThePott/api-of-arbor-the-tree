-- CreateTable
CREATE TABLE "question" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "page" INTEGER NOT NULL,
    "solution_page" INTEGER NOT NULL,
    "step_id" BIGINT NOT NULL,
    "sub_question_id" BIGINT,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "step"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_sub_question_id_fkey" FOREIGN KEY ("sub_question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
