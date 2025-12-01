-- SQL commands to rename 'class' table to 'classroom'
-- Run this after creating the initial schema

-- Step 1: Drop foreign key constraints that reference the class table
ALTER TABLE class_student DROP CONSTRAINT IF EXISTS class_student_class_id_fkey;
ALTER TABLE class_student DROP FOREIGN KEY IF EXISTS class_student_class_id_fkey; -- MySQL syntax

-- Step 2: Rename the table
ALTER TABLE class RENAME TO classroom;

-- Step 3: Recreate foreign key constraints with new table name
ALTER TABLE class_student 
ADD CONSTRAINT class_student_classroom_id_fkey 
FOREIGN KEY (class_id) REFERENCES classroom(id);

-- Step 4: Optionally rename the class_id column to classroom_id for consistency
-- Note: This will require updating the foreign key constraint again

-- Drop the foreign key first
ALTER TABLE class_student DROP CONSTRAINT class_student_classroom_id_fkey;

-- Rename the column
ALTER TABLE class_student RENAME COLUMN class_id TO classroom_id;

-- Recreate foreign key with new column name
ALTER TABLE class_student 
ADD CONSTRAINT class_student_classroom_id_fkey 
FOREIGN KEY (classroom_id) REFERENCES classroom(id);

-- Step 5: Update any indexes if they exist
DROP INDEX IF EXISTS idx_class_student_class_id;
CREATE INDEX idx_class_student_classroom_id ON class_student(classroom_id);

-- Step 6: Rename the join table for better naming consistency
ALTER TABLE class_student RENAME TO classroom_student;

-- Step 7: Recreate foreign key constraints for the renamed join table
ALTER TABLE classroom_student DROP CONSTRAINT class_student_classroom_id_fkey;
ALTER TABLE classroom_student DROP CONSTRAINT class_student_student_id_fkey;

ALTER TABLE classroom_student 
ADD CONSTRAINT classroom_student_classroom_id_fkey 
FOREIGN KEY (classroom_id) REFERENCES classroom(id);

ALTER TABLE classroom_student 
ADD CONSTRAINT classroom_student_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES student(id);

-- Step 8: Update index name for consistency
DROP INDEX IF EXISTS idx_class_student_classroom_id;
CREATE INDEX idx_classroom_student_classroom_id ON classroom_student(classroom_id);