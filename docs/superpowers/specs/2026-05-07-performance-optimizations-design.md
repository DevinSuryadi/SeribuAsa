# Performance Optimizations Design

Date: 2026-05-07
Scope: FastAPI backend performance fixes (no async DB refactor)

## Goals
- Remove per-request DB role lookups for authenticated users.
- Make product/order/admin list endpoints scale via SQL pagination.
- Eliminate N+1 query patterns in order detail and cancellation.
- Prevent blocking event loop when calling Midtrans.

## Non-Goals
- Full async SQLAlchemy migration.
- Redis caching or distributed cache.
- Schema changes or new tables.

## Current Bottlenecks (Summary)
1. Auth middleware resolves role via DB on every request.
2. Product and order list endpoints ignore pagination.
3. Admin list endpoints pull entire tables then filter in Python.
4. Midtrans sync calls block async endpoints.
5. N+1 queries in order detail and cancellation.

## Design Overview

### 1) Auth Role Resolution (JWT-first)
- Use role from Supabase token payload (user_metadata/app_metadata).
- Only hit DB when role missing or invalid.
- Dev-mode paths continue to use mock roles.

**Data Flow**
1. `supabase_auth.extract_user_info` reads role from token payload (`user_metadata.role` or `app_metadata.role`).
2. `get_current_user` validates the role is in allowed roles and uses it directly.
3. If role is missing/invalid, fallback to `_resolve_role_from_db`.

**Role Mismatch Behavior**
- If token role is present but DB role differs:
  - Production: set `AuthenticatedUser.role` to the DB role (authoritative) and log a warning.
  - Dev mode: accept token role to preserve developer workflow.

**Failure Behavior**
- If DB lookup fails in production, return 401 (avoid granting access with unknown role).
- If DB lookup fails in dev mode, fallback to `donor` and log warning.

### 2) Product & Order Pagination
- Add `page` and `page_size` to service-layer query functions.
- Apply `offset` and `limit` before `.all()`.
- Keep total count separate using existing `count` functions.

**Response Contract**
- Product list: `{ items, total, page, page_size, total_pages }` (existing response type).
- Order list: `{ items, total, page, page_size, total_pages }` (existing response type).

**Edge Cases**
- `page` less than 1 rejected by schema.
- `page_size` capped by schema limits.
- `page` beyond `total_pages` returns an empty `items` list with valid `total`.

### 3) Admin List Pagination & SQL Filtering
- Move search/status filters into SQL query conditions.
- Replace Python list filtering with DB `WHERE` clauses.
- Apply `offset`/`limit` at SQL level.
- `total` uses `count()` before pagination.

Endpoints targeted:
- `GET /admin/users`
- `GET /admin/users/approvals`
- `GET /admin/donations`
- `GET /admin/beneficiaries/eligibility`

**Allocation Status Mapping**
- `pending_payment`: donation.status == pending
- `failed`: donation.status == failed
- `refunded`: donation.status == refunded
- `allocated`: donation.status == success AND allocation_count > 0
- `no_eligible_beneficiary`: donation.status == success AND allocation_count == 0

`allocation_count` is derived with precedence:
1. Prefer `wallet_allocations` count per donation if any exist.
2. Otherwise, fall back to legacy `vouchers` count.

### 4) Midtrans Calls (non-blocking)
- Wrap synchronous Midtrans SDK calls in `await asyncio.to_thread(...)`.
- Applies to:
  - `MidtransService.create_transaction`
  - `MidtransService.handle_notification`

**Error Handling**
- Exceptions raised inside `to_thread` are propagated and handled the same as current code paths.
- If `asyncio.to_thread` raises `CancelledError`, log and re-raise to preserve request cancellation semantics.

### 5) N+1 Query Fixes in Orders
- Eager-load product for order items:
  - `joinedload(Order.items).joinedload(OrderItem.product)`
- Cancel flow: bulk fetch products for all items and update stock without per-item query.

**Transaction & Concurrency Notes**
- Stock updates occur within the existing transaction of `update_order_status`.
- Bulk load products into a map `{product_id: Product}` and update in-memory; commit once.
- Missing products are skipped with a warning (matches current behavior of silently skipping when product not found).
- No row-level locking added in this change (same behavior as current). If concurrent updates become an issue, add `SELECT ... FOR UPDATE` in a follow-up.

## Integration Points
- Auth: `app/middleware/auth.py`, `app/services/supabase_auth.py`
- Pagination: `app/services/product_service.py`, `app/services/order_service.py`, `app/api/products.py`, `app/api/orders.py`
- Admin: `app/api/admin.py`
- Midtrans: `app/services/midtrans_service.py`, `app/api/donations.py`
- Orders: `app/services/order_service.py`, `app/api/orders.py`

## Testing Plan
- Run `pytest tests/` after changes.
- Verify list endpoints respect `page`/`page_size`.
- Verify order detail includes product names without extra queries.
- Verify Midtrans paths still return correct responses (mocked tests if available).
- Negative tests: invalid `page_size`, Midtrans failure path.

## Rollout / Risk
- Changes are localized and backward compatible with existing API responses.
- No schema migrations required.
- Performance improvements expected immediately after deploy.
