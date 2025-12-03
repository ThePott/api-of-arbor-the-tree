-- AlterTable
CREATE SEQUENCE app_user_id_seq;
ALTER TABLE "app_user" ALTER COLUMN "id" SET DEFAULT nextval('app_user_id_seq'),
ALTER COLUMN "kakao_id" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "email" SET DATA TYPE TEXT;
ALTER SEQUENCE app_user_id_seq OWNED BY "app_user"."id";

-- AlterTable
CREATE SEQUENCE hagwon_id_seq;
ALTER TABLE "hagwon" ALTER COLUMN "id" SET DEFAULT nextval('hagwon_id_seq');
ALTER SEQUENCE hagwon_id_seq OWNED BY "hagwon"."id";

-- AlterTable
CREATE SEQUENCE helper_id_seq;
ALTER TABLE "helper" ALTER COLUMN "id" SET DEFAULT nextval('helper_id_seq');
ALTER SEQUENCE helper_id_seq OWNED BY "helper"."id";

-- AlterTable
CREATE SEQUENCE parent_id_seq;
ALTER TABLE "parent" ALTER COLUMN "id" SET DEFAULT nextval('parent_id_seq');
ALTER SEQUENCE parent_id_seq OWNED BY "parent"."id";

-- AlterTable
CREATE SEQUENCE parent_student_id_seq;
ALTER TABLE "parent_student" ALTER COLUMN "id" SET DEFAULT nextval('parent_student_id_seq');
ALTER SEQUENCE parent_student_id_seq OWNED BY "parent_student"."id";

-- AlterTable
CREATE SEQUENCE principal_id_seq;
ALTER TABLE "principal" ALTER COLUMN "id" SET DEFAULT nextval('principal_id_seq');
ALTER SEQUENCE principal_id_seq OWNED BY "principal"."id";

-- AlterTable
CREATE SEQUENCE school_id_seq;
ALTER TABLE "school" ALTER COLUMN "id" SET DEFAULT nextval('school_id_seq');
ALTER SEQUENCE school_id_seq OWNED BY "school"."id";

-- AlterTable
CREATE SEQUENCE student_id_seq;
ALTER TABLE "student" ALTER COLUMN "id" SET DEFAULT nextval('student_id_seq');
ALTER SEQUENCE student_id_seq OWNED BY "student"."id";
