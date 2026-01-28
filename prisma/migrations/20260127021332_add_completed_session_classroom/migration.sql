-- CreateTable
CREATE TABLE "completed_session_classroom" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "classroom_id" BIGINT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completed_session_classroom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "completed_session_classroom_session_id_classroom_id_key" ON "completed_session_classroom"("session_id", "classroom_id");

-- AddForeignKey
ALTER TABLE "completed_session_classroom" ADD CONSTRAINT "completed_session_classroom_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "completed_session_classroom" ADD CONSTRAINT "completed_session_classroom_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
