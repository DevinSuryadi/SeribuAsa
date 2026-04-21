# Smoke Test Matrix (Beneficiary / Vendor / Admin)

This checklist verifies critical end-to-end flows after recent integration fixes
(cart, checkout, orders, vouchers, FIES, nutrition, QR generation/scanner).

## Preconditions

- Backend server running on `http://localhost:8000`
- Frontend server running on `http://localhost:5173`
- Database seeded (recommended):
  - `python apps/backend/seed_database.py --mode full-demo --reset`
- Browser cache cleared (hard refresh)

## Test Accounts

- Beneficiary: active account with beneficiary profile and children
- Vendor: active account with approved vendor profile
- Admin: active admin account

---

## A. Beneficiary Flow (Core Purchase Journey)

### A1. Catalog and Cart

1. Login as beneficiary.
2. Open `/dashboard/katalog`.
3. Add one product to cart.
4. Add the same product again.
5. Open `/dashboard/cart`.
6. Update quantity.
7. Remove one item.
8. Add the removed product again.

Expected:

- No 500 errors.
- Cart updates correctly.
- No duplicate key crash.

### A2. Clear Cart and Refill

1. From cart page, click "clear cart" action.
2. Confirm cart is empty.
3. Go back to catalog and add products again.

Expected:

- Clear cart works without edge-case errors.
- Re-adding products works immediately.

### A3. Checkout and Order Creation

1. Open `/checkout`.
2. Complete step flow (review -> payment -> confirm).
3. Confirm order success page appears.

Expected:

- Order created successfully.
- No CORS/network/JSON parse errors.

### A4. Orders UX

1. Open `/dashboard/orders`.
2. Verify summary cards and list render.
3. Click "Lihat Detail" on an order.
4. Confirm detail route opens: `/dashboard/orders/:orderId`.
5. Click "Pesan Lagi".

Expected:

- No redirect to landing page.
- Detail page content loads.
- Reorder adds items to cart and opens checkout.

### A5. FIES and Nutrition

1. Open `/dashboard/survei-fies`.
2. Submit survey on any date.
3. Open nutrition page and select child.
4. Verify history and latest measurement rendering.

Expected:

- FIES submit accepted (date not restricted to day 1-7).
- Nutrition child/history mapping renders without empty-state bugs.

### A6. Voucher Wallet and QR

1. Open `/dashboard/vouchers`.
2. Verify balance and transaction history load.
3. Verify active voucher QR cards appear.
4. Click "Salin" on voucher code.

Expected:

- Transaction pagination behaves correctly.
- QR image loads per active voucher.
- Code copy succeeds.

---

## B. Vendor Flow (QR Scanner and Redemption)

### B1. Scanner Access

1. Login as vendor.
2. Open `/dashboard/penukaran-voucher`.

Expected:

- Page accessible for vendor role.
- Vendor mode helper text visible.

### B2. Camera Scanner

1. Click "Mulai Scanner".
2. Present QR from beneficiary wallet.
3. Wait for code auto-fill.

Expected:

- Camera starts and preview visible.
- QR code parsed to voucher code.
- If browser lacks `BarcodeDetector`, fallback message appears.

### B3. Manual Fallback Redemption

1. Enter voucher code manually.
2. Enter transaction amount > 0.
3. Validate then confirm redemption.

Expected:

- Redemption succeeds with success state.
- No role/ownership mismatch crash.

---

## C. Admin Flow (Access and Guardrails)

### C1. Route and Role Checks

1. Login as admin.
2. Access beneficiary-related dashboard pages.
3. Access vendor scanner page.

Expected:

- Admin can access intended protected pages.

### C2. Guardrail Validation

1. Login as beneficiary and attempt vendor-only redeem endpoints via UI.

Expected:

- Beneficiary blocked from vendor-only redemption actions with clear message.

---

## D. API/Network Spot Checks

Use browser Network tab while executing above flows.

- `GET /api/v1/cart` -> 200
- `GET /api/v1/cart/summary` -> 200
- `POST /api/v1/orders/` -> 201/200
- `GET /api/v1/orders/` -> 200
- `GET /api/v1/vouchers/transactions` -> 200 with `items,total,page,page_size,total_pages`
- `POST /api/v1/fies/submit` -> 201/200
- `GET /api/v1/nutrition/children` -> 200

Expected:

- No plain-text 500 bodies for these critical endpoints.
- Error responses (if any) are JSON and actionable.

---

## Exit Criteria (Demo Ready)

Mark release/demo as ready when all are true:

- [ ] Beneficiary full purchase journey passes end-to-end
- [ ] Vendor scanner + fallback manual redemption passes
- [ ] Voucher wallet (balance/history/QR) fully renders
- [ ] FIES and nutrition flows pass without mapping/copy regressions
- [ ] No blocker console/network errors in core journey
