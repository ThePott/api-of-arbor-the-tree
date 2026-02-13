# what models would be good to track wrong questions in session?

## background

- students solve questions in book
- record right and wrong
- create review assignment from wrong questions
- right and wrong questions among review assignment must be tracked and be used in future review assignment

## what I hope

- I want to get stat of question. like, this student got this question wrong this many times or something.

## question: what prisma models would be good for this?

### requirement

- track correct or wrong of raw questions of sessions
- create assignment from wrong questions.
- once it is used in creating assignment, it is not used to create another one
- track correct or wrong of questions in assignment
- create new assignment from wrong questions of assignment (can include wrong raw questions if there are any)
- query certain question got wrong how many times by certain student

### current limit

- currently if wrong question got right at review assignment, the original wrong review_check get patch to correct
- however, with current approach, following cannot be tracked
- question 1 from session got wrong
- assignment 1 is created from it
- is question 1 in assignment 1 solved? meaning is correct, wrong of this is recorded or not?
