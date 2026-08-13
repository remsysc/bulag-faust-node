# SPEC — Bulagfaust (Blog/CMS REST API)

> Status: Active | Date: 2026-08-13 | Source PRD: [PRD.md](../prd/PRD.md) | Binding for all implementation sessions

This spec is the source of truth for implementation. Where code and spec disagree, that's a bug — fix whichever side is wrong and log it in the Changelog (§9). Where this spec doesn't cover a case, stop and flag it rather than guessing.

---

## 1. Scope of This Spec

Covers the implemented core functionality and defines the improvement requirements that differentiate this project from the original Spring Boot version. Do not implement unspecified behavior — flag it first.

### 1.1 Implementation Status

| Area | Description | Status |
|---|---|---|
| Core Auth | Register, login, JWT, auth middleware | ✅ Done |
| User Profile | GET /me, GET /:userId | ✅ Done |
| Category CRUD | Admin-only writes, public reads | ✅ Done |
| Tag CRUD | User-generated, reads | ✅ Done (needs soft-deactivation) |
| Post CRUD | Create, soft-delete, ownership, visibility | ✅ Done (needs PATCH route) |
| Pagination | `prisma-extension-pagination` wired | 🟡 In progress |
| Post slugs | Auto-generated URL slugs | 🔲 Not started |
| Response envelope | Consistent `{ data, meta }` shape | 🔲 Not started |
| Refresh tokens | Access + refresh token rotation | 🔲 Not started |
| Rate limiting | Auth endpoint throttling | 🔲 Not started |
| Security headers | Helmet + CORS | 🔲 Not started |

---

## 2. Requirements (EARS Syntax)

### Auth & Roles (Phase 6 — implemented)

- **FR-1** THE SYSTEM SHALL allow account creation via `POST /api/v1/auth/register` with `username` (min 5, alphanumeric + underscore), `email` (valid format), and `password` (min 8 chars).
- **FR-2** WHEN registration succeeds THE SYSTEM SHALL create the user, assign `ROLE_USER` via the `user_roles` join table, and return a signed JWT containing `{ userId, email, roles: ['ROLE_USER'] }`.
- **FR-3** WHEN registration fails due to duplicate email THE SYSTEM SHALL return 409 with a `DuplicateResourceException` identifying the conflicting field.
- **FR-4** WHEN registration fails due to duplicate username THE SYSTEM SHALL return 409 with a `DuplicateResourceException` identifying the conflicting field.
- **FR-5** THE SYSTEM SHALL authenticate users via `POST /api/v1/auth/login` with `email` and `password`, returning a signed JWT on success.
- **FR-6** WHEN login credentials are invalid (wrong email or wrong password) THE SYSTEM SHALL return 401 `UnauthorizedException` with message "Invalid credentials" — without revealing which field was wrong.
- **FR-7** WHILE a route uses `authenticateToken` middleware THE SYSTEM SHALL extract the Bearer token from the Authorization header, verify it against `JWT_SECRET`, and attach the decoded payload to `req.user`. If missing/invalid/expired, return 401.
- **FR-8** WHILE a route uses `requireRole(roleName)` middleware THE SYSTEM SHALL check `req.user.roles.includes(roleName)` and return 403 `ForbiddenException` if the check fails.

### Category (Phase 8 — implemented)

- **FR-9** THE SYSTEM SHALL support full CRUD on Category via `/api/v1/category`.
- **FR-10** THE SYSTEM SHALL restrict Category write operations (POST, PUT, DELETE) to users with `ROLE_ADMIN`. Any user (including unauthenticated) can read categories.
- **FR-11** WHEN a Category is deleted THE SYSTEM SHALL hard-delete the record. Related `PostCategory` rows are cascade-deleted via the Prisma schema.

### Tag (Phase 9 — implemented)

- **FR-12** THE SYSTEM SHALL support create (POST) on Tag via `/api/v1/tag`. Delete (DELETE) SHALL NOT hard-delete the tag — instead:
  - IF the tag has no posts referencing it THEN THE SYSTEM SHALL set the tag to inactive (soft-deactivation).
  - IF the tag still has posts referencing it THEN THE SYSTEM SHALL reject the delete request with 409 (Conflict) indicating the tag is still in use.
- **FR-13** THE SYSTEM SHALL allow any authenticated user to create Tags. Tags are user-generated for flexible post reach — unlike categories which are admin-curated. Any authenticated user can request tag deactivation (subject to the referencing rules above).
- **FR-14** ANY user (including unauthenticated) SHALL be able to read active tags via GET endpoints. Inactive tags are excluded from list queries but remain valid historical references on existing posts.

### Post (Phase 10 — implemented)

- **FR-15** THE SYSTEM SHALL allow authenticated users to create Posts via `POST /api/v1/post` with `title` (min 5), `content` (min 10), optional `categoryIds` (UUID array), and optional `tagIds` (UUID array).
- **FR-16** THE SYSTEM SHALL set `authorId` from the authenticated user's JWT payload — never from client input.
- **FR-17** THE SYSTEM SHALL default post status to `"draft"` unless explicitly set.
- **FR-18** WHEN a Post is deleted THE SYSTEM SHALL soft-delete it by setting `deletedAt` to the current timestamp. Soft-deleted posts are excluded from all queries.
- **FR-19** THE SYSTEM SHALL enforce post ownership on update and delete: only the author (matched by `authorId`) can modify their own posts.
- **FR-20** WHEN fetching a single post THE SYSTEM SHALL apply visibility rules: published posts are visible to everyone; non-published posts are only visible to their author. Admin does NOT have special visibility over other users' non-published posts — this is a deliberate privacy boundary. Non-visible posts return 404 (not 403, to avoid leaking existence).
- **FR-21** THE SYSTEM SHALL support optional authentication on post list and detail endpoints (`optionalAuthenticateToken`) to enable ownership-aware visibility without requiring login for public content.
- **FR-21b** THE SYSTEM SHALL enforce post ownership on edit and delete: only the post's author can modify or delete their own post. No other user — including admin — can edit or delete another user's post.

### User Profile (Phase 7 — implemented)

- **FR-22** THE SYSTEM SHALL return the authenticated user's profile via `GET /api/v1/user/me` (requires auth).
- **FR-23** THE SYSTEM SHALL return a public user profile via `GET /api/v1/user/:userId` (no auth required, no password exposed).

### Pagination (Phase 11 — not yet started)

- **FR-24** ALL list endpoints SHALL accept `page` (default 1), `limit` (default 10), `sortField` (optional), and `sortDir` (optional, "asc" | "desc") query parameters.
- **FR-25** THE SYSTEM SHALL return paginated responses with metadata: `{ data: [...], meta: { page, limit, total, totalPages } }`.

### Post Filtering (Phase 10 — partial)

- **FR-26** THE SYSTEM SHALL support filtering posts by `userId` (authorId), `categoryId`, `tagId`, `status`, and `search` query parameters on the list endpoint.

### Improvements Over Spring (new requirements)

#### Post Slugs

- **FR-27** WHEN a Post is created THE SYSTEM SHALL auto-generate a URL slug from the title (lowercase, hyphens, strip special chars). The slug SHALL be stored in a `slug` column with a unique constraint.
- **FR-28** IF a slug collision occurs THE SYSTEM SHALL append a numeric suffix (e.g. `my-post-2`, `my-post-3`) until unique.
- **FR-29** THE SYSTEM SHALL support fetching posts by slug via `GET /api/v1/post/slug/:slug` as an alternative to UUID lookup.

#### Refresh Tokens

- **FR-30** WHEN login succeeds THE SYSTEM SHALL return both an `accessToken` (short-lived, e.g. 15 min) and a `refreshToken` (long-lived, e.g. 7 days).
- **FR-31** THE SYSTEM SHALL support `POST /api/v1/auth/refresh` accepting a `refreshToken` in the body and returning a new `accessToken` + rotated `refreshToken`.
- **FR-32** WHEN a refresh token is used THE SYSTEM SHALL invalidate the old token and issue a new one (rotation). Reuse of an already-rotated token SHALL invalidate all tokens for that user (theft detection).
- **FR-33** WHEN a user logs out THE SYSTEM SHALL invalidate all refresh tokens for that user.

#### Rate Limiting

- **FR-34** THE SYSTEM SHALL rate-limit `POST /api/v1/auth/login` and `POST /api/v1/auth/register` to prevent brute-force attacks. Default: 5 attempts per 15 minutes per IP.
- **FR-35** WHEN rate limit is exceeded THE SYSTEM SHALL return 429 Too Many Requests with a `Retry-After` header.

#### Consistent Response Envelope

- **FR-36** ALL successful list responses SHALL use the shape: `{ data: T[], meta: { currentPage, totalCount, totalPages, isFirstPage, isLastPage } }`.
- **FR-37** ALL successful single-resource responses SHALL use the shape: `{ data: T }`.
- **FR-38** ALL error responses SHALL use the shape: `{ message: string, statusCode: number }`.

#### Tag Soft-Deactivation (schema change required)

- **FR-39** THE SYSTEM SHALL add an `isActive` boolean (default `true`) to the Tag model.
- **FR-40** WHEN a tag deactivation is requested AND no posts reference the tag THE SYSTEM SHALL set `isActive = false`.
- **FR-41** WHEN a tag deactivation is requested AND posts still reference the tag THE SYSTEM SHALL return 409 Conflict.
- **FR-42** ALL tag list queries SHALL filter by `isActive = true` by default. Inactive tags remain readable on existing posts for historical reference.

---

## 3. Data Models

Full schema defined in `prisma/schema.prisma`. Quick reference:

| Table | PK | Notes |
|---|---|---|
| `users` | `id` UUID | username, email (unique), hashed password |
| `roles` | `id` UUID | name (unique): ROLE_USER, ROLE_ADMIN |
| `user_roles` | composite (userId, roleId) | many-to-many join |
| `posts` | `id` UUID | title, content, status, slug (unique), soft-delete via `deletedAt` |
| `categories` | `id` UUID | name (unique) |
| `tags` | `id` UUID | name (unique), `isActive` boolean (default true) |
| `post_categories` | composite (postId, categoryId) | many-to-many join |
| `post_tags` | composite (postId, tagId) | many-to-many join |
| `refresh_tokens` | `id` UUID | userId FK, tokenHash, expiresAt, revokedAt (nullable) |

### Planned Schema Changes

| Change | Table | Column | Type | Notes |
|---|---|---|---|---|
| Add slug | `posts` | `slug` | `String @unique` | Auto-generated from title |
| Add isActive | `tags` | `is_active` | `Boolean @default(true)` | Soft-deactivation |
| Add refresh_tokens table | `refresh_tokens` | — | — | Token rotation + theft detection |

### Key Constraints

- All primary keys are UUIDs generated by `@default(uuid())`.
- `users.email` and `users.username` have unique constraints.
- `categories.name` and `tags.name` have unique constraints.
- `posts.slug` has a unique constraint.
- `posts.deletedAt` is nullable — non-null means soft-deleted.
- All join tables use `onDelete: Cascade` — removing a post/category/tag cleans up associations.
- Timestamps: `createdAt` (auto), `updatedAt` (auto via `@updatedAt`), mapped to snake_case columns.

---

## 4. API Contracts

### Base Path: `/api/v1`

### Auth

```
POST /api/v1/auth/register
  Auth: none
  Body: { username: string, email: string, password: string }
  Validation: username (min 5, /^[a-zA-Z0-9_]*$/), email (valid), password (min 8)
  201: { data: { accessToken: string, refreshToken: string } }
  409: { message: "User with this email already exists", statusCode: 409 }
  400: { message: string, statusCode: 400, errors: [...] }

POST /api/v1/auth/login
  Auth: none
  Body: { email: string, password: string }
  Validation: email (valid), password (min 8)
  200: { data: { accessToken: string, refreshToken: string } }
  401: { message: "Invalid credentials", statusCode: 401 }
  429: { message: "Too many attempts", statusCode: 429 }

POST /api/v1/auth/refresh
  Auth: none
  Body: { refreshToken: string }
  200: { data: { accessToken: string, refreshToken: string } }
  401: { message: "Invalid or expired refresh token", statusCode: 401 }

POST /api/v1/auth/logout
  Auth: Bearer token (required)
  204: No content (all refresh tokens invalidated)
  401: Unauthenticated
```

### User

```
GET /api/v1/user/me
  Auth: Bearer token (required)
  200: { id, username, email, createdAt, updatedAt }
  401: Unauthenticated

GET /api/v1/user/:userId
  Auth: none
  200: { id, username, email, createdAt }  (no password)
  404: User not found
```

### Category

```
GET /api/v1/category
  Auth: none
  Query: page, limit, sortField, sortDir
  200: { data: Category[], meta: {...} }

GET /api/v1/category/:categoryId
  Auth: none
  200: Category
  404: Category not found
  400: Invalid UUID

POST /api/v1/category
  Auth: Bearer + ROLE_ADMIN
  Body: { name: string }
  201: Category
  403: Forbidden (non-admin)
  409: Duplicate name

PUT /api/v1/category/:categoryId
  Auth: Bearer + ROLE_ADMIN
  Body: { name: string }
  200: Category
  403: Forbidden
  404: Not found

DELETE /api/v1/category/:categoryId
  Auth: Bearer + ROLE_ADMIN
  204: No content
  403: Forbidden
  404: Not found
```

### Tag

```
GET /api/v1/tag
  Auth: none
  Query: page, limit, sortField, sortDir
  200: { data: Tag[], meta: {...} }
  Note: returns only active tags by default

GET /api/v1/tag/:tagId
  Auth: none
  200: Tag
  404: Not found

POST /api/v1/tag
  Auth: Bearer (any authenticated user)
  Body: { name: string }
  201: Tag
  401: Unauthenticated
  409: Duplicate name

DELETE /api/v1/tag/:tagId
  Auth: Bearer (any authenticated user)
  200: Tag (set to inactive) — if no posts reference it
  409: { message: "Tag is still referenced by posts" } — if posts reference it
  401: Unauthenticated
  404: Not found
```

### Post

```
POST /api/v1/post
  Auth: Bearer (any authenticated user)
  Body: { title: string (min 5), content: string (min 10), categoryIds?: string[], tagIds?: string[] }
  201: { data: Post } (with relations, includes auto-generated slug)
  401: Unauthenticated
  400: Validation error

GET /api/v1/post
  Auth: optional Bearer
  Query: page, limit, sortField, sortDir, userId, categoryId, tagId, status, search
  200: { data: Post[], meta: { currentPage, totalCount, totalPages, isFirstPage, isLastPage } }
  Visibility: unauthenticated users see only published posts; authenticated users also see own non-published posts when filtering by their userId.

GET /api/v1/post/:postId
  Auth: optional Bearer
  200: { data: PostWithRelations } (includes author, categories, tags, slug)
  404: Post not found (or not visible to requester)

GET /api/v1/post/slug/:slug
  Auth: optional Bearer
  200: { data: PostWithRelations }
  404: Post not found (or not visible to requester)

PATCH /api/v1/post/:postId
  Auth: Bearer (required, owner only)
  Body: { title?: string, content?: string, categoryIds?: string[], tagIds?: string[] }
  200: { data: PostWithRelations }
  401: Unauthenticated
  404: Not found / not owned

DELETE /api/v1/post/:postId
  Auth: Bearer (required, owner only)
  204: No content (soft-deleted)
  401: Unauthenticated
  404: Post not found (not owned by requester, or doesn't exist)
```

### Health

```
GET /health
  Auth: none
  200: { status: "ok" }
```

---

## 5. Error Handling

All errors extend `AppError(message, statusCode)`. The global `errorHandler` middleware catches them and responds with:

```json
{ "message": "Human-readable error message", "statusCode": 400 }
```

| Exception Class | HTTP Status | When |
|---|---|---|
| `BadRequestException` | 400 | Malformed request / validation failure |
| `UnauthorizedException` | 401 | Missing/invalid/expired JWT |
| `ForbiddenException` | 403 | Role check failed |
| `NotFoundException` | 404 | Resource not found |
| `RouteNotFoundException` | 404 | Unknown route `Cannot ${method} ${path}` |
| `DuplicateResourceException` | 409 | Unique constraint violation |

Unhandled errors (non-AppError) are caught by the error handler and returned as 500 with a generic message.

---

## 6. Authentication & Authorization Flow

```
Request
  → authenticateToken (or optionalAuthenticateToken)
    → Extract Bearer token from Authorization header
    → jwt.verify(token, JWT_SECRET)
    → Attach { userId, email, roles } to req.user
    → If invalid: throw UnauthorizedException (or skip for optional)
  → requireRole('ROLE_ADMIN')
    → Check req.user.roles.includes('ROLE_ADMIN')
    → If missing: throw ForbiddenException
  → Controller
```

### JWT Payload Structure

```typescript
{
  userId: string;   // UUID
  email: string;
  roles: string[];  // e.g. ['ROLE_USER'] or ['ROLE_USER', 'ROLE_ADMIN']
  iat: number;
  exp: number;
}
```

### Token Configuration

- Algorithm: HS256 (jsonwebtoken default)
- Secret: `JWT_SECRET` env var
- Expiry: configurable via `config.jwtExpiresIn`

---

## 7. Validation

All request validation uses Zod schemas processed by the `validate()` middleware. Validation runs before the controller — invalid input never reaches business logic.

### Middleware Pattern

```typescript
validate(schema)  // validates req against schema, throws 400 on failure
useBody(schema)   // wraps schema to validate req.body specifically
```

### Shared Schemas (`common/schemas/common.schemas.ts`)

- `paginationSchema` — page, limit, sortField, sortDir with defaults
- `paramsIdSchema(key)` — validates a named UUID path param
- `usePostListQuery()` — pagination + post-specific filters (userId, categoryId, tagId, status, search)

---

## 8. Edge Cases & Business Rules

### Post Visibility

| Requester | Published Post | Draft Post (own) | Draft Post (other's) |
|---|---|---|---|
| Unauthenticated | ✅ Visible | ❌ 404 | ❌ 404 |
| Authenticated (non-owner) | ✅ Visible | ❌ 404 | ❌ 404 |
| Authenticated (owner) | ✅ Visible | ✅ Visible | ❌ 404 |
| Admin (non-owner) | ✅ Visible | ❌ 404 | ❌ 404 |

> ✅ Resolved: Admin does NOT have special visibility over other users' non-published posts. This is a deliberate privacy decision — each user's drafts are private to them only. Admin's elevated role applies to category/tag/user management, not to reading other users' unpublished content.

### Registration

- Username and email uniqueness are enforced at the database level (unique constraints).
- The system catches Prisma's `P2002` error code and maps it to `DuplicateResourceException` with the specific field.
- Password is hashed with bcrypt (cost factor 10) before storage.
- Role assignment (`ROLE_USER`) happens within the same transaction as user creation.

### Soft Delete (Posts)

- Deleting a post sets `deletedAt = now()` — the row remains in the database.
- All queries must exclude rows where `deletedAt IS NOT NULL`.
- Prisma's `@updatedAt` still fires on soft-delete (because it's technically an update).

### Cascade Behavior

- Deleting a User cascades to: Posts, UserRoles.
- Deleting a Post cascades to: PostCategories, PostTags.
- Deleting a Category cascades to: PostCategories (the association, not the posts).
- Deleting a Tag cascades to: PostTags (the association, not the posts).

---

## 9. Changelog

| Date | Change | Reason |
|---|---|---|
| 2026-08-13 | Initial SPEC created | Document existing implementation |

---

## 10. Known Gaps & TODOs

These are acknowledged gaps between the current implementation and the full specification. They should be resolved in Phases 11–12 or as follow-up work.

| Gap | Impact | Resolution |
|---|---|---|
| Pagination not fully wired | List endpoints may return unbounded results | Phase 11 implementation |
| No PATCH endpoint for posts | Only DELETE is wired in routes; update schema exists but route is missing | Wire `PATCH /api/v1/post/:postId` with ownership check |
| No tests | No automated verification | Phase 12 |
| Rate limiting | Auth endpoints are unprotected from brute force | Phase 12 |
| CORS | Cross-origin requests not configured | Phase 12 |
| Refresh token | No mechanism to extend sessions | Accepted tech debt for demo |
| Tag routes use ROLE_ADMIN | Routes currently restrict tag writes to admin, spec says any authenticated user | Update `tag.routes.ts` to remove `requireRole('ROLE_ADMIN')` from POST and DELETE |
| Tag schema lacks `active` field | No `isActive` / `deletedAt` column on Tag model to support soft-deactivation | Add migration: `is_active Boolean @default(true)` to Tag model, update queries to filter by active |
