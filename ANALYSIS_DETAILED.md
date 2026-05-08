# Activity Page Analysis: DompetNutrisi + OrderHistoryPage Merger

## EXECUTIVE SUMMARY

Both pages follow similar architectural patterns but serve different purposes:
- **DompetNutrisi**: E-wallet balance, transaction history, and active allocations (for donations)
- **OrderHistoryPage**: Purchase order history with filters, KPI stats, and order actions

These could be unified into a single "Activity" page showing wallet + order activity in a tabbed or sectioned interface.

---

## 1. DOMPETNUTRISI.TSX ANALYSIS

### File Location
`D:\ppl1\Project-PPL1\apps\frontend\src\pages\dashboard\DompetNutrisi.tsx`

### Route
- **Path**: `/dashboard/dompet-nutrisi`
- **Role**: `beneficiary, admin`
- **Lazy-loaded**: Yes

### Data Fetched
```typescript
// Three concurrent API calls
1. getWalletBalance()
   - wallet_balance: total across all allocations
   - wallet_held: amount held for pending orders
   - wallet_available: ready to spend
   - expiring_soon: amount expiring within 7 days
   - earliest_expiry: ISO date string

2. getWalletTransactions({ page_size: 20 })
   - items: WalletTransaction[]
   - pagination metadata
   - Types: credit, hold, unhold, debit, expired

3. getWalletAllocations("active")
   - items: WalletAllocation[]
   - Shows FIFO allocation usage (remaining vs original)
   - Expiry dates and days_until_expiry
```

### UI Structure

#### 1. Loading State
- Centered spinner with "Memuat data dompet..." text

#### 2. Error State
- Red error card with retry button

#### 3. Hero Balance Card (Green gradient: #16a34a → #047857)
- **Display**: Available balance in large text
- **Progress bar**: Usage indicator (availBalance / 2M max)
- **Badges**:
  - Active allocations count
  - Held balance (if > 0) with lock icon
  - Earliest expiry date (if exists)
- **Warning**: "X will expire in 7 days" (if expiringSoon > 0)
- **Stats row**:
  - Total Balance | Held Balance | [Shop Button] [QR Button]
- **Navigation button** (top right): Package icon linking to `/dashboard/orders`

#### 4. Active Allocations Section
- Shows top 4 allocations with:
  - Remaining / Original amount
  - Expiry date + days remaining
  - Expiry warning (⚠️ if <= 7 days)
  - Progress bar (amber if expiring soon, emerald if healthy)
  - Status badge (Active/Depleted/Expired)

#### 5. Allowed Categories Section
- Grid display (2 cols mobile, 3 cols desktop)
- 6 categories: Protein, Dairy, Vegetables, Fruits, Legumes, Staples
- Each: emoji + name + description + colored border
- Warning box: "Only nutritious items allowed"

#### 6. Transaction History Section
- List of wallet transactions with:
  - Icon + label (based on type)
  - Description + date
  - Amount (+ for credit, - for debit)
  - Type badge (colored: green for in, rose for out)
- Empty state: "No transactions" → link to shopping

### Key Components/Icons Used
```
Lucide icons: Wallet, ArrowUpRight, ArrowDownLeft, Lock, Flame, 
  CheckCircle2, Package, X, TrendingUp, Loader2, AlertCircle, RefreshCw
UI: Badge, Button, DashboardLayout
```

### State Management
```typescript
const [balance, setBalance] = useState<WalletBalance | null>(null);
const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
const [allocations, setAllocations] = useState<WalletAllocation[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### User Actions
1. Refresh wallet data (manual button)
2. Navigate to orders page (from hero card)
3. Shop (button in hero card)
4. QR Pickup (button in hero card)
5. View order details (internal link from hero)

### Styling Notes
- Uses Tailwind utility classes
- Custom transaction type config object with colors/icons
- Allowed categories color-coded (amber-50, red-50, blue-50, etc.)
- Responsive: works mobile-first with breakpoints

---

## 2. ORDERHISTORYPAGE.TSX ANALYSIS

### File Location
`D:\ppl1\Project-PPL1\apps\frontend\src\pages\dashboard\orders\OrderHistoryPage.tsx`

### Route
- **Path**: `/dashboard/orders` or `/dashboard/orders/:orderId`
- **Role**: `beneficiary, admin`
- **Lazy-loaded**: Yes

### Data Fetched
```typescript
// Paginated orders with optional filters
getOrders({
  page: 1-N,
  page_size: 10,
  status?: OrderStatus (pending|confirmed|processing|shipped|delivered|cancelled)
  // date filters supported but not heavily used in UI
})

Response: OrdersResponse {
  orders: Order[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
```

### UI Structure

#### 1. Loading State
- 4 skeleton cards mimicking OrderCard layout

#### 2. Empty State
- Receipt icon + message: "No Orders Yet"
- Suggests browsing catalog or checking wallet
- Buttons: [Shop] [View Wallet]

#### 3. KPI Stats Row (3-column grid)
- **Total Orders**: Count + delivered count subtext
- **Total Spending**: Sum of all order totals
- **Voucher Savings**: Sum of all voucher discounts
- Each with icon + label + loading skeleton

#### 4. Active Filter Chips
- Shows applied status/date filters
- Individual X buttons to remove filters
- "Reset all" button

#### 5. Sidebar + Orders Layout (lg:col-span-4 grid)
- **Sidebar (sticky, 1/4 width on lg+)**:
  - OrderFiltersPanel component
  - Status dropdown + date range inputs
  - Apply/Reset buttons

- **Main content (3/4 width on lg+)**:
  - OrderCard components (memoized)
  - Pagination controls (if total_pages > 1)

#### 6. OrderCard Component (Memoized)
Each card displays:
- **Header**: 
  - Status dot (colored)
  - Order ID (truncated to 8 chars)
  - Status badge (colored)
  - Vendor name (hidden on mobile)
  - Creation date
  
- **Body**:
  - Item chips (up to 4 shown, +N more indicator)
  - Order total (large bold text)
  - Voucher savings (if any)
  - Voucher code (if applied)
  
- **Actions**:
  - QR Button (only for pending status)
  - Reorder Button (calls addToCart for all items)
  - Detail Button (navigates to order detail page)

### Status Configuration
```typescript
statusMap: {
  pending: amber, Clock icon
  confirmed: blue, CheckCircle2
  processing: purple, Loader2
  shipped: indigo, Package
  delivered: green, CheckCircle2
  cancelled: red, XCircle
  completed: emerald, CheckCircle2
}
```

### Key Components/Subcomponents
```
- OrderFiltersPanel: Status + date range filters
- OrderQrModal: Modal for QR pickup display
- OrderCard: Individual order card (memoized)
- OrderCardSkeleton: Loading placeholder
```

### State Management
```typescript
const [orders, setOrders] = useState<Order[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [filters, setFilters] = useState<OrderFilters>({ 
  page: 1, 
  page_size: 10 
});
const [pagination, setPagination] = useState({...});
const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
const [qrOrderId, setQrOrderId] = useState<string | null>(null);
```

### User Actions
1. Filter by status or date range
2. Clear individual filters
3. Reset all filters
4. Paginate (Prev/Next buttons)
5. Show QR for pending orders (opens modal)
6. Reorder (adds items to cart, navigates to checkout)
7. View order details
8. Refresh orders (KPI card button)

### Helper Functions
```typescript
// Compute order total with fallback logic
computeOrderTotal(order: Order): number {
  // Priority: cart_total → items[].subtotal → cash_amount
}

// Countdown timer for QR expiry
formatCountdown(isoString: string): {text: string; urgent: boolean}
```

### Styling Notes
- Responsive grid: 1 col (mobile) → lg:grid-cols-4 (desktop)
- Sticky sidebar on large screens
- Memoized OrderCard to prevent re-renders
- Hover effects and transitions

---

## 3. COMMON PATTERNS & SHARED UTILITIES

### Shared Components Used
```
UI Library:
- Badge (variant, className)
- Button (variant: outline|ghost|default, size: sm)
- Skeleton (for loading)
- Dialog/DialogContent (for modals)

Icons (Lucide):
- Wallet, Package, ShoppingCart, RefreshCw
- Clock, Lock, X, AlertCircle, Loader2
- CheckCircle2, XCircle, TrendingUp, ChevronRight, etc.
```

### Shared Services
```typescript
// Format utilities (from @/lib/format)
- formatIDR(amount): string  // IDR currency formatting
- formatDate(date): string    
