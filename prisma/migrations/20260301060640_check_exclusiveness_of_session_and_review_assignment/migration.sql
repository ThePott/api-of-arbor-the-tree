-- Add CHECK constraint to ensure exactly one of session_id or review_assignment_id is set
ALTER TABLE "question_attempt"
ADD CONSTRAINT "question_attempt_exactly_one_source"
CHECK (
    (session_id IS NOT NULL AND review_assignment_id IS NULL) OR
    (session_id IS NULL AND review_assignment_id IS NOT NULL)
);
