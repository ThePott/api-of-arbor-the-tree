# Answer 4: When to Create `question_attempt` and `review_assignment` Design

## 요약

- 최초(`syllabus`, `session`)에서는 체크된 것만 attempt로 기록
- `review_assignment`를 만들 땐 빈 `question_attempt`를 생성

## Question 1: When is `question_attempt` Created?

### Option A: Create for All Questions When Syllabus is Assigned

```
Syllabus assigned → Create question_attempt for ALL questions (status: null)
```

**Pros:**

- Can track "not attempted yet" vs "attempted"
- Complete picture of student's journey

**Cons:**

- Many rows created upfront (potentially thousands)
- Most may never be checked
- Wasteful if student doesn't complete syllabus

### Option B: Create for All Questions When Session is Assigned

```
Session assigned → Create question_attempt for questions in that session (status: null)
```

**Pros:**

- Fewer rows than Option A
- Scoped to what student is expected to do

**Cons:**

- Still creates rows that may never be checked
- Awkward deletion when session is unassigned

### Option C: Create Only When Explicitly Checked (Recommended)

```
Teacher checks CORRECT/WRONG → Create question_attempt with that status
```

**Pros:**

- Only creates rows for actual data
- No wasteful pre-creation
- No awkward deletion logic
- Simple: "row exists = was checked"

**Cons:**

- Can't distinguish "not checked yet" from "never assigned" (but do you need to?)

---

### My Recommendation: Option C

Create `question_attempt` **only when a question is explicitly checked** as CORRECT or WRONG.

**Why?**

1. **Sparse data is fine** - You don't need to track "not yet checked" questions. The absence of a row means "not checked."

2. **Session assignment already tracks what's assigned** - Use `assigned_session_student` / `assigned_session_classroom` to know what's assigned. Use `question_attempt` only for results.

3. **No deletion complexity** - If session is unassigned, you don't need to delete `question_attempt` rows. The check result is historical fact.

4. **Matches your current `review_check` behavior** - Your current schema only creates `review_check` when checked, not upfront.

---

## Question 2: Do You Still Need `review_assignment_question`?

**No.** With the unified `question_attempt` model, you don't need a separate `review_assignment_question`.

| Old Schema                                       | New Schema                                    |
| ------------------------------------------------ | --------------------------------------------- |
| `review_check` (session checks)                  | `question_attempt` (session_id set)           |
| `review_assignment_question` (assignment checks) | `question_attempt` (review_assignment_id set) |

Both are just `question_attempt` with different source fields populated.

---

## Question 3: `review_assignment` Model Design

Based on answer_3.md, here's the complete design:

```prisma
model review_assignment {
    id           BigInt    @id @default(autoincrement())
    student_id   BigInt
    classroom_id BigInt?
    book_ids     BigInt[]  // Denormalized for quick title lookup
    created_at   DateTime  @default(now())
    assigned_at  DateTime?
    completed_at DateTime?
    status       session_status?  // HOMEWORK | TODAY (reuse existing enum)

    student           student            @relation(fields: [student_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    classroom         classroom?         @relation(fields: [classroom_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    question_attempts question_attempt[]
}
```

**Notes:**

- `assigned_at` - When the assignment was given to student (null = created but not assigned yet)
- `completed_at` - When all questions in assignment have been checked
- `status` - Reuse `session_status` enum for consistency (HOMEWORK/TODAY)
- `book_ids` - Array of book IDs for quick title lookup without deep joins

---

## Scenario 1 Walkthrough

> Student "John" in classroom A got wrong in syllabus Math, session 1, questions 1-5. He creates review assignment from these.

### Step 1: Session Questions Are Checked

When teacher checks questions 1-5 as WRONG:

```typescript
// Create question_attempt for each checked question
await prismaClient.question_attempt.createMany({
    data: [
        {
            student_id: john.id,
            question_id: q1.id,
            session_id: session1.id,
            classroom_id: classroomA.id,
            status: "WRONG",
        },
        {
            student_id: john.id,
            question_id: q2.id,
            session_id: session1.id,
            classroom_id: classroomA.id,
            status: "WRONG",
        },
        {
            student_id: john.id,
            question_id: q3.id,
            session_id: session1.id,
            classroom_id: classroomA.id,
            status: "WRONG",
        },
        {
            student_id: john.id,
            question_id: q4.id,
            session_id: session1.id,
            classroom_id: classroomA.id,
            status: "WRONG",
        },
        {
            student_id: john.id,
            question_id: q5.id,
            session_id: session1.id,
            classroom_id: classroomA.id,
            status: "WRONG",
        },
    ],
})
```

**Database state:**

```
question_attempt:
| id | student | question | session | review_assignment | classroom | status | parent_attempt |
|----|---------|----------|---------|-------------------|-----------|--------|----------------|
| 1  | John    | Q1       | S1      | null              | A         | WRONG  | null           |
| 2  | John    | Q2       | S1      | null              | A         | WRONG  | null           |
| 3  | John    | Q3       | S1      | null              | A         | WRONG  | null           |
| 4  | John    | Q4       | S1      | null              | A         | WRONG  | null           |
| 5  | John    | Q5       | S1      | null              | A         | WRONG  | null           |
```

### Step 2: Find Questions Needing Review

```typescript
const needsReview = await prismaClient.question_attempt.findMany({
    where: {
        student_id: john.id,
        classroom_id: classroomA.id,
        status: "WRONG",
        child_attempt: null, // No follow-up yet
    },
    include: {
        question: {
            include: {
                step: { include: { topic: { include: { book: true } } } },
            },
        },
    },
    orderBy: [
        { question: { step: { topic: { book: { title: "asc" } } } } },
        { question: { step: { topic: { order: "asc" } } } },
        { question: { step: { order: "asc" } } },
        { question: { page: "asc" } },
        { question: { order: "asc" } },
    ],
})
// Returns: attempts for Q1-Q5
```

### Step 3: Create Review Assignment

```typescript
// Extract unique book IDs
// NOTE: THIS IS NECESSARY FOR `AssignmentMetaInfo`
const bookIds = [...new Set(needsReview.map((a) => a.question.step.topic.book.id))]

// Create the assignment
const assignment = await prismaClient.review_assignment.create({
    data: {
        student_id: john.id,
        classroom_id: classroomA.id,
        book_ids: bookIds,
    },
})

// Create new question_attempts linked to this assignment
await prismaClient.question_attempt.createMany({
    data: needsReview.map((parentAttempt) => ({
        student_id: john.id,
        question_id: parentAttempt.question_id,
        classroom_id: classroomA.id,
        review_assignment_id: assignment.id,
        parent_attempt_id: parentAttempt.id,
        status: null, // Not checked yet
    })),
})
```

**Database state after:**

```
review_assignment:
| id | student | classroom | book_ids | created_at | assigned_at | completed_at |
|----|---------|-----------|----------|------------|-------------|--------------|
| 1  | John    | A         | [1]      | now        | null        | null         |

question_attempt:
| id | student | question | session | review_assignment | classroom | status | parent_attempt |
|----|---------|----------|---------|-------------------|-----------|--------|----------------|
| 1  | John    | Q1       | S1      | null              | A         | WRONG  | null           |
| 2  | John    | Q2       | S1      | null              | A         | WRONG  | null           |
| 3  | John    | Q3       | S1      | null              | A         | WRONG  | null           |
| 4  | John    | Q4       | S1      | null              | A         | WRONG  | null           |
| 5  | John    | Q5       | S1      | null              | A         | WRONG  | null           |
| 6  | John    | Q1       | null    | 1                 | A         | null   | 1              |
| 7  | John    | Q2       | null    | 1                 | A         | null   | 2              |
| 8  | John    | Q3       | null    | 1                 | A         | null   | 3              |
| 9  | John    | Q4       | null    | 1                 | A         | null   | 4              |
| 10 | John    | Q5       | null    | 1                 | A         | null   | 5              |
```

### Step 4: Assign the Review Assignment

```typescript
await prismaClient.review_assignment.update({
    where: { id: assignment.id },
    data: {
        assigned_at: new Date(),
        status: "HOMEWORK",
    },
})
```

### Step 5: Check Review Assignment Questions

When teacher checks Q1, Q2 as CORRECT, Q3, Q4, Q5 as WRONG:

```typescript
await prismaClient.question_attempt.update({
    where: { id: 6 },
    data: { status: "CORRECT", checked_at: new Date() },
})
// ... repeat for others
```

**Database state after:**

```
question_attempt:
| id | student | question | session | review_assignment | classroom | status  | parent_attempt |
|----|---------|----------|---------|-------------------|-----------|---------|----------------|
| 1  | John    | Q1       | S1      | null              | A         | WRONG   | null           |
| 2  | John    | Q2       | S1      | null              | A         | WRONG   | null           |
| 3  | John    | Q3       | S1      | null              | A         | WRONG   | null           |
| 4  | John    | Q4       | S1      | null              | A         | WRONG   | null           |
| 5  | John    | Q5       | S1      | null              | A         | WRONG   | null           |
| 6  | John    | Q1       | null    | 1                 | A         | CORRECT | 1              |  ← Mastered!
| 7  | John    | Q2       | null    | 1                 | A         | CORRECT | 2              |  ← Mastered!
| 8  | John    | Q3       | null    | 1                 | A         | WRONG   | 3              |  ← Needs review again
| 9  | John    | Q4       | null    | 1                 | A         | WRONG   | 4              |  ← Needs review again
| 10 | John    | Q5       | null    | 1                 | A         | WRONG   | 5              |  ← Needs review again
```

### Step 6: Mark Assignment Complete

```typescript
// Check if all questions are checked
const assignment = await prismaClient.review_assignment.findUnique({
    where: { id: 1 },
    include: { question_attempts: true },
})

const allChecked = assignment.question_attempts.every((a) => a.status !== null)

if (allChecked) {
    await prismaClient.review_assignment.update({
        where: { id: 1 },
        data: { completed_at: new Date() },
    })
}
```

### Step 7: Create Next Review Assignment (for Q3, Q4, Q5)

```typescript
const needsReview = await prismaClient.question_attempt.findMany({
    where: {
        student_id: john.id,
        classroom_id: classroomA.id,
        status: "WRONG",
        child_attempt: null, // Q3, Q4, Q5 from assignment 1 have no child yet
    },
})
// Returns: attempts 8, 9, 10 (Q3, Q4, Q5 from assignment 1)

// Create new assignment and link...
```

---

## Summary

| Question                           | Answer                                                 |
| ---------------------------------- | ------------------------------------------------------ |
| When to create `question_attempt`? | Only when explicitly checked (Option C)                |
| Need `review_assignment_question`? | No, use `question_attempt` with `review_assignment_id` |
| How to track "not checked yet"?    | `status: null` on `question_attempt`                   |
| How to track "not assigned"?       | No `question_attempt` row exists                       |
| Assignment completion?             | All `question_attempts` have non-null `status`         |

## Final Schema

```prisma
model question_attempt {
    id                   BigInt          @id @default(autoincrement())
    student_id           BigInt
    question_id          BigInt
    classroom_id         BigInt?

    // Source - exactly one should be non-null
    session_id           BigInt?
    review_assignment_id BigInt?

    // Result
    status               attempt_status? // null = not checked yet
    checked_at           DateTime?

    // Chain tracking
    parent_attempt_id    BigInt?         @unique
    parent_attempt       question_attempt? @relation("AttemptChain", fields: [parent_attempt_id], references: [id])
    child_attempt        question_attempt? @relation("AttemptChain")

    created_at           DateTime        @default(now())

    student              student         @relation(...)
    question             question        @relation(...)
    classroom            classroom?      @relation(...)
    session              session?        @relation(...)
    review_assignment    review_assignment? @relation(...)

    @@unique([student_id, question_id, session_id])
    @@unique([student_id, question_id, review_assignment_id])
}

enum attempt_status {
    CORRECT
    WRONG
}

model review_assignment {
    id           BigInt         @id @default(autoincrement())
    student_id   BigInt
    classroom_id BigInt?
    book_ids     BigInt[]
    status       session_status?
    created_at   DateTime       @default(now())
    assigned_at  DateTime?
    completed_at DateTime?

    student           student            @relation(...)
    classroom         classroom?         @relation(...)
    question_attempts question_attempt[]
}
```
