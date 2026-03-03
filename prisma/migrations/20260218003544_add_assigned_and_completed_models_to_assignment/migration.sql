-- CreateTable
CREATE TABLE "assigned_review_assignment" (
    "id" BIGSERIAL NOT NULL,
    "review_assignment_id" BIGINT NOT NULL,
    "status" "session_status" NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assigned_review_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completed_review_assignment" (
    "id" BIGSERIAL NOT NULL,
    "review_assignment_id" BIGINT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completed_review_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assigned_review_assignment_review_assignment_id_key" ON "assigned_review_assignment"("review_assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "completed_review_assignment_review_assignment_id_key" ON "completed_review_assignment"("review_assignment_id");

-- AddForeignKey
ALTER TABLE "assigned_review_assignment" ADD CONSTRAINT "assigned_review_assignment_review_assignment_id_fkey" FOREIGN KEY ("review_assignment_id") REFERENCES "review_assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "completed_review_assignment" ADD CONSTRAINT "completed_review_assignment_review_assignment_id_fkey" FOREIGN KEY ("review_assignment_id") REFERENCES "review_assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
