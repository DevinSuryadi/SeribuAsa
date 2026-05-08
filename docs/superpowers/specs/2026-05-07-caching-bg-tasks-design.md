# Backend Performance Optimization: Caching & Background Tasks

**Date:** 2026-05-07  
**Scope:** FastAPI backend performance improvements  
**Status:** Design Phase — Ready for Implementation  
**Related:** [Performance Optimizations Design](2026-05-07-performance-optimizations-design.md) (Phase 1 completed)

---

## Executive Summary

After completing Phase 1 optimizations (auth role, pagination, admin SQL filtering, Midtrans async, N+1 fixes), the next highest-impact improvements are **in-memory caching** and **background task processing**. 

This document provides a detailed implementation plan for both options, designed to be executed independently or in parallel.

**Expected Combined Impact:**
- 80-95% reduction in DB query load for read-heavy endpoints
- Payment/webhook response times drop from 500ms-2s to <50ms
- Admin dashboard loads instantly (<100ms) instead of 1-3s
- Report generation no longer blocks API workers

---

## OPTION A: In-Memory Caching

### A.1 Overview

**Goal:** Eliminate redundant database queries for read-heavy, rarely-changing data.

**Approach:** Expand the existing `ReportCache` utility into a general-purpose `AppCache` with namespace support, then apply it strategically across the codebase.

**Why not Redis yet?** The current workload is single-server (no horizontal scaling). In-memory caching is simpler, zero-latency, and requires no infrastructure changes. Redis can be added later if we scale to multiple workers.

### A.2 Cache Infrastructure Enhancement

#### A.2.1 Expand `app/utils/cache.py`

**Current State:** `ReportCache` only supports report-type keys with 24h TTL.

**Changes:**
```python
# New general-purpose cache class
class AppCache(ReportCache):
    """General-purpose in-memory cache with namespace support"""
    
    def _generate_key(self, namespace: str, key: str, **kwargs) -> str:
        params_str = "_".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
        base = f"{namespace}:{key}"
        return f"{base}:{params_str}" if params_str else base
    
    def get(self, namespace: str, key: str, **kwargs) -> Optional[Any]:
        return super().get(f"{namespace}:{key}", **kwargs)
    
    def set(self, namespace: str, key: str, value: Any, ttl_seconds: Optional[int] = None, **kwargs):
        super().set(f"{namespace}:{key}", value, ttl_seconds, **kwargs)
    
    def invalidate(self, namespace: str, key: str, **kwargs) -> bool:
        return super().invalidate(f"{namespace}:{key}", **kwargs)
    
    def invalidate_namespace(self, namespace: str) -> int:
        return self.invalidate_pattern(f"{namespace}:*")
```

**File:** `app/utils/cache.py`  
**Lines:** Add after line 115 (after `get_report_cache()`)

#### A.2.2 Global Cache Instance

```python
# Singleton instance
_app_cache_instance = None

def get_app_cache() -> AppCache:
    global _app_cache_instance
    if _app_cache_instance is None:
        _app_cache_instance = AppCache()
    return _app_cache_instance
```

### A.3 Cache Implementation Details

#### A.3.1 Admin Dashboard Stats (P0 — HIGHEST IMPACT)

**Target:** `app/api/admin.py:261-338` (`get_admin_stats`)

**Current Behavior:** 20+ aggregate queries per request.

**Implementation:**
```python
from app.utils.cache import get_app_cache

cache = get_app_cache()

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    # Try cache first
    cached = cache.get("stats", "dashboard")
    if cached:
        return AdminStatsResponse(**cached)
    
    # ... existing query logic ...
    
    result = AdminStatsResponse(...)
    cache.set("stats", "dashboard", result.model_dump(), ttl_seconds=120)
    return result
```

**TTL:** 120 seconds (2 minutes)  
**Invalidation Triggers:**
- `PATCH /users/{id}/approval` → `cache.invalidate_namespace("stats")`
- `PATCH /products/{id}/approval` → `cache.invalidate_namespace("stats")`
- `POST /donations` → `cache.invalidate_namespace("stats")`
- `PUT /orders/{id}/status` → `cache.invalidate_namespace("stats")`

**Expected Impact:** 80-95% reduction in admin stats DB load.

---

#### A.3.2 Auth Role Resolution (P0 — EVERY REQUEST)

**Target:** `app/middleware/auth.py:95-119` (`_resolve_role_from_db`)

**Current Behavior:** 1-4 DB queries per request when token role missing.

**Implementation:**
```python
from app.utils.cache import get_app_cache

cache = get_app_cache()

def _resolve_role_from_db(user_id: UUID, fallback_role: str | None) -> str | None:
    # Try cache first
    cached = cache.get("auth", str(user_id))
    if cached:
        return cached
    
    # ... existing DB logic ...
    
    if role:
        cache.set("auth", str(user_id), role, ttl_seconds=600)  # 10 min
    return role
```

**TTL:** 600 seconds (10 minutes)  
**Invalidation Triggers:**
- `POST /auth/google/exchange` (new user signup)
- `POST /auth/google/sync`
- `PATCH /users/{id}/approval` (role change)

**Expected Impact:** Eliminates 1-4 DB queries per API call for users without role in token.

---

#### A.3.3 Product Categories (P2)

**Target:** `app/services/product_service.py:17-20` (`get_categories`)

**Implementation:**
```python
def get_categories(db: Session) -> List[Category]:
    cache = get_app_cache()
    cached = cache.get("ref", "categories")
    if cached:
        return cached
    
    result = db.query(Category).filter(...).all()
    cache.set("ref", "categories", result, ttl_seconds=3600)  # 1 hour
    return result
```

**TTL:** 3600 seconds (1 hour)  
**Invalidation:** `POST /admin/categories` (when implemented)

---

#### A.3.4 Report Cache Integration (P0)

**Target:** `app/api/reports.py` (all endpoints)

**Current Bug:** Cron pre-generates reports, but API never reads from cache.

**Implementation:**
```python
@router.get("/regional")
async def get_regional_report(...):
    cache = get_app_cache()
    cached = cache.get("report", "regional", start_date=start_date, end_date=end_date)
    if cached:
        return cached
    
    # Fall back to generation
    result = ReportGenerator.generate_regional_report(...)
    cache.set("report", "regional", result, ttl_seconds=3600, start_date=start_date, end_date=end_date)
    return result
```

**Files:** `app/api/reports.py` (all GET endpoints)  
**TTL:** 3600 seconds (regional/demographics), 300 seconds (impact/sales)

---

#### A.3.5 Donor Dashboard Metrics (P2)

**Target:** `app/services/donation_service.py:193-282` (`get_dashboard_metrics`)

**Implementation:**
```python
def get_dashboard_metrics(db: Session, donor_id: str) -> dict:
    cache = get_app_cache()
    cached = cache.get("donor", f"metrics:{donor_id}")
    if cached:
        return cached
    
    # ... existing 8+ aggregate queries ...
    
    cache.set("donor", f"metrics:{donor_id}", result, ttl_seconds=300)  # 5 min
    return result
```

**TTL:** 300 seconds (5 minutes)  
**Invalidation:** New donation, subscription change.

---

#### A.3.6 Beneficiary Wallet Balance (P3)

**Target:** `app/services/wallet_service.py:304-338` (`get_balance_summary`)

**Implementation:**
```python
def get_balance_summary(db: Session, beneficiary_id: str) -> dict:
    cache = get_app_cache()
    cached = cache.get("wallet", f"balance:{beneficiary_id}")
    if cached:
        return cached
    
    # ... existing queries ...
    
    cache.set("wallet", f"balance:{beneficiary_id}", result, ttl_seconds=30)  # 30 sec
    return result
```

**TTL:** 30 seconds (short, since balance changes on orders)

---

### A.4 Cache Invalidation Strategy

| Cache Namespace | Invalidated By | Pattern |
|----------------|----------------|---------|
| `stats:*` | Any admin mutation endpoint | `invalidate_namespace("stats")` |
| `auth:*` | User signup, role change | Specific key invalidation |
| `ref:*` | Reference data CRUD | Specific key invalidation |
| `report:*` | Cron regeneration | Overwritten by cron |
| `donor:*` | New donation | Specific key invalidation |
| `wallet:*` | Order create/cancel/complete | Specific key invalidation |

-
