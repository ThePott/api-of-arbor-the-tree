# Answer 3: Ordering and Classroom Scoping

## Question 1: Order of Questions

> Order must be done by book name order → topic order → step order → question order

### Solution: Use `orderBy` at Query Time (No Stored `order` Needed)

The ordering hierarchy is:

1. Book title (alphabetical)
2. Topic order (within book)
3. Step order (within topic)
4. Question page (within step)
5. Question order (within page)

---

## Question 2: Grouping by Book and Topic in Schema?

> Questions in PDF are grouped by book and topic. Should this be included in schema?

### Recommendation: No, Don't Store Grouping or Order in Schema

**Why not?**

1. **Grouping is derivable** - You can always group by joining to `question` → `step` → `topic` → `book`
2. **Denormalization risk** - If book/topic structure changes, stored grouping becomes stale
3. **Adds complexity** - More tables/columns to maintain

### Why No `order` Field Either?

You need the deep join **anyway** to group questions by book and topic for display. Since you're already doing the join, adding `orderBy` is free - no additional query cost.

```typescript
const attempts = await prismaClient.question_attempt.findMany({
    where: { review_assignment_id },
    include: {
        question: {
            include: {
                step: {
                    include: {
                        topic: {
                            include: { book: { select: { title: true } } },
                        },
                    },
                },
            },
        },
    },
    // orderBy comes free since we're already joining
    orderBy: [
        { question: { step: { topic: { book: { title: "asc" } } } } },
        { question: { step: { topic: { order: "asc" } } } },
        { question: { step: { order: "asc" } } },
        { question: { page: "asc" } },
        { question: { order: "asc" } },
    ],
})

// Group in application code
const groupedByBook = groupBy(attempts, (a) => a.question.step.topic.book.title)
const groupedByTopic = groupBy(attempts, (a) => a.question.step.topic.title)
```

**Key insight:** The deep join for grouping and the `orderBy` are the same operation. Storing `order` would only help if you wanted to skip the deep join - but you can't skip it because you need the grouping data.

---

## Question 3: Query by Classroom

> Review assignment must be created by classroom. How does this affect schema?

### Current Schema (from answer_2.md)

```prisma
model question_attempt {
    session_id           BigInt?
    review_assignment_id BigInt?
    // No classroom_id here
}

model review_assignment {
    classroom_id BigInt?  // Already has classroom
}
```

### The Query Challenge

To find "needs review" for a classroom:

```typescript
// Find wrong attempts that:
// 1. Belong to sessions assigned to this classroom
// 2. Or belong to review_assignments for this classroom
// 3. And have no child attempt

const needsReview = await prismaClient.question_attempt.findMany({
    where: {
        student_id,
        status: "WRONG",
        child_attempt: null,
        OR: [
            // From session assigned to classroom
            {
                session: {
                    assignedSessionClassrooms: {
                        some: { classroom_id },
                    },
                },
            },
            // From review_assignment for classroom
            {
                review_assignment: {
                    classroom_id,
                },
            },
        ],
    },
})
```

This works but requires joining through `session` → `assignedSessionClassrooms`.

### Alternative: Add `classroom_id` to `question_attempt`

```prisma
model question_attempt {
    id                   BigInt          @id @default(autoincrement())
    student_id           BigInt
    question_id          BigInt
    classroom_id         BigInt?         // NEW: denormalized for easier querying

    session_id           BigInt?
    review_assignment_id BigInt?
    // ... rest unchanged
}
```

**Simpler query:**

```typescript
const needsReview = await prismaClient.question_attempt.findMany({
    where: {
        student_id,
        classroom_id, // Direct filter!
        status: "WRONG",
        child_attempt: null,
    },
})
```

**Tradeoff:**

| Without `classroom_id`               | With `classroom_id`            |
| ------------------------------------ | ------------------------------ |
| No denormalization                   | Denormalized                   |
| Complex query (join through session) | Simple query                   |
| Always consistent                    | Must set correctly at creation |

**Recommendation:** Add `classroom_id` to `question_attempt`. The query simplicity is worth the minor denormalization, and `classroom_id` is unlikely to change after creation.

---

## Question 4: Same Student in Multiple Classrooms with Same Syllabus

> Student is assigned to two different classrooms, same syllabus used in both. Question attempts need to be tracked separately?

### The Scenario

```
Student A
├── Classroom 1 (Syllabus X, Session 1)
│     └── question_attempt for Question Q (WRONG)
│
└── Classroom 2 (Syllabus X, Session 1)  // Same session!
      └── question_attempt for Question Q (???)
```

### Option A: Disallow (Recommended for Simplicity)

**Enforce at application level:**

```typescript
// When assigning student to classroom
const existingSyllabi = await prismaClient.classroom_syllabus.findMany({
    where: {
        syllabus_id,
        classroom: {
            classroomStudents: {
                some: { student_id },
            },
        },
    },
})

if (existingSyllabi.length > 0) {
    throw ApiError.Conflict("학생이 이미 같은 문제집을 다른 반에서 진행 중입니다")
}
```

**Why disallow?**

1. **Confusing UX** - Student sees same question twice in different contexts
2. **Complex tracking** - Need to track "which classroom's attempt" separately
3. **Rare scenario** - Why would you assign same syllabus to same student twice?

### Option B: Allow with Separate Tracking

If you must allow it, the current schema can handle it with `classroom_id` on `question_attempt`:

```prisma
model question_attempt {
    student_id           BigInt
    question_id          BigInt
    classroom_id         BigInt?         // Differentiates which classroom context
    session_id           BigInt?
    // ...

    @@unique([student_id, question_id, session_id, classroom_id])  // Updated unique constraint
}
```

Now the same student can have two attempts for the same question in the same session, differentiated by `classroom_id`.

**Query for specific classroom:**

```typescript
const attempts = await prismaClient.question_attempt.findMany({
    where: {
        student_id,
        classroom_id, // Filters to specific classroom context
        status: "WRONG",
        child_attempt: null,
    },
})
```

### My Recommendation

**Option A (Disallow)** unless you have a clear business requirement for allowing duplicates.

Reasons:

1. Simpler schema and logic
2. Avoids confusing edge cases
3. If student needs to redo a syllabus, create a new syllabus instance instead

---

## Updated Schema Summary

```prisma
model question_attempt {
    id                   BigInt          @id @default(autoincrement())
    student_id           BigInt
    question_id          BigInt
    classroom_id         BigInt?         // For classroom scoping

    session_id           BigInt?
    review_assignment_id BigInt?

    status               attempt_status?
    checked_at           DateTime?

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

model review_assignment {
    id           BigInt    @id @default(autoincrement())
    student_id   BigInt
    classroom_id BigInt?
    book_ids     BigInt[]
    created_at   DateTime  @default(now())
    completed_at DateTime?

    student           student            @relation(...)
    classroom         classroom?         @relation(...)
    question_attempts question_attempt[]
}
```

---

## Summary

| Question                              | Answer                                                      |
| ------------------------------------- | ----------------------------------------------------------- |
| How to order?                         | `orderBy` at query time (no stored `order` needed)          |
| Store book/topic grouping?            | No, derive at query time                                    |
| Why no `order` field?                 | Deep join needed for grouping anyway, `orderBy` is free     |
| Classroom scoping?                    | Add `classroom_id` to `question_attempt`                    |
| Same syllabus in multiple classrooms? | Disallow (recommend) or use `classroom_id` to differentiate |
