# bulag-faust-node

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

| Node.js | Spring Boot Equivalent |
|---------|----------------------|
| Express.js | Spring MVC |
| pg (raw SQL) | JPA / Hibernate |
| jsonwebtoken | JwtUtils |
| bcrypt | BCryptPasswordEncoder |
| zod | Bean Validation (@Valid) |
| dotenv | application.properties |
| nodemon | Spring DevTools |

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
├── utils/              ← Helpers (pagination, etc)
└── db/
    ├── index.ts        ← Connection pool
    └── migrate.ts      ← Schema creation
```

**Data Flow:**
```
Request → Controller → Service → Repository → DB
          (HTTP)       (Logic)    (SQL)      (Postgres)
```

---

## ✅ Phase 1 — Project Setup (COMPLETE)

**Goal:** Get the skeleton running

- [x] Initialize npm project
- [x] Install dependencies (express, dotenv, bcrypt, jsonwebtoken, pg)
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

**Goal:** All tables created

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

**Goal:** Type safety + clean data access layer

**Why first?** Everything else depends on these. Types define your contracts.
Repositories isolate SQL from business logic — if you ever swap postgres for
another DB, only this layer changes.

### 3.1 — TypeScript Types ✅
- [x] Create `src/types/entities.ts`
- [x] `User`, `UserPublic`, `Role`, `UserWithRoles`
- [x] `AuthCredentials`, `RegisterCredentials`, `JWTPayload`
- [x] `Post`, `PostWithRelations`, `Category`, `Tag`
- [x] `ApiResponse<T>`, `PageResponse<T>`, `Pageable`

> ⚠️ **Known typos to fix before Phase 4:**
> - `categoris` → `categories` in `PostWithRelations`
> - `fist` → `first` in `PageResponse`
> - `date?` → `data?` in `ApiResponse`

### 3.2 — User Repository ✅ (partial)
- [x] `findByEmail(email)`
- [x] `findByUsername(username)`
- [x] `createUser(data)`
- [x] `findById(id)` ← **MISSING — needed by auth middleware in Phase 4**

### 3.3 — Role Repository 🔲 (not created yet)
- [x] Create `src/repositories/role.repository.ts`
  - [x] `findByName(name: string): Promise<Role | null>`
  - [x] `findUserRoles(userId: string): Promise<Role[]>`
  - [x] `assignRoleToUser(userId: string, roleId: string): Promise<void>`

> **Why `assignRoleToUser`?** During registration, new users must be assigned
> `ROLE_USER`. Without this, `req.user.roles` will be empty and all role-based
> middleware will fail silently.

**✅ Done when:** All repository methods exist and can query users + roles

> **Spring Boot equivalent:** `@Repository` interfaces + `JpaRepository<T, ID>`

---

## ✅ Phase 4 — Error Handling (COMPLETE)

**Goal:** Consistent error responses established before writing any business logic

**Why BEFORE auth?** Your very first endpoint (`/register`) can throw conflicts,
validation errors, and DB errors. Without a global error handler, Express returns
an ugly unformatted 500. Establish the error contract first — every feature
you build will rely on it.

> **Spring Boot equivalent:** `@RestControllerAdvice` + `@ExceptionHandler`

- [x] Create `src/errors/` directory
  - [x] `AppError.ts` — base class `extends Error` with `statusCode: number`
  - [x] `NotFoundException.ts` — 404
  - [x] `UnauthorizedException.ts` — 401
  - [x] `ForbiddenException.ts` — 403
  - [x] `ConflictException.ts` — 409
  - [x] `BadRequestException.ts` — 400

- [x] Create `src/middlewares/errorHandler.middleware.ts`
  - [x] Handle known errors: `if (err instanceof AppError)`
  - [x] Handle 404 unknown routes: `app.use((req, res) => ...)`
  - [x] Handle unknown 500 errors: log stack trace, return generic message

- [ ] Wire error handler as **last middleware** in `app.ts`

**✅ Done when:** All errors return this consistent shape:
```json
{
  "error": "Not Found",
  "message": "User not found",
  "statusCode": 404
}
```

---

## 🔲 Phase 5 — Authentication (MVP CRITICAL)

**Goal:** Users can register and login, routes can be protected

**Dependencies:** Phase 3 fully complete (including `findById` + `role.repository`) + Phase 4 complete

> **Before writing any code, answer this:**
> When `login()` succeeds and you call `jwt.sign()`, where exactly does the
> `roles: string[]` in your `JWTPayload` come from? Which repository method
> gives you that data, and at what point in the login flow do you call it?

### 5.1 — Auth Service
- [ ] Create `src/services/auth.service.ts`
  - [ ] `register(data: RegisterCredentials): Promise<string>` (returns JWT)
    1. Check if email already exists → throw `ConflictException`
    2. Check if username already exists → throw `ConflictException`
    3. `createUser(data)` — password hashing is in the repository
    4. Fetch `ROLE_USER` by name
    5. `assignRoleToUser(newUser.id, role.id)`
    6. Return signed JWT with `{ userId, email, roles: ['ROLE_USER'] }`
  - [ ] `login(data: AuthCredentials): Promise<string>` (returns JWT)
    1. `findByEmail(email)` → not found → throw `UnauthorizedException`
    2. `bcrypt.compare(password, user.password)` → mismatch → throw `UnauthorizedException`
    3. `findUserRoles(user.id)` → map to `string[]`
    4. Return signed JWT with `{ userId, email, roles }`

### 5.2 — Controllers + Routes
- [ ] Create `src/controllers/auth.controller.ts`
  - [ ] `POST /api/v1/auth/register` → `201 Created` with JWT
  - [ ] `POST /api/v1/auth/login` → `200 OK` with JWT
- [ ] Create `src/routes/auth.routes.ts`
- [ ] Wire routes into `app.ts`

### 5.3 — Auth Middleware
- [ ] Create `src/middlewares/auth.middleware.ts`
  - [ ] Extract `Bearer <token>` from `Authorization` header
  - [ ] Verify JWT → invalid/expired → throw `UnauthorizedException`
  - [ ] Attach decoded payload to `req.user` (extend Express `Request` type)

> **How to extend Express Request:**
> ```typescript
> // src/types/express.d.ts
> import { JWTPayload } from './entities';
> declare global {
>   namespace Express {
>     interface Request {
>       user?: JWTPayload;
>     }
>   }
> }
> ```

### 5.4 — Test Checklist
- [ ] `POST /register` with new user → 201 + JWT
- [ ] `POST /register` with duplicate email → 409 Conflict
- [ ] `POST /login` with correct credentials → 200 + JWT
- [ ] `POST /login` with wrong password → 401 Unauthorized
- [ ] Protected route without token → 401
- [ ] Protected route with valid token → 200
- [ ] Decode JWT → confirm `roles` array is populated

**✅ Done when:** All test checklist items pass

> **Spring Boot equivalent:** `AuthController`, `AuthService`, `JwtUtils`, `SecurityConfig`

---

## 🎉 MVP COMPLETE!

**You now have:**
- ✅ User registration + login
- ✅ JWT authentication
- ✅ Protected routes
- ✅ Consistent error handling
- ✅ Role assignment on register

**Next:** Build features (User Profile, Categories, Tags, Posts)

---

## 🔲 Phase 6 — User Profile (Simplest Feature)

**Goal:** Users can view their own profile

**Why now?** Simplest read-only endpoint to validate the full request lifecycle.
One protected GET, one service call, one repository call. If this breaks,
your auth middleware or repository has a bug — better to find it here than in Posts.

**Dependencies:** Phase 5 complete

- [ ] Create `src/services/user.service.ts`
  - [ ] `getCurrentUser(userId: string): Promise<UserPublic>` — uses `findById`, throws `NotFoundException`
  - [ ] `getPublicUserById(id: string): Promise<UserPublic>`
- [ ] Create `src/controllers/user.controller.ts`
  - [ ] `GET /api/v1/users/me` — requires auth middleware, returns current user
  - [ ] `GET /api/v1/users/:id` — public profile (no password exposed)
- [ ] Create `src/routes/user.routes.ts`
- [ ] Wire into `app.ts`

**✅ Done when:** `GET /users/me` with valid JWT returns user data without password

> **Spring Boot equivalent:** `UserController`, `@AuthenticationPrincipal`

---

## 🔲 Phase 7 — Category Module (Admin-only CRUD)

**Goal:** Admins can manage categories, anyone can read them

**Dependencies:** Phase 6 complete

### 7.1 — Repository
- [ ] Create `src/repositories/category.repository.ts`
  - [ ] `findAll(): Promise<Category[]>`
  - [ ] `findById(id: string): Promise<Category | null>`
  - [ ] `create(name: string): Promise<Category>`
  - [ ] `update(id: string, name: string): Promise<Category>`
  - [ ] `deleteById(id: string): Promise<void>`

### 7.2 — Role Middleware
- [ ] Create `src/middlewares/requireRole.middleware.ts`
  - [ ] Accept a role string (e.g. `'ROLE_ADMIN'`)
  - [ ] Check `req.user?.roles.includes(role)` → false → throw `ForbiddenException`

> **Why a separate middleware and not inline in the service?**
> Authorization is a cross-cutting concern (like logging). It belongs in the
> HTTP layer, not business logic. The service should assume the caller is authorized.
> Spring Boot uses `@PreAuthorize` at the controller level for the same reason.

### 7.3 — Service + Controller
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

## 🔲 Phase 8 — Tag Module

**Goal:** Authenticated users can manage tags

**Dependencies:** Phase 7 pattern established (reuse `requireRole` middleware)

- [ ] Create `src/repositories/tag.repository.ts`
  - [ ] `findAll()`, `findById()`, `create()`, `deleteById()`
- [ ] Create `src/services/tag.service.ts`
- [ ] Create `src/controllers/tag.controller.ts`
  - [ ] `GET /api/v1/tags` — public
  - [ ] `POST /api/v1/tags` — `requireAuth`
  - [ ] `DELETE /api/v1/tags/:id` — `requireAuth`
- [ ] Create `src/routes/tag.routes.ts`
- [ ] Wire into `app.ts`

**✅ Done when:** Tags CRUD works for authenticated users

---

## 🔲 Phase 9 — Post Module (CORE FEATURE)

**Goal:** Full blog post CRUD with relationships (author, categories, tags)

**Dependencies:** Phases 7 + 8 complete (categories and tags must exist first)

### 9.1 — Repository
- [ ] Create `src/repositories/post.repository.ts`
  - [ ] `findAll(filters: { categoryId?, tagId?, authorId?, status? }): Promise<Post[]>`
  - [ ] `findById(id: string): Promise<PostWithRelations | null>` — JOIN author, categories, tags
  - [ ] `create(data, authorId: string): Promise<Post>`
  - [ ] `update(id: string, data, authorId: string): Promise<Post>` — verify ownership in SQL
  - [ ] `deleteById(id: string, authorId: string): Promise<void>` — verify ownership in SQL
  - [ ] `attachCategories(postId: string, categoryIds: string[]): Promise<void>`
  - [ ] `attachTags(postId: string, tagIds: string[]): Promise<void>`

> **Why verify ownership in SQL and not in the service?**
> The service would require fetching the post first, then checking `post.author_id === req.user.userId`.
> That's 2 queries. A `WHERE id = $1 AND author_id = $2` does it in 1.
> If 0 rows are affected, the post either doesn't exist or doesn't belong to the user —
> throw `ForbiddenException`. This is more efficient and avoids race conditions.

### 9.2 — Service + Controller
- [ ] Create `src/services/post.service.ts`
- [ ] Create `src/controllers/post.controller.ts`
  - [ ] `GET /api/v1/posts` — public, supports `?categoryId=&tagId=&authorId=&status=`
  - [ ] `GET /api/v1/posts/:id` — public (only published, unless owner/admin)
  - [ ] `POST /api/v1/posts` — `requireAuth` → creates as `draft` by default
  - [ ] `PATCH /api/v1/posts/:id` — `requireAuth` (owner only)
  - [ ] `DELETE /api/v1/posts/:id` — `requireAuth` (owner only)
- [ ] Create `src/routes/post.routes.ts`
- [ ] Wire into `app.ts`

### 9.3 — Test Full Workflow
- [ ] Login → Create post → View post → Update → Publish → Delete
- [ ] Attempt to update another user's post → 403

**✅ Done when:** Full blog post workflow works end-to-end

> **Spring Boot equivalent:** `PostController`, `PostService`, `@OneToMany`, `@ManyToMany`

---

## 🔲 Phase 10 — Pagination

**Goal:** Efficient data loading for all list endpoints

**Why now?** MVP works. Now prevent large DB scans from taking down your server.

**Dependencies:** Phase 9 complete

- [ ] Create `src/utils/pageResponse.ts`
  - [ ] Standard shape: `{ content, page, size, totalElements, totalPages, last, first, numberOfElements }`
- [ ] Update repositories to accept `Pageable` and return counts:
  - [ ] `GET /api/v1/posts` — `?page=0&size=10&sort=created_at,desc`
  - [ ] `GET /api/v1/categories` — paginated
  - [ ] `GET /api/v1/tags` — paginated
- [ ] Offset pagination SQL pattern:
  ```sql
  SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2
  SELECT COUNT(*) FROM posts  -- separate query for totalElements
  ```

> **Why offset pagination for an MVP?**
> Cursor-based pagination (used by Twitter/Facebook) is more performant at scale
> but much harder to implement. Offset is what Spring's `Pageable` uses by default.
> Good enough until you have millions of rows.

**✅ Done when:** All list endpoints return paginated responses

> **Spring Boot equivalent:** `Pageable`, `Page<T>`, `PageResponse<T>`

---

## 🔲 Phase 11 — Polish & Security

**Goal:** Production-ready API

**Dependencies:** Phase 10 complete

- [ ] Input validation with `zod`
  - [ ] `POST /register` — email format, password min 8 chars, username min 3 chars
  - [ ] `POST /login` — email + password required
  - [ ] `POST /posts` — title required, content min length
  - [ ] Create `src/middlewares/validate.middleware.ts` — generic zod schema validator
- [ ] Rate limiting on auth endpoints (prevent brute force)
- [ ] CORS configuration
- [ ] Helmet.js security headers
- [ ] Request logging middleware
- [ ] API documentation (README with all endpoints + example requests/responses)

**✅ Done when:** API is secured and documented

---

## 🧠 Key Mental Models

| Spring Boot | Express/TypeScript |
|-------------|-------------------|
| `@Entity` | `interface User {}` in `types/entities.ts` |
| `@RestController` | `router.get/post/put/delete` + controller |
| `@Service` | `src/services/*.ts` (business logic) |
| `@Repository` | `src/repositories/*.ts` (DB queries) |
| `@Autowired` | `import` at top of file |
| `ResponseEntity<T>` | `res.status(code).json(data)` |
| `@PathVariable` | `req.params.id` |
| `@RequestParam` | `req.query.page` |
| `@RequestBody` | `req.body` |
| `@PreAuthorize` | `requireAuth` + `requireRole` middlewares |
| `@RestControllerAdvice` | Last `app.use()` error handler |
| `SecurityContextHolder` | `req.user` from auth middleware |
| `Page<T>` | `PageResponse<T>` utility |
| `HttpStatus.CREATED` | `res.status(201)` |
| `HttpStatus.NO_CONTENT` | `res.status(204).send()` on delete |

---

## 🦆 Rubber Duck Debugging

> When stuck: Don't Google randomly.
> Ask: **"How did Spring Boot do this?"** then search **"how to do X in Express"**.
> You're **translating**, not starting over.

---

## 📋 Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 - Setup | ✅ Complete | Project skeleton ready |
| Phase 2 - Database | ✅ Complete | All tables created |
| Phase 3 - Foundation | ⚠️ Partial | Fix typos + add `findById` + create `role.repository.ts` |
| **Phase 4 - Error Handling** | 🔲 **NEXT** | Do this BEFORE auth |
| Phase 5 - Auth | 🔲 Pending | Register + Login + JWT + role assignment |
| Phase 6 - User Profile | 🔲 Pending | |
| Phase 7 - Categories | 🔲 Pending | |
| Phase 8 - Tags | 🔲 Pending | |
| Phase 9 - Posts | 🔲 Pending | Core feature |
| Phase 10 - Pagination | 🔲 Pending | |
| Phase 11 - Polish | 🔲 Pending | |

---

## 🚀 Immediate Next Steps

Before starting Phase 4, finish Phase 3:

1. Fix typos in `src/types/entities.ts`:
   - `categoris` → `categories`
   - `fist` → `first`
   - `date?` → `data?` in `ApiResponse`

2. Add `findById` to `src/repositories/user.repository.ts`

3. Create `src/repositories/role.repository.ts` with `findByName`, `findUserRoles`, `assignRoleToUser`

Then: **Phase 4 (Error Handling) → Phase 5 (Auth)**. Don't skip the order. ✨
