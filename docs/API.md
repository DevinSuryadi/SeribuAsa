# API Reference

**Base URL:** `http://localhost:8000/api/v1`  
**Auth:** Supabase JWT (Bearer token) or mock auth (when `DEV_MODE=true`)

## Authentication

All endpoints except public ones require authentication. Send the Supabase access token as a Bearer token:

```
Authorization: Bearer <access_token>
```

When `DEV_MODE=true`, the backend accepts requests without a valid JWT and uses a mock donor user.

---

## Donations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/donations/` | Yes | Create a donation |
| GET | `/donations/` | Yes | List all donations (paginated) |
| GET | `/donations/{id}` | Yes | Get donation by ID |
| GET | `/donations/impact/{donor_id}` | Yes | Get donor impact metrics |
| POST | `/donations/{id}/simulate-payment` | Yes | Simulate payment (demo) |

### Create Donation

```json
POST /api/v1/donations/
{
  "amount": 300000,
  "type": "one_time",
  "payment_method": "qris"
}
```

### Impact Metrics

```json
GET /api/v1/donations/impact/{donor_id}

Response:
{
  "donor_id": "...",
  "total_donated": "1000000",
  "total_children_helped": 5,
  "total_vouchers_allocated": 10,
  "donation_trend": [...],
  "geographic_distribution": [...]
}
```

---

## Vouchers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/vouchers/allocate` | Yes | Allocate vouchers after donation |
| GET | `/vouchers/balance/{beneficiary_id}` | Yes | Get voucher balance |
| GET | `/vouchers/history` | Yes | Get voucher transaction history |
| POST | `/vouchers/redeem` | Yes | Redeem vouchers for order |

### Redeem Voucher

```json
POST /api/v1/vouchers/redeem
{
  "order_id": "ORD-001",
  "voucher_codes": ["VCH-2026-XXXX"],
  "amount": 100000
}
```

---

## Products

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/products/categories` | Optional | Any | List categories |
| POST | `/products/categories` | Yes | admin | Create category |
| GET | `/products/` | Optional | Any | List products (paginated) |
| GET | `/products/{id}` | Optional | Any | Get product detail |
| POST | `/products/` | Yes | vendor | Create product |
| PUT | `/products/{id}` | Yes | vendor | Update product |
| DELETE | `/products/{id}` | Yes | vendor | Soft delete product |

### List Products (with filters)

```
GET /api/v1/products/?page=1&page_size=20&category_id=...&search=...&in_stock_only=true
```

---

## Orders

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/orders/` | Yes | beneficiary | Create order with voucher redemption |
| GET | `/orders/` | Yes | beneficiary/vendor | List orders (role-filtered) |
| GET | `/orders/{id}` | Yes | beneficiary/vendor | Get order detail with items |
| PUT | `/orders/{id}/status` | Yes | vendor | Update order status |

### Create Order

```json
POST /api/v1/orders/
{
  "vendor_id": "...",
  "items": [
    { "product_id": "...", "quantity": 2, "price": 50000 }
  ],
  "voucher_codes": ["VCH-2026-XXXX"],
  "notes": "Optional notes"
}
```

---

## FIES (Food Insecurity)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/fies/submit` | Yes | Submit FIES survey (tanggal 1-7 only) |
| POST | `/fies/calculate` | No | Calculate FIES score from responses |
| GET | `/fies/history/{beneficiary_id}` | Yes | Get survey history with trend |

### Submit Survey

```json
POST /api/v1/fies/submit
{
  "responses": { "q1": 0, "q2": 1, "q3": 0, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 0 }
}
```

---

## Nutrition

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/nutrition/children` | Yes | List beneficiary's children |
| POST | `/nutrition/measurements` | Yes | Add child growth measurement |
| GET | `/nutrition/measurements/{child_id}` | Yes | Get measurement history |
| POST | `/nutrition/zscore` | No | Calculate WHO Z-Score |

---

## Recommendations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/recommendations/` | Yes | Get AI-powered nutrition recommendations |

---

## Settlements

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/settlements/` | Yes | vendor/admin | List settlements |
| GET | `/settlements/{id}` | Yes | vendor/admin | Get settlement detail |
| POST | `/settlements/calculate` | Yes | admin | Trigger settlement calculation |

---

## Reports

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/reports/impact` | Yes | donor | Donor impact report |
| GET | `/reports/sales` | Yes | vendor | Vendor sales report |
| GET | `/reports/regional` | Yes | gov/admin | Regional analytics |
| GET | `/reports/demographics` | Yes | gov/admin | Demographics report |

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200` — Success
- `201` — Created
- `400` — Bad Request (validation error)
- `401` — Unauthorized (missing/invalid auth)
- `403` — Forbidden (insufficient role)
- `404` — Not Found
- `422` — Validation Error (Pydantic)
