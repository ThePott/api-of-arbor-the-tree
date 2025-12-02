-- CreateTable
CREATE TABLE "users" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(16) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Principal" (
    "id" BIGINT NOT NULL,
    "hagwon_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "is_approved" BOOLEAN,

    CONSTRAINT "Principal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hagwon" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "Hagwon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "school_id" BIGINT NOT NULL,
    "hagwon_id" BIGINT,
    "grade" INTEGER,
    "is_approved" BOOLEAN,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "is_approved" BOOLEAN,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student" (
    "id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "parent_id" BIGINT NOT NULL,

    CONSTRAINT "parent_student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Helper" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "principal_id" BIGINT NOT NULL,
    "is_approved" BOOLEAN,

    CONSTRAINT "Helper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_student_user_id" ON "Student"("user_id");

-- AddForeignKey
ALTER TABLE "Principal" ADD CONSTRAINT "Principal_hagwon_id_fkey" FOREIGN KEY ("hagwon_id") REFERENCES "Hagwon"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Principal" ADD CONSTRAINT "Principal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_hagwon_id_fkey" FOREIGN KEY ("hagwon_id") REFERENCES "Hagwon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Helper" ADD CONSTRAINT "Helper_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "Principal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Helper" ADD CONSTRAINT "Helper_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
