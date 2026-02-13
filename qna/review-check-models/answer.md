# Answer: Models for Tracking Wrong Questions

## Current Limitation

- When a wrong question gets correct in review, the original `review_check` is patched to CORRECT
- This loses history and cannot track:
    - Was question 1 from session actually attempted in assignment 1?
    - What was the result (CORRECT/WRONG) in that specific assignment?

## Recommended Solution

### New Models

```prisma
model review_assignment {
    id          BigInt   @id @default(autoincrement())
    student_id  BigInt
    assigned_at DateTime @default(now())

    student                   student                      @relation(fields: [student_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    reviewAssignmentQuestions review_assignment_question[]
}

enum review_assignment_question_status {
    PENDING   // not yet attempted
    CORRECT   // solved correctly in this assignment
    WRONG     // solved wrong in this assignment
}

model review_assignment_question {
    id                     BigInt                            @id @default(autoincrement())
    review_assignment_id   BigInt
    question_id            BigInt
    source_review_check_id BigInt                            // links to original wrong answer
    status                 review_assignment_question_status @default(PENDING)
    attempted_at           DateTime?

    reviewAssignment  review_assignment @relation(fields: [review_assignment_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    question          question          @relation(fields: [question_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    sourceReviewCheck review_check      @relation(fields: [source_review_check_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

    @@unique([review_assignment_id, question_id])
}
```

### Update `review_check` model

```prisma
model review_check {
    id          BigInt              @id @default(autoincrement())
    session_id  BigInt
    student_id  BigInt
    question_id BigInt
    status      review_check_status

    session  session  @relation(fields: [session_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    student  student  @relation(fields: [student_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    question question @relation(fields: [question_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

    // questions derived from this wrong answer
    reviewAssignmentQuestions review_assignment_question[]
}
```

### Update `question` model

```prisma
model question {
    // ... existing fields ...
    reviewAssignmentQuestions review_assignment_question[]
}
```

## How This Works

### Flow

1. Student solves session -> `review_check` created with WRONG
2. Create `review_assignment` -> create `review_assignment_question` with:
    - `source_review_check_id` = the original wrong review_check
    - `status` = PENDING
3. Student attempts question in assignment:
    - Update `review_assignment_question.status` to CORRECT or WRONG
    - Update `review_assignment_question.attempted_at`
    - **Do NOT patch the original `review_check`** (preserve history)

### Key Benefit

Now you can answer:

- "Is question 1 in assignment 1 solved?" -> check `review_assignment_question.status != PENDING`
- "What was the result?" -> check `review_assignment_question.status`
- "How many times has student gotten this question wrong across all assignments?" -> count `review_assignment_question` with status WRONG

### Query Examples

```typescript
// Check if question was attempted in assignment
const result = await prismaClient.review_assignment_question.findUnique({
    where: {
        review_assignment_id_question_id: {
            review_assignment_id,
            question_id,
        },
    },
})
const isAttempted = result?.status !== "PENDING"
const isCorrect = result?.status === "CORRECT"

// Get full history of a question for a student
const history = await prismaClient.review_assignment_question.findMany({
    where: { question_id, reviewAssignment: { student_id } },
    include: { reviewAssignment: true },
    orderBy: { reviewAssignment: { assigned_at: "asc" } },
})

// Stats: how many times wrong across all assignments
const wrongCount = await prismaClient.review_assignment_question.count({
    where: {
        question_id,
        reviewAssignment: { student_id },
        status: "WRONG",
    },
})
```

## Why Status Field Instead of Separate Tables

Your session tracking uses `assigned_session_student` / `completed_session_student` pattern. However:

| Session Tracking         | Question Tracking                         |
| ------------------------ | ----------------------------------------- |
| Binary: completed or not | Ternary: not attempted, correct, or wrong |
| No result needed         | Result (CORRECT/WRONG) needed             |

For sessions, completion is binary - separate tables work well.

For questions, you need a result. With separate tables, a `completed_review_assignment_question` table would still need a `status` field, making it awkward (a table called "completed" containing WRONG results).

A single table with status field is simpler for ternary state tracking.

## Summary

| What                                 | Where                                          |
| ------------------------------------ | ---------------------------------------------- |
| Original session result              | `review_check` (never modified)                |
| Assignment contains which questions  | `review_assignment_question`                   |
| Was question attempted in assignment | `review_assignment_question.status != PENDING` |
| Result in specific assignment        | `review_assignment_question.status`            |
