# VISUAL ARCHITECTURE GUIDE

## 1. CURRENT COMPONENT TREE

```
App.tsx (Routes)
├── /dashboard/dompet-nutrisi
│   └── DompetNutrisi (lazy)
│       └── DashboardLayout
│           ├── Hero Card (Balance)
│           ├── Allocations Section
│           ├── Categories Grid
│           └── Transactions List
│               └── Transaction Item (×20)
│
└── /dashboard/orders
    └── OrderHistoryPage (lazy)
        └── DashboardLayout
            ├── KPI Stats (3 cards)
            ├── Filter Chips (if active)
            └── Sidebar + Main Grid (lg+)
                ├── OrderFiltersPanel
                │   ├── Status Dropdown
                │   └── Date Range Inputs
                └── Orders List
                    ├── OrderCard (memoized)
                    │   ├── Header
                    │   ├── Body
                    │   └── Actions (QR/Reorder/Detail)
                    └── OrderQrModal (portal)
                        ├── QR Display
                        ├── Item List
                        └── Action Buttons
```

---

## 2. PROPOSED MERGED STRUCTURE (Tabbed)

```
App.tsx (Routes)
├── /dashboard/dompet-nutrisi → redirect to /dashboard/activity?tab=wallet
├── /dashboard/orders → redirect to /dashboard/activity?tab=orders
│
└── /dashboard/activity (NEW)
    └── ActivityPage (lazy)
        └── DashboardLayout
            ├── Tab Navigation
            │   ├── Button: Wallet
            │   └── Button: Orders
            │
            ├── Tab: Wallet
            │   ├── Hero Card (Balance)
            │   ├── Allocations Section
            │   ├── Categories Grid
            │   └── Transactions List
            │
            ├── Tab: Orders
            │   ├── KPI Stats
            │   ├── Filter Chips
            │   └── Sidebar + Orders Grid
            │       ├── OrderFiltersPanel
            │       └── OrderCard (×N)
            │
            └── Modals (persistent across tabs)
                └── OrderQrModal (portal)
```

---

## 3. DATA FLOW DIAGRAM

### Before Merge
```
DompetNutrisi                          OrderHistoryPage
├─ Mount                               ├─ Mount
│  └─ fetchAll()                       │  └─ filters change
│     ├─ getWalletBalance()            │     └─ loadOrders()
│     ├─ getWalletTransactions()       │        └─ getOrders(filters)
│     └─ getWalletAllocations()        │           └─ setOrders, setPagination
│        └─ Set: balance, txs, allocs  │
│           └─ render                  │
└─ User: Refresh → fetchAll()          │
                                       └─ User: Filter → setFilters()
```

### After Merge
```
ActivityPage
├─ Mount
│  ├─ Tab: wallet → fetchWallet()
│  │  ├─ getWalletBalance()
│  │  ├─ getWalletTransactions()
│  │  └─ getWalletAllocations()
│  │
│  └─ Tab: orders → fetchOrders()
│     └─ getOrders(filters)
│
├─ User: Click wallet tab
│  └─ setActiveTab('wallet')
│     └─ render wallet section
│
└─ User: Change filter
   └─ setOrderFilters()
      └─ fetchOrders()
         └─ render order cards
```

---

## 4. COMPONENT DEPENDENCY MAP

### DompetNutrisi Dependencies
```
DompetNutrisi
│
├─ DashboardLayout (UI wrapper)
├─ Badge (UI component)
├─ Button (UI component)
├─ Skeleton (loading)
│
├─ Icons (Lucide)
│  ├─ Wallet, Package, Flame, Lock, etc.
│
├─ Services
│  ├─ getWalletBalance()
│  ├─ getWalletTransactions()
│  └─ getWalletAllocations()
│
├─ Types (inline in file)
│  ├─ WalletBalance, WalletTransaction, WalletAllocation
│  ├─ TX_TYPE_CONFIG (transaction type mapping)
│  └─ allowedCategories (constants)
│
└─ Utils
   ├─ formatIDR, formatDate, formatDateShort
   └─ toast (for notifications - NOT USED, opportunity)
```

### OrderHistoryPage Dependencies
```
OrderHistoryPage
│
├─ DashboardLayout (UI wrapper)
├─ Badge, Button, Skeleton (UI components)
│
├─ Sub-components
│  ├─ OrderFiltersPanel (import)
│  ├─ OrderQrModal (import)
│  ├─ OrderCard (internal)
│  └─ OrderCardSkeleton (internal)
│
├─ Icons (Lucide)
│  ├─ Package, Wallet, TrendingUp, Clock, etc.
│
├─ Services
│  ├─ getOrders()
│  ├─ addToCart()
│  └─ (OrderQrModal uses: getOrderPickupQr, cancelOrder)
│
├─ Types (external)
│  ├─ Order, OrderItem, OrderFilters, OrdersResponse
│  └─ statusMap (status configuration)
│
└─ Utils
   ├─ formatIDR, formatDate
   ├─ toast (for notifications)
   └─ computeOrderTotal() (helper function)
```

### Proposed Shared Components (Post-Merge)
```
ActivityPage
│
├─ Shared UI
│  ├─ DashboardLayout ✓ (already shared)
│  ├─ Badge ✓ (already shared)
│  ├─ Button ✓ (already shared)
│  ├─ Skeleton ✓ (already shared)
│  └─ Dialog/Modal ✓ (already shared)
│
├─ Shared Utils
│  ├─ formatIDR ✓ (from @/lib/format)
│  ├─ formatDate ✓ (from @/lib/format)
│  ├─ NEW: ActivityTypes (union of Wallet + Order types)
│  └─ NEW: ActivityConfig (merged status/type mappings)
│
├─ Services (unchanged - not shared between pages)
│  ├─ Wallet services (only wallet tab uses)
│  └─ Order services (only orders tab uses)
│
└─ Icons
   └─ Lucide ✓ (already shared)
```

---

## 5. STATE LIFTING DIAGRAM

### Current (Separate Pages)
```
App.tsx
├─ route: /dashboard/dompet-nutrisi
│  └─ DompetNutrisi Component
│     ├─ [balance, setBalance]
│     ├─ [transactions, setTransactions]
│     ├─ [allocations, setAllocations]
│     ├─ [loading, setLoading]
│     └─ [error, setError]
│
└─ route: /dashboard/orders
   └─ OrderHistoryPage Component
      ├─ [orders, setOrders]
      ├─ [isLoading, setIsLoading]
      ├─ [filters, setFilters]
      ├─ [pagination, setPagination]
      ├─ [reorderingOrderId, setReorderingOrderId]
      └─ [qrOrderId, setQrOrderId]
```

### Proposed (Merged)
```
App.tsx
└─ route: /dashboard/activity
   └─ ActivityPage Component
      ├─ [activeTab, setActiveTab]
      │
      ├─ Wallet State (if activeTab === 'wallet')
      │  ├─ [balance, setBalance]
      │  ├─ [transactions, setTransactions]
      │  ├─ [allocations, setAllocations]
      │  ├─ [walletLoading, setWalletLoading]
      │  └─ [walletError, setWalletError]
      │
      ├─ Orders State (if activeTab === 'orders')
      │  ├─ [orders, setOrders]
      │  ├─ [ordersLoading, setOrdersLoading]
      │  ├─ [filters, setFilters]
      │  └─ [pagination, setPagination]
      │
      └─ Shared Modal State (persists across tabs)
         ├─ [qrOrderId, setQrOrderId]
         └─ [reorderingOrderId, setReorderingOrderId]
```

---

## 6. URL ROUTING STRATEGY

### Current Routes
```
GET /dashboard/dompet-nutrisi → DompetNutrisi Component
GET /dashboard/orders?page=1&page_size=10&status=pending → OrderHistoryPage
GET /dashboard/orders/:orderId → OrderDetailPage
```

### Migration Path
```
PHASE 1: Add New Route (non-breaking)
├─ GET /dashboard/activity?tab=wallet → ActivityPage (wallet tab)
├─ GET /dashboard/activity?tab=orders → ActivityPage (orders tab)
├─ GET /dashboard/activity → ActivityPage (default: wallet tab)
└─ Existing routes still work

PHASE 2: Add Redirects (smooth migration)
├─ /dashboard/dompet-nutrisi → /dashboard/activity?tab=wallet
├─ /dashboard/orders → /dashboard/activity?tab=orders
└─ /dashboard/orders/:orderId → Keep as-is (external routing)

PHASE 3: Update Navigation (UI only)
├─ DashboardLayout menu items link to /dashboard/activity?tab=wallet
└─ DashboardLayout menu items link to /dashboard/activity?tab=orders

PHASE 4: Deprecation (optional, after 1-2 releases)
└─ Remove old routes
```

### Implementation in App.tsx
```typescript
// Before
<Route path="/dashboard/dompet-nutrisi" element={<DompetNutrisi />} />
<Route path="/dashboard/orders" element={<OrderHistoryPage />} />

// After (with backward compatibility)
<Route path="/dashboard/activity" element={<ActivityPage />} />
<Route path="/dashboard/dompet-nutrisi" element={<Navigate to="/dashboard/activity?tab=wallet" />} />
<Route path="/dashboard/orders" element={<Navigate to="/dashboard/activity?tab=orders" />} />
```

---

## 7. MODAL PERSISTENCE ACROSS TABS

### Problem
```
OrderQrModal is triggered from OrderHistoryPage.
If user is on tab=orders and opens QR modal,
switching to tab=wallet should NOT close the modal.
```

### Solution: Lift Modal State
```
ActivityPage
├─ [qrOrderId, setQrOrderId] ← lif
