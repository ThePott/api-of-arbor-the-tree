# when does question_attempt is created?

- create question_attempt for all questions in syllabus when syllabus is assigned?
- or create question_attempt for all questions only when session is assigned? (then remove them when the assigned_session_classroom or assigned_session_student is removed? this seems not right...)
- or create question_attempt for only explicitly checked as CORRECT or WRONG questions?
    - if so, should I still need review_assignment_question for this?

# how would you design `review_assignment` model?

- follow schema from answer_3.md for other models (or modify some if needed)

## scenario 1

- student John in classroom A is assigned syllabus "math".
- no question is
- student "John" is in classroom A.
- he got wrong in syllabus Math, session1, question 1~5.
- he creates review assignment from these.
- what happens?
