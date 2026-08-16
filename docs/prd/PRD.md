# PRD — Bulagfaust (Blog/CMS REST API)

> Status: Active | Date: 2026-08-13 | Owner: Rem | Type: Improved Reimplementation

## 1. Problem Statement

The original Spring Boot blog API works, but it suffers from typical Spring boilerplate: verbose DTOs, implicit pagination magic, inconsistent error responses, and a god-mode admin pattern that leaks user privacy. This TypeScript/Express reimplementation aims to **surpass** the original — not just port it, but fix its design flaws and deliver a cleaner, more secure, and more developer-friendly API.

## 2. Goals

### Primary: Build a better blog API than the Spring version

| Area | Spring Version Problem | This Version's Improvement |
|------|----------------------|---------------------------|
| **Pagination** | Implicit `Pageable` magic, hard to customize | Explicit pagination via `prisma-extension-pagination` — library-backed, configurable, transparent |
| **Validation** | Separate DTO classes + annotations + `@Valid` | Zod schemas that validate AND produce TypeScript types — no duplication |
| **Error responses** | Verbose, inconsistent without `@ControllerAdvice` boilerplate | Standardized `{ message, statusCode }` on every error, custom exception classes |
| **Post privacy** | Admin god-mode sees all drafts | Privacy-first: drafts are private to the author only, even from admin |
| **Tag management** | Hard-delete or cascade orphans | Soft-deactivation: reject delete if referenced, deactivate if unused |
| **API response shape** | Inconsistent per-endpoint | Consistent envelope: `{ data, meta }` for lists, `{ data }` for singles |
| **Auth** | Session-based (Sanctum/Spring Security) | Stateless JWT with refresh token rotation |
| **Search** | Requires Elasticsearch setup | Built-in case-insensitive search on title + content via Prisma |
| **URL design** | Numeric IDs in URLs | UUID PKs + SEO-friendly post slugs |
| **Rate limiting** | Requires Spring Cloud Gateway | Simple middleware (`express-rate-limit`) on auth endpoints |

### Secondary

- Serve as a personal reference for future TypeScript/Express projects.
- Maintain clean architecture (controller → service → repository) for readability.
- Keep the Spring ↔ Express mental model mapping documented for learning.

## 3. Non-Goals (Out of Scope)

- **Frontend/UI** — pure REST API backend.
- **File uploads** — post content is text only.
- **Email/notifications** — no transactional email or push.
- **OAuth/social login** — JWT-only auth.
- **Elasticsearch** — built-in Prisma search is sufficient.
- **Caching layer** — no Redis at demo scale.
- **CI/CD pipeline** — local development only.
- **Multi-tenancy** — single-tenant platform.

## 4. Target Users

### Regular User (ROLE_USER)

- **Can:** register, log in, create/edit/delete own posts, attach categories and tags to own posts, view published posts from other users, create tags.
- **Can't:** manage categories, manage other users' posts, access admin-only endpoints.
- **Primary workflow:** write blog posts, tag/categorize them, manage own content.

### Admin (ROLE_ADMIN)

- **Can:** everything a regular user can, plus: create/update/delete categories, manage users, deactivate tags.
- **Can't:** view other users' draft posts, edit/delete other users' posts (privacy boundary).
- **Primary workflow:** manage the content taxonomy (categories), administer the platform.

### RBAC Summary

| Capability | Unauthenticated | ROLE_USER | ROLE_ADMIN |
|---|---|---|---|
| Register / Login | ✅ | ✅ | ✅ |
| View own profile | ❌ | ✅ | ✅ |
| View published posts | ✅ | ✅ | ✅ |
| Create / Edit / Delete own posts | ❌ | ✅ | ✅ |
| View own draft posts | ❌ | ✅ | ✅ |
| View other users' draft posts | ❌ | ❌ | ❌ |
| Edit / Delete other users' posts | ❌ | ❌ | ❌ |
| Create / Edit / Delete categories | ❌ | ❌ | ✅ |
| Create tags | ❌ | ✅ | ✅ |
| Deactivate tags | ❌ | ✅ (if unreferenced) | ✅ (if unreferenced) |
| Manage users | ❌ | ❌ | ✅ |

## 5. User Stories

- As a user, I want to register with a username, email, and password so that I can create an account and start blogging.
- As a user, I want to log in and receive access + refresh tokens so that my session persists securely without re-authentication.
- As a user, I want to create a blog post with a title, content, status (draft/published), categories, and tags so that I can publish my writing.
- As a user, I want my posts to have auto-generated URL slugs so that they're SEO-friendly and shareable.
- As a user, I want to edit or delete my own posts so that I can maintain my content.
- As a user, I want to browse published posts with pagination, filtering (by category/tag/author), sorting, and search so that I can discover content efficiently.
- As a user, I want to view my own posts regardless of status so that I can manage my unpublished work.
- As a user, I want to create tags so that my posts have flexible, organic labels for discoverability.
- As an admin, I want to create, update, and delete categories so that posts are organized into a curated taxonomy.
- As an admin, I want to manage user accounts so that I can administer the platform.

## 6. Functional Requirements

### Core (Parity with Spring — done)

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-1 | Users can register with username, email, and password. System assigns ROLE_USER. | P0 | ✅ Done |
| FR-2 | Users can log in with email + password and receive a signed JWT. | P0 | ✅ Done |
| FR-3 | Protected routes require a valid Bearer token. Invalid/expired → 401. | P0 | ✅ Done |
| FR-4 | Role-guarded routes return 403 if the user's role is insufficient. | P0 | ✅ Done |
| FR-5 | Admin can perform full CRUD on Category. Any user can read. | P0 | ✅ Done |
| FR-6 | Authenticated users can create Posts with title, content, status, categories, tags. | P0 | ✅ Done |
| FR-7 | Post owners can update and soft-delete their own posts. Non-owners receive 403. | P0 | ✅ Done |
| FR-8 | Users can view their own profile via `GET /api/v1/user/me`. | P0 | ✅ Done |

### Improvements over Spring

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-10 | Post visibility: published posts are public; drafts are private to the author only. Admin has NO visibility over other users' drafts. | P0 | ✅ Resolved |
| FR-11 | Tags are user-generated. Delete sets inactive (if unreferenced) or rejects (if posts still use it). No hard-delete. | P0 | 🔲 Schema change needed |
| FR-12 | All list endpoints support pagination via `prisma-extension-pagination` with page, limit, total count, and page metadata. | P0 | 🔲 In progress |
| FR-13 | Post list supports filtering by categoryId, tagId, authorId, status, and full-text search on title + content. | P0 | ✅ Partial |
| FR-14 | Posts auto-generate a unique URL slug from the title. | P1 | 🔲 Not started |
| FR-15 | All request input validated via Zod schemas. Types inferred from schemas — no separate DTO classes. | P0 | ✅ Done |
| FR-16 | Consistent API response envelope: `{ data, meta }` for lists, `{ data }` for singles, `{ message, statusCode }` for errors. | P1 | 🔲 Not started |
| FR-17 | Refresh token rotation: short-lived access token + long-lived refresh token. `POST /api/v1/auth/refresh`. | P1 | 🔲 Not started |
| FR-18 | Rate limiting on auth endpoints (register, login, refresh). | P2 | 🔲 Not started |
| FR-19 | PATCH endpoint for posts (partial update with ownership check). | P0 | 🔲 Not started |
| FR-20 | Security headers (Helmet) and CORS configuration. | P2 | 🔲 Not started |
| FR-21 | API integration tests for all endpoints. Tests verify status codes, response shapes, auth/RBAC enforcement, and ownership rules against a test database. Breaking changes caught immediately. | P1 | 🔲 Not started |

## 7. Non-Functional Requirements

- **Auth:** Stateless JWT (access + refresh tokens). No server-side session store.
- **Data integrity:** Posts use soft-delete. Tags use soft-deactivation. Categories use hard delete with cascade on join tables.
- **Stack:** TypeScript, Express 5, Prisma, PostgreSQL 16, Zod. Minimal dependencies with clear purpose.
- **Error handling:** Global error handler. All errors are structured JSON `{ message, statusCode }`.
- **Pagination:** Library-backed (`prisma-extension-pagination`). Default 10 per page, configurable.
- **Scale:** Demo/portfolio scale. No specific throughput targets.

## 8. Testing Strategy

### Why

No test coverage means regressions are invisible until they hit runtime. As endpoints grow (ownership checks, soft-delete, visibility rules, tag deactivation), manual testing becomes unreliable. API tests catch breaking changes immediately — if a response shape, status code, or auth rule changes unexpectedly, the test suite fails.

### Scope

| Layer | What to test | Priority |
|-------|-------------|----------|
| **API (integration)** | Full HTTP request/response against a test database: status codes, response shapes, auth enforcement, ownership rules, pagination contracts | P0 |
| **Auth flows** | Register → login → access protected route → refresh → token expiry | P0 |
| **Services** | Complex business logic only (visibility filtering, tag deactivation decision) | P1 |

### Approach

- **API tests** send real HTTP requests to the running app with a test database. They verify the contract: correct status codes, response body shape, error envelopes, and auth/RBAC enforcement.
- **Test runner:** Vitest (fast, native TypeScript, ESM-compatible).
- **HTTP client:** Supertest — sends requests directly to the Express app without needing a running server.
- **Test database:** Separate PostgreSQL database — never the dev database. Seeded/reset between test suites.
- **Focus:** Catch breaking changes to the API contract. If a refactor doesn't break the API, the tests should still pass.

### What NOT to test

- Prisma-generated types or query internals (trust the ORM).
- Individual controller/repository functions in isolation (covered by API tests).
- Third-party library internals.

### Success Criteria

- Every endpoint has at least one happy-path and one error-path API test.
- Auth and RBAC boundaries are tested (401 without token, 403 without role, 403 on non-owned resource).
- Post visibility rules are tested (drafts invisible to non-owners, including admin).
- Tests run fast enough to use during development (< 30s for full suite).
- A breaking change to any endpoint is caught before it ships.

## 9. Success Metrics

- Every improvement in the §2 table is demonstrably better than the Spring version.
- Pagination, filtering, sorting, and search work on all list endpoints.
- Post privacy is enforced — no user (including admin) can see another user's drafts.
- Tag lifecycle is correct — no orphans, no data loss.
- API responses are consistent across all endpoints.
- The codebase is clean enough to serve as a portfolio piece and personal reference.

## 10. Assumptions & Open Questions

- ✅ Resolved: Prisma ORM with module-based structure (`src/modules/`).
- ✅ Resolved: Post visibility — privacy-first. Drafts private to author. Admin has no override.
- ✅ Resolved: Tags are user-generated with soft-deactivation. No hard-delete.
- ✅ Resolved: Pagination via `prisma-extension-pagination` (offset-based with page count).
- 🔲 Open: Slug collision strategy — append counter (`my-post-2`) or reject with 409?
- 🔲 Open: Refresh token storage — database table or in-memory (demo-only)?
- 🔲 Open: Rate limit thresholds (e.g., 5 login attempts per 15 min?).
- Open self-registration is a demo simplification.

## 11. Risks

- **Risk:** Post visibility logic drifts between list and detail endpoints. — *Mitigation:* single query helper in repository layer.
- **Risk:** Tag soft-deactivation adds complexity to queries. — *Mitigation:* default `where: { isActive: true }` filter in tag repository.
- **Risk:** Refresh token implementation without proper rotation can be insecure. — *Mitigation:* rotate on every use, store token hash in DB, invalidate on logout.
- **Risk:** Slug uniqueness under concurrent post creation. — *Mitigation:* unique DB constraint + retry with counter suffix.
- **Risk:** No tests mean regressions go unnoticed. — *Mitigation:* Testing strategy defined in §8; services and auth are P0 coverage targets.
