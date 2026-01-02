-- CreateTable
CREATE TABLE "resume" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role" "role" NOT NULL,
    "school_name" VARCHAR(255),
    "hagwon_name" VARCHAR(20) NOT NULL,

    CONSTRAINT "resume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resume_user_id_key" ON "resume"("user_id");
