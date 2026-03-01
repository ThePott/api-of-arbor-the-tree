# Answer 2: Fresh Schema Design with `question_attempt`

## Why Redesign?

The previous answer introduced `review_check` + `review_assignment_question` as separate models. This works but has issues:

1. **Two models for similar concept** - Both track "student attempted a question"
2. **Complex chain tracking** - Need to query both tables to find "needs review"
3. **Deep joins for book titles** - Must traverse `question` → `step` → `topic` → `book`
4. **No order guarantee** - PDF order may not match checking UI order

---

## Core Insight

What we're really tracking is:

> **A student's journey with a question** - from first encountering it, to getting it wrong, to reviewing it (possibly multiple times), until they finally master it.

This is a **chain of attempts**, regardless of whether the attempt happened in a session or a review assignment.

---

## Recommended Schema

### `question_attempt`

A unified model for all question attempts:

```prisma
model question_attempt {
    id                   BigInt          @id @default(autoincrement())
    student_id           BigInt
    question_id          BigInt

    // Source - exactly one should be non-null
    session_id           BigInt?
    review_assignment_id BigInt?

    // Result
    status               attempt_status?
    checked_at           DateTime?

    // Chain tracking
    parent_attempt_id    BigInt?         @unique
    parent_attempt       question_attempt? @relation("AttemptChain", fields: [parent_attempt_id], references: [id])
    child_attempt        question_attempt? @relation("AttemptChain")

    created_at           DateTime        @default(now())

    student              student         @relation(fields: [student_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    question             question        @relation(fields: [question_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    session              session?        @relation(fields: [session_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    review_assignment    review_assignment? @relation(fields: [review_assignment_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

    @@unique([student_id, question_id, session_id])
    @@unique([student_id, question_id, review_assignment_id])
}

enum attempt_status {
    CORRECT
    WRONG
}
```

### `review_assignment`

```prisma
model review_assignment {
    id           BigInt    @id @default(autoincrement())
    student_id   BigInt
    classroom_id BigInt?
    book_ids     BigInt[]  // Denormalized for quick title lookup
    created_at   DateTime  @default(now())
    completed_at DateTime?

    student           student            @relation(fields: [student_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    classroom         classroom?         @relation(fields: [classroom_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
    question_attempts question_attempt[]
}
```

---

## Design Decisions

### Why Single `question_attempt` Model?

| Aspect               | Two Models (`review_check` + `review_assignment_question`) | Single Model (`question_attempt`) |
| -------------------- | ---------------------------------------------------------- | --------------------------------- |
| Concept              | Two different things                                       | One unified concept               |
| "Needs review" query | Query both tables                                          | Single query                      |
| Chain tracking       | Complex (cross-table)                                      | Simple (`parent_attempt_id`)      |
| Code duplication     | Similar logic in two places                                | One place                         |

### Why `session_id` / `review_assignment_id` Instead of `source_type` Enum?

```prisma
// Option A: Enum (redundant)
source_type          attempt_source_type  // "SESSION" | "REVIEW_ASSIGNMENT"
session_id           BigInt?
review_assignment_id BigInt?

// Option B: Just nullable FKs (simpler)
session_id           BigInt?
review_assignment_id BigInt?
```

The nullability already tells you the source. `source_type` would be redundant data that could become inconsistent.

### Enforcing "Exactly One Source"

Prisma doesn't support CHECK constraints directly, but you can:

1. **Database-level constraint** (via raw migration):

```sql
ALTER TABLE question_attempt
ADD CONSTRAINT exactly_one_source
CHECK (
    (session_id IS NOT NULL AND review_assignment_id IS NULL) OR
    (session_id IS NULL AND review_assignment_id IS NOT NULL)
);
```

2. **Application-level validation**:

```typescript
if ((session_id && review_assignment_id) || (!session_id && !review_assignment_id)) {
    throw ApiError.Internal("question_attempt must have exactly one source")
}
```

### Why `@unique` on `parent_attempt_id`?

```prisma
parent_attempt_id    BigInt?         @unique
```

This ensures **at most one child per parent**. A wrong attempt can only spawn one follow-up attempt. Without `@unique`, you could accidentally create multiple children.

### Why `book_ids BigInt[]`?

Avoids deep join just to display book titles in assignment list.

```typescript
// Without book_ids: deep join required
question_attempt → question → step → topic → book

// With book_ids: simple query
const books = await prismaClient.book.findMany({
    where: { id: { in: assignment.book_ids } },
})
```

### Why `order Int?`?

- `NULL` for session attempts (order comes from book structure)
- Set at assignment creation for review attempts
- Guarantees PDF order matches checking UI order

---

## How the Chain Works

```
question_attempt (session, WRONG)               ← parent_attempt_id: NULL
  └── question_attempt (assignment_1, WRONG)    ← parent_attempt_id: points to above
        └── question_attempt (assignment_2, CORRECT)  ← parent_attempt_id: points to above
              └── (no child = mastered!)
```

---

## Query Examples

### Find All Questions Needing Review (Single Query!)

```typescript
const needsReview = await prismaClient.question_attempt.findMany({
    where: {
        student_id,
        status: "WRONG",
        child_attempt: null, // No follow-up attempt exists
    },
})
```

This single query finds:

- Session wrongs not yet assigned
- Assignment wrongs not yet re-assigned

No need to query two tables!

### Create Review Assignment

```typescript
const needsReview = await prismaClient.question_attempt.findMany({
    where: {
        student_id,
        status: "WRONG",
        child_attempt: null,
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

// Extract unique book IDs
const bookIds = [...new Set(needsReview.map((a) => a.question.step.topic.book.id))]

// Create assignment
const assignment = await prismaClient.review_assignment.create({
    data: {
        student_id,
        classroom_id,
        book_ids: bookIds,
    },
})

// Create attempts with order
await prismaClient.question_attempt.createMany({
    data: needsReview.map((parentAttempt, index) => ({
        student_id,
        question_id: parentAttempt.question_id,
        review_assignment_id: assignment.id,
        parent_attempt_id: parentAttempt.id,
        order: index,
    })),
})
```

### Fetch Assignment for Checking UI

```typescript
const assignment = await prismaClient.review_assignment.findUnique({
    where: { id: assignment_id },
    include: {
        question_attempts: {
            orderBy: { order: "asc" }, // Matches PDF order
            include: {
                question: {
                    select: { name: true, page: true },
                },
            },
        },
    },
})

// Get book titles (simple, no deep join)
const books = await prismaClient.book.findMany({
    where: { id: { in: assignment.book_ids } },
    select: { id: true, title: true },
})
```

### Check If Assignment Is Complete

```typescript
const assignment = await prismaClient.review_assignment.findUnique({
    where: { id: assignment_id },
    include: {
        question_attempts: {
            select: { status: true },
        },
    },
})

const isComplete = assignment.question_attempts.every((a) => a.status !== null)
```

### Stats: How Many Times Wrong?

```typescript
const wrongCount = await prismaClient.question_attempt.count({
    where: {
        student_id,
        question_id,
        status: "WRONG",
    },
})
```

### Full History of a Question

```typescript
const history = await prismaClient.question_attempt.findMany({
    where: {
        student_id,
        question_id,
    },
    orderBy: { created_at: "asc" },
})

// Result: array showing the journey
// [
//   { session_id: 1, status: "WRONG", ... },
//   { review_assignment_id: 1, status: "WRONG", ... },
//   { review_assignment_id: 2, status: "CORRECT", ... },
// ]
```

---

## Summary

| Problem                        | Solution                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| Two models for similar concept | Single `question_attempt` model                                 |
| Complex "needs review" query   | `child_attempt: null` filter                                    |
| Chain tracking                 | `parent_attempt_id` with `@unique`                              |
| Order consistency              | `order` field set at creation                                   |
| Book title deep joins          | `book_ids BigInt[]` on assignment                               |
| Source tracking                | Nullable `session_id` / `review_assignment_id` (no enum needed) |
