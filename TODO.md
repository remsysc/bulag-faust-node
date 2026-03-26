# bulag-faust-node

<!--toc:start-->

- [bulag-faust-node](#bulag-faust-node)
  - [🎯 MVP Philosophy](#🎯-mvp-philosophy)
  - [Stack](#stack)
  - [How to Run](#how-to-run)
  - [📁 Project Structure (Clean Architecture)](#📁-project-structure-clean-architecture)
  - [✅ Phase 1 — Project Setup (COMPLETE)](#phase-1-project-setup-complete)
  - [✅ Phase 2 — Database Schema (COMPLETE)](#phase-2-database-schema-complete)
  - [✅ Phase 3 — Foundation (Types + Repositories) (COMPLETE)](#phase-3-foundation-types-repositories-complete)
    - [3.1 — TypeScript Types ✅](#31-typescript-types)
    - [3.2 — User Repository ✅](#32-user-repository)
    - [3.3 — Role Repository ✅](#33-role-repository)
  - [✅ Phase 4 — Error Handling (COMPLETE)](#phase-4-error-handling-complete)
  - [✅ Phase 5 — Validation Layer (COMPLETE)](#phase-5-validation-layer-complete)
  - [✅ Phase 6 — Authentication (COMPLETE — partial)](#phase-6-authentication-complete-partial)
    - [6.1 — Auth Service ✅](#61-auth-service)
    - [6.2 — Controllers + Routes ✅](#62-controllers-routes)
    - [6.3 — Auth Middleware 🔲](#63-auth-middleware-🔲)
    - [6.4 — Test Checklist 🔲](#64-test-checklist-🔲)
  - [🎉 MVP COMPLETE! (after Phase 6.3 + 6.4)](#🎉-mvp-complete-after-phase-63-64)
  - [🔲 Phase 7 — User Profile (Simplest Feature)](#🔲-phase-7-user-profile-simplest-feature)
  - [🔲 Phase 8 — Category Module (Admin-only CRUD)](#🔲-phase-8-category-module-admin-only-crud)
    - [8.1 — Repository](#81-repository)
    - [8.2 — Role Middleware](#82-role-middleware)
    - [8.3 — Service + Controller](#83-service-controller)
  - [🔲 Phase 9 — Tag Module](#🔲-phase-9-tag-module)
  - [🔲 Phase 10 — Post Module (CORE FEATURE)](#🔲-phase-10-post-module-core-feature)
    - [10.1 — Repository](#101-repository)
    - [10.2 — Service + Controller](#102-service-controller)
  - [🔲 Phase 11 — Pagination](#🔲-phase-11-pagination)
  - [🔲 Phase 12 — Polish & Security](#🔲-phase-12-polish-security)
  - [🧠 Key Mental Models](#🧠-key-mental-models)
  <!--toc:end-->

Rebuilding bulag-faust Spring Boot blog API in Node.js + Express from scratch.

> **Goal:** Learn Node.js by translating what you already know from Spring Boot.

---

## 🎯 MVP Philosophy

**Build in this order:**

1. **MVP First** - Minimum working product (Auth + Posts)
2. **Structure** - Clean architecture from the start (Types → Repositories → Services → Controllers)
3. **Polish Later** - Pagination, validation, rate limiting AFTER MVP works

```
MVP (Phases 1-5) → Features (Phases 6-9) → Polish (Phases 10-11)
     ↓                    ↓                     ↓
  Must have           Should have            Nice to have
```

---

## Stack

| Node.js      | Spring Boot Equivalent   |
| ------------ | ------------------------ |
| Express.js   | Spring MVC               |
| pg (raw SQL) | JPA / Hibernate          |
| jsonwebtoken | JwtUtils                 |
| bcrypt       | BCryptPasswordEncoder    |
| zod          | Bean Validation (@Valid) |
| dotenv       | application.properties   |
| nodemon      | Spring DevTools          |

---

## How to Run

```bash
# Start the database
docker-compose up -d

# Run migrations (creates tables)
npm run migrate

# Start dev server (auto-restarts on save)
npm run dev
```

---

## 📁 Project Structure (Clean Architecture)

```
src/
├── types/              ← TypeScript interfaces (DTOs, entities)
├── repositories/       ← Database queries ONLY
├── services/           ← Business logic ONLY
├── controllers/        ← HTTP handlers
├── routes/             ← Endpoint definitions
├── middlewares/        ← Auth, error handling
├── errors/             ← Custom error classes
├── validator/          ← Zod schemas + inferred types
├── utils/              ← Helpers (pagination, etc)
└── db/
    ├── index.ts        ← Connection pool
    └── migrate.ts      ← Schema creation
```

**Data Flow:**

```
Request → Middleware (validate) → Controller → Service → Repository → DB
          (Zod schema)            (HTTP)       (Logic)    (SQL)      (Postgres)
```

---

## ✅ Phase 1 — Project Setup (COMPLETE)

- [x] Initialize npm project
- [x] Install dependencies (express, dotenv, bcrypt, jsonwebtoken, pg, zod)
- [x] Install dev dependencies (nodemon, typescript)
- [x] Create folder structure
- [x] Create `app.ts` entry point
- [x] Setup `.env` file
- [x] Setup `docker-compose.yml` (postgres on port 5433)
- [x] Setup database connection pool
- [x] Setup package.json scripts

**✅ Done when:** `npm run dev` starts server, database connects

---

## ✅ Phase 2 — Database Schema (COMPLETE)

- [x] Users table
- [x] Roles table
- [x] User_roles join table
- [x] Posts table
- [x] Categories table
- [x] Post_categories join table
- [x] Tags table
- [x] Post_tags join table
- [x] Seed default roles (ROLE_USER, ROLE_ADMIN)
- [x] Seed default admin user

**✅ Done when:** `npm run migrate` creates all tables

---

## ✅ Phase 3 — Foundation (Types + Repositories) (COMPLETE)

### 3.1 — TypeScript Types ✅

- [x] Create `src/types/entities.ts`
- [x] `User`, `UserPublic`, `Role`, `UserWithRoles`
- [x] `JWTPayload`
- [x] `Post`, `PostWithRelations`, `Category`, `Tag`
- [x] `ApiResponse<T>`, `PageResponse<T>`, `Pageable`

### 3.2 — User Repository ✅

- [x] `findByEmail(email)`
- [x] `findByUsername(username)`
- [x] `createUser(data)` — password hashing done here (bcrypt)
- [x] `findById(id)`

### 3.3 — Role Repository ✅

- [x] `findByName(name: string): Promise<Role | null>`
- [x] `findByUserRoles(userId: string): Promise<Role[]>`
- [x] `assignRoleToUser(userId: string, roleId: string): Promise<void>`

**✅ Done when:** All repository methods exist and can query users + roles

> **Spring Boot equivalent:** `@Repository` interfaces + `JpaRepository<T, ID>`

---

## ✅ Phase 4 — Error Handling (COMPLETE)

> **Spring Boot equivalent:** `@RestControllerAdvice` + `@ExceptionHandler`

- [x] `src/errors/AppError.ts` — base class with `statusCode: number`
- [x] `src/errors/NotFoundException.ts` — 404
- [x] `src/errors/UnauthorizedException.ts` — 401
- [x] `src/errors/ForbiddenException.ts` — 403
- [x] `src/errors/ConflictException.ts` — 409
- [x] `src/errors/BadRequestException.ts` — 400
- [x] `src/errors/RouteNotFoundException.ts` — 404 for unknown routes
- [x] `src/middlewares/errorHandler.middleware.ts`
- [x] Error handler wired as **last middleware** in `app.ts`

---

## ✅ Phase 5 — Validation Layer (COMPLETE)

> **Spring Boot equivalent:** Bean Validation (`@Valid`, `@NotBlank`, `ConstraintViolationException`)

- [x] `src/validator/auth.validator.ts`
  - [x] `registerSchema` — username (min 5, alphanumeric+underscore), email, password (min 8)
  - [x] `loginSchema` — email + password
  - [x] `RegisterCredentials` type (inferred from registerSchema)
  - [x] `LoginCredentials` type (inferred from loginSchema)
- [x] `src/middlewares/validator.middleware.ts` — generic `validate(schema)` middleware
- [x] `POST /register` wired with `validate(registerSchema)`

> ⚠️ **Known gap:** `POST /login` is **missing** `validate(loginSchema)` in `auth.routes.ts`.
> Raw unvalidated input currently reaches `auth.service.ts` on login.
> Fix: add `validate(loginSchema)` to the login route before `authController.login`.

---

## ✅ Phase 6 — Authentication (COMPLETE — partial)

> **Spring Boot equivalent:** `AuthController`, `AuthService`, `JwtUtils`, `SecurityConfig`

### 6.1 — Auth Service ✅

- [x] `register(data: RegisterCredentials): Promise<string>`
  - Checks email + username uniqueness → `ConflictException`
  - Creates user (hashing in repository)
  - Assigns `ROLE_USER` via `assignRoleToUser`
  - Returns signed JWT `{ userId, email, roles: ['ROLE_USER'] }`
- [x] `login(data: LoginCredentials): Promise<string>`
  - Finds user by email → `UnauthorizedException` if not found
  - `bcrypt.compare` → `UnauthorizedException` on mismatch
  - `findByUserRoles` → maps to `string[]`
  - Returns signed JWT `{ userId, email, roles }`

### 6.2 — Controllers + Routes ✅

- [x] `src/controllers/auth.controller.ts` — register + login handlers
- [x] `src/routes/auth.routes.ts` — wired with validate middleware on register
- [x] Routes mounted in `app.ts` at `/api/v1/auth`

### 6.3 — Auth Middleware 🔲

- [x] Create `src/middlewares/auth.middleware.ts`
  - [x] Extract `Bearer <token>` from `Authorization` header
  - [x] Verify JWT → invalid/expired → throw `UnauthorizedException`
  - [x] Attach decoded payload to `req.user`
- [x] Create `src/types/express.d.ts` to extend Express `Request`

```typescript
// src/types/express.d.ts
import { JWTPayload } from "./entities";
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
```

### 6.4 — Test Checklist 🔲

- [x] `POST /register` with new user → 201 + JWT
- [x] `POST /register` with duplicate email → 409 Conflict
- [x] `POST /register` with invalid body (short password, bad email) → 400 Bad Request
- [x] `POST /login` with correct credentials → 200 + JWT
- [x] `POST /login` with wrong password → 401 Unauthorized
- [x] `POST /login` with invalid body → 400 Bad Request ← _blocked until login validation gap is fixed_
- [ ] Protected route without token → 401
- [ ] Protected route with valid token → 200
- [ ] Decode JWT → confirm `roles` array is populated

**✅ Done when:** All test checklist items pass

---

## 🎉 MVP COMPLETE! (after Phase 6.3 + 6.4)

**You will have:**

- ✅ User registration + login
- ✅ JWT authentication
- ✅ Protected routes
- ✅ Consistent error handling
- ✅ Input validation via Zod
- ✅ Role assignment on register

**Next:** Build features (User Profile, Categories, Tags, Posts)

---

## 🔲 Phase 7 — User Profile (Simplest Feature)

**Goal:** Users can view their own profile

**Dependencies:** Phase 6 fully complete (auth middleware must exist)

- [x] Create `src/services/user.service.ts`
  - [x] `getCurrentUser(userId: string): Promise<UserPublic>` — uses `findById`, throws `NotFoundException`
  - [x] `getPublicUserById(id: string): Promise<UserPublic>`
- [x] Create `src/controllers/user.controller.ts`
  - [x] `GET /api/v1/users/me` — requires auth middleware, returns current user
  - [x] `GET /api/v1/users/:id` — public profile (no password exposed)
- [x] Create `src/routes/user.routes.ts`
- [x] Wire into `app.ts`

**✅ Done when:** `GET /users/me` with valid JWT returns user data without password

> **Spring Boot equivalent:** `UserController`, `@AuthenticationPrincipal`

---

## 🔲 Phase 8 — Category Module (Admin-only CRUD)

**Goal:** Admins can manage categories, anyone can read them

**Dependencies:** Phase 7 complete

### 8.1 — Repository

- [x] Create `src/repositories/category.repository.ts`
  - [x]] `findAll(): Promise<Category[]>`
  - [x] `findById(id: string): Promise<Category | null>`
  - [x] `create(name: string): Promise<Category>`
  - [x] `update(id: string, name: string): Promise<Category>`
  - [x] `deleteById(id: string): Promise<void>`

### 8.2 — Role Middleware

- [ ] Create `src/middlewares/requireRole.middleware.ts`
  - [ ] Accept a role string (e.g. `'ROLE_ADMIN'`)
  - [ ] Check `req.user?.roles.includes(role)` → false → throw `ForbiddenException`

### 8.3 — Service + Controller

- [ ] Create `src/services/category.service.ts`
- [ ] Create `src/controllers/category.controller.ts`
  - [ ] `GET /api/v1/categories` — public
  - [ ] `GET /api/v1/categories/:id` — public
  - [ ] `POST /api/v1/categories` — `requireAuth` + `requireRole('ROLE_ADMIN')`
  - [ ] `PUT /api/v1/categories/:id` — `requireAuth` + `requireRole('ROLE_ADMIN')`
  - [ ] `DELETE /api/v1/categories/:id` — `requireAuth` + `requireRole('ROLE_ADMIN')`
- [ ] Create `src/routes/category.routes.ts`
- [ ] Wire into `app.ts`

**✅ Done when:** Category CRUD works, non-admin write attempts return 403

> **Spring Boot equivalent:** `CategoryController`, `@PreAuthorize("hasRole('ADMIN')")`

---

## 🔲 Phase 9 — Tag Module

**Goal:** Authenticated users can manage tags

**Dependencies:** Phase 8 pattern established (reuse `requireRole` middleware)

- [ ] Create `src/repositories/tag.repository.ts`
  - [ ] `findAll()`, `findById()`, `create()`, `deleteById()`
- [ ] Create `src/services/tag.service.ts`
- [ ] Create `src/controllers/tag.controller.ts`
  - [ ] `GET /api/v1/tags` — public
  - [ ] `POST /api/v1/tags` — `requireAuth`
  - [ ] `DELETE /api/v1/tags/:id` — `requireAuth`
- [ ] Create `src/routes/tag.routes.ts`
- [ ] Wire into `app.ts`

---

## 🔲 Phase 10 — Post Module (CORE FEATURE)

**Goal:** Full blog post CRUD with relationships (author, categories, tags)

**Dependencies:** Phases 8 + 9 complete

### 10.1 — Repository

- [ ] Create `src/repositories/post.repository.ts`
  - [ ] `findAll(filters: { categoryId?, tagId?, authorId?, status? }): Promise<Post[]>`
  - [ ] `findById(id: string): Promise<PostWithRelations | null>` — JOIN author, categories, tags
  - [ ] `create(data, authorId: string): Promise<Post>`
  - [ ] `update(id: string, data, authorId: string): Promise<Post>` — verify ownership in SQL
  - [ ] `deleteById(id: string, authorId: string): Promise<void>` — verify ownership in SQL
  - [ ] `attachCategories(postId: string, categoryIds: string[]): Promise<void>`
  - [ ] `attachTags(postId: string, tagIds: string[]): Promise<void>`

> **Why verify ownership in SQL?**
> Service-layer check = 2 queries (fetch post, then check author_id).
> `WHERE id = $1 AND author_id = $2` = 1 query. If 0 rows affected → throw `ForbiddenException`.
> More efficient, avoids race conditions.

### 10.2 — Service + Controller

- [ ] Create `src/services/post.service.ts`
- [ ] Create `src/controllers/post.controller.ts`
  - [ ] `GET /api/v1/posts` — public
  - [ ] `GET /api/v1/posts/:id` — public (published only, unless owner/admin)
  - [ ] `POST /api/v1/posts` — `requireAuth`
  - [ ] `PATCH /api/v1/posts/:id` — `requireAuth` (owner only)
  - [ ] `DELETE /api/v1/posts/:id` — `requireAuth` (owner only)
- [ ] Create `src/routes/post.routes.ts`
- [ ] Wire into `app.ts`

---

## 🔲 Phase 11 — Pagination

**Goal:** Efficient data loading for all list endpoints

- [ ] Create `src/utils/pageResponse.ts`
- [ ] Update repositories to accept `Pageable`
- [ ] Offset pagination SQL pattern across posts, categories, tags

> **Spring Boot equivalent:** `Pageable`, `Page<T>`

---

## 🔲 Phase 12 — Polish & Security

- [ ] `validate(loginSchema)` on login route ← **carry this forward from Phase 6 gap**
- [ ] Rate limiting on auth endpoints
- [ ] CORS configuration
- [ ] Helmet.js security headers
- [ ] Request logging middleware
- [ ] API documentation

---

## 🧠 Key Mental Models

| Spring Boot             | Express/TypeScript                         |
| ----------------------- | ------------------------------------------ |
| `@Entity`               | `interface User {}` in `types/entities.ts` |
| `@RestController`       | `router.get/post/put/delete` + controller  |
| `@Service`              | `src/services/*.ts`                        |
| `@Repository`           | `src/repositories/*.ts`                    |
| `@Autowired`            | `import` at top of file                    |
| `ResponseEntity<T>`     | `res.status(code).json(data)`              |
| `@PathVariable`         | `req.params.id`                            |
| `@RequestParam`         | `req.query.page`                           |
| `@RequestBody`          | `req.body`                                 |
| `@Valid`                | `validate(schema)` middleware              |
| `@PreAuthorize`         | `requireAuth` + `requireRole` middlewares  |
| `@RestControllerAdvice` | Last `app.use()` error handler             |
| `SecurityContextHolder` | `req.user` from auth middleware            |
| `Page<T>`               | `PageResponse<T>` utility                  |
| `HttpStatus.CREATED`    | `res.status(201)`                          |
| `HttpStatus.NO_CONTENT` | `res.status(204).send()` on delete         |
