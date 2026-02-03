# AGENTS.md - Coding Agent Guidelines

## Project Overview

TypeScript Express.js v5 REST API backend with Prisma ORM and PostgreSQL.
ESM module system (`"type": "module"`).

## Build/Lint/Test Commands

| Command               | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| `npm run dev`         | Start dev server with hot reload (`tsx --watch ./src/server.ts`)        |
| `npm run debug`       | Debug mode with inspector (`tsx --inspect-brk --watch ./src/server.ts`) |
| `npm run build`       | Production build (`npx prisma generate && tsc && tsc-alias`)            |
| `npm run format`      | Format code with Prettier (`prettier --write --cache .`)                |
| `npm run postinstall` | Generate Prisma client                                                  |

### Running Tests

**No test framework is currently configured.** The test script exits with error.

### Git Hooks (Husky)

- **pre-commit**: Runs `npm run format && git add .`
- **pre-push**: Runs `npm run build`

## Code Style Guidelines

### Formatting (Prettier)

- No semicolons (`"semi": false`)
- Double quotes (`"singleQuote": false`)
- 4 spaces indentation
- Trailing commas in ES5 contexts
- 120 character line width
- LF line endings

### ESLint Rules

- Unused variables/args prefixed with `_` are allowed (e.g., `_req`, `_next`, `_user_id`)
- Uses `typescript-eslint` recommended rules

### TypeScript Configuration

- Target: `esnext`, Module: `nodenext`
- Strict mode enabled
- `noUncheckedIndexedAccess: true` - array/object index access returns `T | undefined`
- `exactOptionalPropertyTypes: true` - strict optional property handling
- `verbatimModuleSyntax: true` - requires explicit `import type` syntax
- Path alias: `@/*` maps to project root (e.g., `@/src/...`, `@/generated/...`)

## Import Conventions

### File Extensions Required

Always use `.js` extension in imports (ESM requirement):

```typescript
import { ApiError } from "@/src/errors/appError/AppError.js"
import prismaClient from "@/src/db/prismaClient.js"
```

### Type-Only Imports

Use `import type` for type-only imports:

```typescript
import type { CorsOptions } from "cors"
import type { ErrorRequestHandler } from "express"
import type { role } from "@/generated/prisma/enums.js"
```

### Path Alias Usage

```typescript
// Preferred - use @/ alias
import { ApiError } from "@/src/errors/appError/AppError.js"
import prismaClient from "@/src/db/prismaClient.js"

// Relative imports also used in same module
import { dbFindMe } from "../db/authDb.js"
```

## Naming Conventions

### Variables and Functions

- **camelCase**: `extractAccessToken`, `makeSerializable`, `decodeAccessToken`
- **Database functions**: Prefix with `db`: `dbFindMe`, `dbCreateMe`, `dbPatchMe`
- **Unused parameters**: Prefix with `_`: `_req`, `_next`, `_user_id`

### Types and Interfaces

- **PascalCase**: `ApiError`, `ApiErrorCode`, `DecodedToken`
- **Props suffix** for function parameter types: `DbCreateClassroomProps`, `IssueTokensProps`

### Files and Directories

- **camelCase** for files: `authRouter.ts`, `prismaClient.ts`
- **kebab-case** for feature directories: `review-check/`, `progress/`
- **index.ts** for barrel exports

### Database Schema (snake_case)

- Tables: `app_user`, `classroom_student`
- Columns: `user_id`, `hagwon_id`, `completed_at`

### Constants

- **SCREAMING_SNAKE_CASE**: `ACCESS_TOKEN_AGE`, `REFRESH_TOKEN_NAME`

## Function Parameter Conventions

```typescript
// Single parameter - use directly
export const dbFindManyByClassroom = async (user_id: bigint) => { ... }

// Multiple parameters - use object with Props type declared above
type DbCreateClassroomProps = {
    classroom_name: string
    user_id: bigint
}
export const dbCreateClassroom = async ({ classroom_name, user_id }: DbCreateClassroomProps) => { ... }
```

## Error Handling

### ApiError Class

Use static factory methods from `@/src/errors/appError/AppError.js`:

```typescript
throw ApiError.BadRequest("잘못된 요청입니다") // 400
throw ApiError.Unauthorized("인증이 필요합니다") // 401
throw ApiError.AccessTokenExpired() // 401
throw ApiError.RefreshTokenExpired() // 401
throw ApiError.Forbidden("권한이 없습니다") // 403
throw ApiError.NotFound("찾을 수 없습니다") // 404
throw ApiError.Conflict("이미 존재합니다") // 409
throw ApiError.Internal("서버 오류") // 500
```

### Error Usage Pattern

```typescript
const result = await dbFindMeInLogin("email", { email, password })
if (!result) throw ApiError.NotFound("이메일과 비밀번호를 다시 확인해주세요")
```

### Pre-defined Domain Errors

Define reusable errors in feature modules:

```typescript
export const ClassroomStudentExclusivenessError = ApiError.BadRequest("반 혹은 개별 진도 학생을 선택해주세요")
```

## BigInt Handling

IDs are `bigint`. Use `makeSerializable` before JSON response:

```typescript
const result = await prismaClient.user.findUnique({ where: { id } })
const serializable = makeSerializable(result)
res.status(200).json(serializable)

// Convert from request params
const user_id = BigInt(req.params.userId)
```

## Export Patterns

### Default Exports

- Routers: `export default authRouter`
- Prisma client: `export default prismaClient`

### Named Exports

- Database functions: `export const dbFindMe = ...`
- Utility functions: `export const extractAccessToken = ...`
- Error classes: `export class ApiError extends Error`

## Project Structure

```
src/
├── server.ts              # Main entry point
├── config/env.ts          # Environment variables
├── constants/             # Application constants
├── db/                    # Shared database access layer
│   ├── prismaClient.ts    # Prisma client singleton
│   └── *Db.ts             # Domain-specific DB functions
├── routers/               # Legacy route handlers
├── features/              # Feature-based modules (preferred)
│   └── [feature]/
│       ├── route/index.ts
│       ├── db/index.ts
│       └── utils/
├── errors/
│   ├── appError/AppError.ts
│   └── errorRequestHandler.ts
├── interfaces/            # Shared type definitions
└── utils/                 # Utility functions
```

## Comment Conventions

- `// NOTE:` for explanations
- `// TODO:` for future work
- `// ----` prefix for debug messages: `"---- MISSING ENV VAR"`

## Language

Error messages are in Korean (e.g., `"이메일 혹은 비밀번호를 다시 확인해주세요"`).

## question.md / answer.md

When working with `question.md` and `answer.md`:

- **Only edit `answer.md`** — never modify `question.md`
- Read the question, then write your answer in the answer file
