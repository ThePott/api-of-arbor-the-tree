-- CreateTable
CREATE TABLE "step" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "topic_id" BIGINT NOT NULL,

    CONSTRAINT "step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "step_title_key" ON "step"("title");

-- AddForeignKey
ALTER TABLE "step" ADD CONSTRAINT "step_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
