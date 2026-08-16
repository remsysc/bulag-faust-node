# Sprint Plan — Bulagfaust

> Derived from: SPEC.md v1.0 | Date: 2026-08-13
> Every task traces to a requirement ID. Tasks without one are marked SETUP.

## Overview

| Sprint | Goal | Requirements | Est. Size |
|--------|------|--------------|-----------|
| 1 | Pagination + Tag fixes | FR-24, FR-25, FR-39–FR-42, FR-12–FR-14 | M |
| 2 | Post PATCH + Slugs | FR-19, FR-21b, FR-27–FR-29 | M |
| 3 | Response envelope | FR-36–FR-38 | M |
| 4 | Refresh tokens + Logout | FR-30–FR-33 | L |
| 5 | Rate limiting + Security | FR-34–FR-35, FR-20 (Helmet/CORS) | S |
| 6 | API tests | FR-21 (PRD) | L |

---

## Sprint 1 — Pagination + Tag Soft-Deactivation

**Demoable outcome:** All list endpoints return paginated responses with metadata. Tags can be deactivated by any authenticated user (no longer admin-only). Inactive tags are excluded from list queries.

**Requirements covered:** FR-24, FR-25, FR-12, FR-13, FR-14, FR-39, FR-40, FR-41, FR-42

### Tasks

- [ ] FR-24.1 — Wire pagination into category repository using `prisma-extension-pagination` (S)
- [ ] FR-24.2 — Wire pagination into tag repository using `prisma-extension-pagination` (S)
- [ ] FR-24.3 — Ensure all list endpoints accept `page`, `limit`, `sortField`, `sortDir` query params (S)
- [ ] FR-25.1 — Return paginated response shape `{ data, meta: { currentPage, totalCount, totalPages, isFirstPage, isLastPage } }` from all list endpoints (M)
- [ ] FR-39.1 — Add migration: `is_active Boolean @default(true)` to Tag model (S)
- [ ] FR-13.1 — Update `tag.routes.ts`: remove `requireRole('ROLE_ADMIN')` from POST and DELETE, use `authenticateToken` only (S)
- [ ] FR-40.1 — Implement tag deactivation: set `isActive = false` when no posts reference the tag (M)
- [ ] FR-41.1 — Reject tag deactivation with 409 when posts still reference the tag (S)
- [ ] FR-42.1 — Update tag list queries to filter by `isActive = true` by default (S)

### Definition of Done

- [ ] `GET /api/v1/category` returns `{ data: [...], meta: { currentPage, totalCount, totalPages, isFirstPage, isLastPage } }`
- [ ] `GET /api/v1/tag` returns same shape, only active tags
- [ ] `GET /api/v1/post` returns same shape
- [ ] `DELETE /api/v1/tag/:id` with no referencing posts → 200, tag is inactive
- [ ] `DELETE /api/v1/tag/:id` with referencing posts → 409
- [ ] Any authenticated user (not just admin) can create and deactivate tags

### Depends on

- Nothing (pagination infra already exists in post repository)

---

## Sprint 2 — Post PATCH + Slugs

**Demoable outcome:** Posts can be partially updated via PATCH (owner only). Every post has an auto-generated URL slug. Posts are fetchable by slug.

**Requirements covered:** FR-19, FR-21b, FR-27, FR-28, FR-29

### Tasks

- [ ] FR-27.1 — Add migration: `slug String @unique` to Post model (S)
- [ ] FR-27.2 — Implement slug generation utility: lowercase, hyphens, strip special chars (S)
- [ ] FR-28.1 — Handle slug collisions: append numeric suffix until unique (M)
- [ ] FR-27.3 — Auto-generate slug on post creation, store in DB (S)
- [ ] FR-29.1 — Add `GET /api/v1/post/slug/:slug` route with visibility rules (M)
- [ ] FR-19.1 — Add `PATCH /api/v1/post/:postId` route (M)
- [ ] FR-19.2 — Implement partial update service: only update provided fields (M)
- [ ] FR-21b.1 — Enforce ownership check on PATCH (return 404 if not owner) (S)
- [ ] FR-19.3 — Regenerate slug if title changes on PATCH (with collision handling) (S)
- [ ] FR-19.4 — Add Zod schema for PATCH body (all fields optional, but min constraints still apply when present) (S)

### Definition of Done

- [ ] `POST /api/v1/post` returns post with auto-generated `slug` field
- [ ] `GET /api/v1/post/slug/my-post-title` returns the post (visibility rules applied)
- [ ] Duplicate titles generate `my-post-title-2`, `my-post-title-3`, etc.
- [ ] `PATCH /api/v1/post/:id` with `{ title: "New Title" }` updates only title + regenerates slug
- [ ] PATCH by non-owner returns 404
- [ ] PATCH by unauthenticated returns 401

### Depends on

- Sprint 1 (response envelope shape used in responses, but not strictly blocking — can work in parallel if needed)

---

## Sprint 3 — Consistent Response Envelope

**Demoable outcome:** Every endpoint in the API returns a consistent response shape. Lists return `{ data, meta }`, singles return `{ data }`, errors return `{ message, statusCode }`.

**Requirements covered:** FR-36, FR-37, FR-38

### Tasks

- [ ] FR-36.1 — Create response helper: `sendList(res, data, meta)` (S)
- [ ] FR-37.1 — Create response helper: `sendOne(res, data, statusCode?)` (S)
- [ ] FR-38.1 — Verify error handler already outputs `{ message, statusCode }` shape (S)
- [ ] FR-36.2 — Refactor category controller to use `sendList` (S)
- [ ] FR-36.3 — Refactor tag controller to use `sendList` (S)
- [ ] FR-36.4 — Refactor post controller to use `sendList` / `sendOne` (S)
- [ ] FR-37.2 — Refactor auth controller to use `sendOne` for token responses (S)
- [ ] FR-37.3 — Refactor user controller to use `sendOne` (S)
- [ ] SETUP-1 — Audit all endpoints for response shape consistency (S)

### Definition of Done

- [ ] Every list endpoint returns `{ data: T[], meta: { currentPage, totalCount, totalPages, isFirstPage, isLastPage } }`
- [ ] Every single-resource endpoint returns `{ data: T }`
- [ ] Every error returns `{ message: string, statusCode: number }`
- [ ] No endpoint returns a bare object or array at the top level

### Depends on

- Sprint 1 (pagination meta shape must be finalized first)

---

## Sprint 4 — Refresh Tokens + Logout

**Demoable outcome:** Login returns access + refresh token pair. Users can refresh their session without re-authenticating. Token rotation prevents theft. Logout invalidates all sessions.

**Requirements covered:** FR-30, FR-31, FR-32, FR-33

### Tasks

- [ ] FR-30.1 — Add migration: `refresh_tokens` table (id, userId FK, tokenHash, expiresAt, revokedAt, createdAt) (S)
- [ ] FR-30.2 — Update register + login to return `{ accessToken, refreshToken }` (M)
- [ ] FR-30.3 — Generate refresh token (random bytes → hash stored in DB, raw value returned to client) (M)
- [ ] FR-31.1 — Add `POST /api/v1/auth/refresh` route + controller + service (M)
- [ ] FR-31.2 — Validate refresh token: look up by hash, check not expired, check not revoked (M)
- [ ] FR-32.1 — Implement token rotation: revoke old token, issue new pair on refresh (M)
- [ ] FR-32.2 — Implement theft detection: if a revoked token is reused, invalidate ALL tokens for that user (L)
- [ ] FR-33.1 — Add `POST /api/v1/auth/logout` route (requires auth) (S)
- [ ] FR-33.2 — Revoke all refresh tokens for the authenticated user on logout (S)
- [ ] FR-30.4 — Update auth Zod schemas for new response shapes (S)

### Definition of Done

- [ ] Login returns `{ data: { accessToken, refreshToken } }`
- [ ] `POST /api/v1/auth/refresh` with valid token returns new token pair
- [ ] `POST /api/v1/auth/refresh` with expired/revoked token returns 401
- [ ] Reusing a previously-rotated token invalidates all user tokens (theft detection)
- [ ] `POST /api/v1/auth/logout` with valid auth → 204, all refresh tokens revoked
- [ ] Old access tokens still work until they expire naturally (stateless)

### Depends on

- Sprint 3 (response envelope for token responses)

---

## Sprint 5 — Rate Limiting + Security Headers

**Demoable outcome:** Auth endpoints are protected from brute-force. Security headers and CORS are configured.

**Requirements covered:** FR-34, FR-35, PRD FR-20

### Tasks

- [ ] SETUP-1 — Install `express-rate-limit` and `helmet` (S)
- [ ] FR-34.1 — Configure rate limiter: 5 attempts per 15 min per IP on login + register (S)
- [ ] FR-35.1 — Return 429 with `Retry-After` header when limit exceeded (S)
- [ ] FR-34.2 — Apply rate limiter middleware to auth routes only (S)
- [ ] SETUP-2 — Configure Helmet middleware (default security headers) (S)
- [ ] SETUP-3 — Configure CORS (allow configurable origins via env var) (S)

### Definition of Done

- [ ] 6th login attempt within 15 min from same IP returns 429
- [ ] Response includes `Retry-After` header
- [ ] `GET /health` response headers include security headers (X-Content-Type-Options, etc.)
- [ ] Cross-origin requests from allowed origin succeed; others are rejected

### Depends on

- Sprint 4 (rate limiter applies to refresh endpoint too)

---

## Sprint 6 — API Integration Tests

**Demoable outcome:** Full test suite verifying the API contract. Any breaking change is caught immediately.

**Requirements covered:** PRD FR-21 (testing strategy)

### Tasks

- [ ] SETUP-1 — Install Vitest + Supertest (S)
- [ ] SETUP-2 — Configure test database (separate from dev), add `npm test` script (M)
- [ ] SETUP-3 — Create test utilities: app factory, DB seed/reset helpers, auth token helper (M)
- [ ] TEST-1 — Auth tests: register (success, duplicate email, duplicate username, validation), login (success, wrong password, wrong email) (L)
- [ ] TEST-2 — RBAC tests: protected route without token → 401, without role → 403, non-owner → 404 (M)
- [ ] TEST-3 — Post visibility tests: unauthenticated sees published only, owner sees own drafts, admin cannot see others' drafts (M)
- [ ] TEST-4 — Post CRUD tests: create, PATCH, DELETE (ownership), slug generation, slug fetch (M)
- [ ] TEST-5 — Category CRUD tests: admin creates/updates/deletes, non-admin gets 403, public reads (M)
- [ ] TEST-6 — Tag tests: any auth user creates, deactivation logic (unreferenced → inactive, referenced → 409) (M)
- [ ] TEST-7 — Pagination tests: verify meta shape, default limit, custom page/limit (S)
- [ ] TEST-8 — Refresh token tests: refresh, rotation, theft detection, logout (M)
- [ ] TEST-9 — Rate limiting tests: verify 429 after threshold (S)

### Definition of Done

- [ ] `npm test` runs full suite and passes
- [ ] Every endpoint has at least one happy-path and one error-path test
- [ ] Auth/RBAC boundaries tested (401, 403, ownership 404)
- [ ] Post visibility matrix verified (unauthenticated, non-owner, owner, admin)
- [ ] Suite runs in < 30s
- [ ] Tests use a separate database, never touch dev data

### Depends on

- Sprint 5 (all features must be implemented before full integration testing)

---

## Sequencing Notes

- Sprints 1 and 2 can run in parallel if needed — they touch different areas (tags/pagination vs posts/slugs).
- Sprint 3 is a refactor sprint with no new features — can be done anytime after Sprint 1 but before Sprint 6 (tests assert the final response shape).
- Sprint 6 must be last — it tests the complete API contract.
