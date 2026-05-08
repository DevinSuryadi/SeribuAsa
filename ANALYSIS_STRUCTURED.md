# STRUCTURED FINDINGS: DompetNutrisi + OrderHistoryPage Analysis

---

## QUICK REFERENCE TABLE

| Aspect | DompetNutrisi | OrderHistoryPage |
|--------|---------------|------------------|
| **Route** | `/dashboard/dompet-nutrisi` | `/dashboard/orders` |
| **File Size** | 473 lines | 582 lines |
| **Primary Data** | Wallet balance + transactions | Order history + metadata |
| **API Calls** | 3 parallel: Balance, Transactions, Allocations | 1 main: getOrders() |
| **Refresh Strategy** | Manual button + on-demand | Reactive on filter change |
| **Pagination** | 20 items (no UI pagination) | 10 items per page (with UI) |
| **Filters** | None | Status, date range |
| **KPI Display** | Inline (available balance, held, total) | 3-card grid (count, spend, savings) |
| **Empty State** | "No transactions" + shop button | "No orders" + shop + wallet links |
| **Modal** | None | OrderQrModal (for pending orders) |
| **Memoization** | No | OrderCard is memoized |
| **Sub-components** | None (inline) | OrderFiltersPanel, OrderQrModal, OrderCard |

---

## DATA MODELS COMPARISON

### Wallet Data (DompetNutrisi)
```
WalletBalance {
  wallet_balance: 500,000
  wallet_held: 100,000
  wallet_available: 400,000
  expiring_soon: 50,000
  earliest_expiry: "2024-05-10"
}

WalletTransaction {
  id, transaction_type (credit|debit|hold|unhold|expired)
  amount, balance_after, description, order_id, created_at
}

WalletAllocation {
  id, original_amount, remaining_amount, expires_at
  status (active|depleted|expired), days_until_expiry
}
```

### Order Data (OrderHistoryPage)
```
Order {
  id, user_id, vendor_id
  status (pending|confirmed|processing|shipped|delivered|cancelled)
  items: OrderItem[]
  cart_total, voucher_discount, cash_amount
  created_at, updated_at
  vendor_store_name, notes
  applied_voucher: { code, applied_amount }
}

OrderItem {
  id, product_id, product_name, quantity, price, subtotal
}
```

---

## UI LAYOUT PATTERNS

### DompetNutrisi Layout (Vertical Stack)
```
┌─────────────────────────────────────────┐
│  [Hero Balance Card - Green Gradient]   │
│  - Available balance (large)             │
│  - Progress bar                          │
│  - Status badges                         │
│  - Navigation to orders                  │
│  - Warning (if expiring)                 │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│     Active Allocations (FIFO)            │
│  - Top 4 allocations with progress bars  │
│  - Expiry warnings                       │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│   Allowed Purchase Categories            │
│  - 6 categories grid (2-3 cols)          │
│  - Emoji + description + border color    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│   Transaction History                    │
│  - List of transactions                  │
│  - Colored by type (in/out)               │
│  - With dates and amounts                │
└─────────────────────────────────────────┘
```

### OrderHistoryPage Layout (Sidebar + Main)
```
                 Desktop (lg+)
    ┌──────────────────────────────────┐
    │  KPI Stats (3-column grid)       │
    └──────────────────────────────────┘
              ↓
    ┌──────────────────────────────────┐
    │  Active Filter Chips (if any)    │
    └──────────────────────────────────┘
              ↓
    ┌───────────┬─────────────────────┐
    │ Sidebar   │   Main Content      │
    │ (sticky)  │   - Order Cards     │
    │           │   - Pagination      │
    │ Filters   │                     │
    │ Status ▼  │  [Order Card]       │
    │ Date from │  [Order Card]       │
    │ Date to   │  [Order Card]       │
    │ Apply btn │  [Pagination]       │
    │           │                     │
    └───────────┴─────────────────────┘
```

---

## STATE MANAGEMENT PATTERNS

### DompetNutrisi
```typescript
// Simple 5-state model
Loading (bool) → Data States → Error State

Flow:
1. Mount → loading = true
2. Fetch 3 APIs in parallel
3. Set data → loading = false
4. Render
5. User clicks Refresh → repeat
```

### OrderHistoryPage
```typescript
// Complex reactive model (6+ state variables)
Filters → Loading → Data → UI Update

Flow:
1. Mount with default filters
2. Load orders based on filters
3. Render KPIs + filters + orders
4. User changes filter → filters state changes
5. useEffect dependency → loadOrders() runs
6. Data updates → UI re-renders
```

---

## COMPONENT REUSABILITY ANALYSIS

### Reusable (High Value)
- ✅ **Badge** - Used in both for status/type/category display
- ✅ **Button** - Ubiquitous, already shared
- ✅ **formatIDR / formatDate** - Both use for currency/date
- ✅ **DashboardLayout** - Both use as wrapper
- ✅ **Status config objects** - Can be unified into types/activity.ts

### Potentially Reusable (Medium Value)
- 🟡 **Skeleton component** - Both use for loading states
- 🟡 **Icon patterns** - Both use Lucide icons in similar way
- 🟡 **Grid layouts** - Responsive patterns could be extracted

### Page-Specific (Low Reusability)
- ❌ **OrderCard** - Too specific to Order data
- ❌ **OrderQrModal** - Order-specific
- ❌ **OrderFiltersPanel** - Order-specific (though pattern is general)
- ❌ **Allocations display** - Wallet-specific
- ❌ **Hero balance card** - Wallet-specific

---

## API CALL PATTERNS

### DompetNutrisi
```typescript
// Type: Parallel, fire-and-forget
const fetchAll = useCallback(async () => {
  const [bal, txRes, allocRes] = await Promise.all([
    getWalletBalance(),
    getWalletTransactions({ page_size: 20 }),
    getWalletAllocations("active"),
  ]);
  // Set all at once
}, []);
```

**Characteristics:**
- Fires on mount
- Manual refresh button
- All-or-nothing error handling
- Fixed page size (20 transactions)

### OrderHistoryPage
```typescript
// Type: Reactive, filters-driven
const loadOrders = useCallback(async () => {
  const response = await getOrders({
    page: filters.page,
    page_size: filters.page_size,
    status: filters.status,
  });
  // Set orders + pagination
}, [filters]);  // Re-runs on filter change
```

**Characteristics:**
- Fires on filter changes
- Reactive dependency
- Pagination aware
- Single API endpoint

---

## MERGE IMPLICATIONS

### State Complexity
```
Current Combined Lines of Code:
- DompetNutrisi: 473 LOC
- OrderHistoryPage: 582 LOC
- Subtotal: 1,055 LOC

Post-merge with refactoring:
- Potential reduction: -200 LOC (shared components, utils)
- New Activity page: ~800-900 LOC
```

### Performance Considerations
```
Network:
- Current: 4 API calls (3 wallet + 1 orders)
- Merged: Still 4 calls (unless endpoint consolidates)

Rendering:
- No memoization in DompetNutrisi (opportunity)
- OrderCard is memoized (good)
- Tab switching could cause re-renders (need React.memo)

Bundle:
- No significant impact (same components used)
- Slight reduction with shared utils
```

### User Experience
```
Current:
- 2 separate menu items (Dompet Nutrisi, Riwayat Pesanan)
- Clear separation of concerns

Merged options:
1. Tabbed: Single menu item, tab selection
2. Sectioned: Single page, scroll through sections
3. Both: Keep menu items but share implementation

Navigation impact:
- Old URLs `/dashboard/dompet-nutrisi` and `/dashboard/orders` 
  must still work (redirect to new URL)
```

---

## ICON & COLOR PALETTE MAPPING

### Transaction/Status Icons
```
Wallet Side:
- ArrowDownRight → Credit (emerald)
- ArrowUpRight → Debit (rose)
- Lock → Hold (amber)
- CheckCircle2 → Unhold (blue)
- X → Expired (slate)

Order Side:
- Clock → Pending (amber)
- CheckCircle2 → Confirmed/Delivered (blue/green)
- Loader2 → Processing (purple)
- Package → Shipped (indigo)
- XCircle → Cancelled (red)
```

### Color Scheme Consistency
```
Both use Tailwind palette:
- Emerald/Green: Success, income
- Rose/Red: Expenses, issues
- Amber: Warning, pending
- Blue: Info, confirmed
- Slate: Disabled, expired

Gradient (Hero card): #16a34a → #047857 (green theme)
```

---

## CRITICAL DECISIONS FOR MERGER

1. **Route Strategy**
   - [ ] Keep both routes separately
   - [ ] Redi
