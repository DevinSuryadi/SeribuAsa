import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  ShoppingBasket,
  Plus,
  ShoppingCart,
  MapPin,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import { getProducts, getCategories } from "@/services/products";
import { addToCart, getCart } from "@/services/cart";
import { getWalletBalance } from "@/services/wallet";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";
import { toast } from "sonner";
import { ProductAvatarLarge } from "@/components/product/ProductAvatar";

type Product = {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  vendor_store_name: string | null;
  price: number;
  voucher_price: number;
  stock_quantity: number;
  unit: string;
  description: string | null;
  vendor_id: string;
  images?: string[] | null;
};

const getStockLabel = (stock: number) => {
  if (stock <= 0) return "Stok habis";
  if (stock < 10) return `${stock} item tersisa`;
  return `${stock} item tersedia`;
};

const getStockIndicatorClass = (stock: number) => {
  if (stock <= 0) {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }
  if (stock < 10) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

// ── ModalProductDetail ─────────────────────────────────────────
const ModalProductDetail = memo(function ModalProductDetail({
  product,
  onAddToCart,
  isLoading,
}: {
  product: Product;
  onAddToCart: (quantity: number) => void;
  isLoading: boolean;
}) {
  const hasStock = product.stock_quantity > 0;
  const [quantity, setQuantity] = useState(hasStock ? 1 : 0);

  useEffect(() => {
    setQuantity(hasStock ? 1 : 0);
  }, [hasStock, product.id]);

  const handleQuantityChange = (value: number) => {
    if (!hasStock) {
      setQuantity(0);
      return;
    }
    const newValue = Math.max(1, Math.min(value, product.stock_quantity));
    setQuantity(newValue);
  };

  const totalPrice = product.voucher_price * quantity;

  return (
    <div className="space-y-4">
      <div className="aspect-video w-full rounded-xl overflow-hidden">
        <ProductAvatarLarge
          images={product.images}
          categoryName={product.category_name}
          name={product.name}
          className="h-full w-full"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {product.description || "Tidak ada deskripsi"}
      </p>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Harga Voucher</div>
          <div className="text-2xl font-bold text-primary">{formatIDR(product.voucher_price)}</div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${getStockIndicatorClass(
            product.stock_quantity
          )}`}
        >
          {product.stock_quantity > 0 && product.stock_quantity < 10 && (
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {getStockLabel(product.stock_quantity)}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" /> {product.vendor_store_name || "Vendor"}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Jumlah</label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1 || isLoading}
          >
            −
          </Button>
          <Input
            type="number"
            min="1"
            max={product.stock_quantity}
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-16 text-center"
            disabled={!hasStock || isLoading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= product.stock_quantity || isLoading}
          >
            +
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            Maks: {product.stock_quantity}
          </span>
        </div>
      </div>

      {/* Total Price */}
      <div className="rounded-lg bg-primary/10 p-3 flex items-center justify-between">
        <span className="text-sm font-medium">Total:</span>
        <span className="text-lg font-bold text-primary">{formatIDR(totalPrice)}</span>
      </div>

      <Button
        className="w-full gap-2"
        onClick={() => onAddToCart(quantity)}
        disabled={!hasStock || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Menambahkan...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Tambah ke Keranjang
          </>
        )}
      </Button>
    </div>
  );
});

// ── ProductCard ────────────────────────────────────────────────
const ProductCard = memo(function ProductCard({
  product,
  onSelect,
  onAddToCart,
  addingToCart,
}: {
  product: Product;
  onSelect: (p: Product) => void;
  onAddToCart: (id: string) => void;
  addingToCart: string | null;
  pendingQuantity: number;
}) {
  const isLoading = addingToCart === product.id;
  const hasStock = product.stock_quantity > 0;

  return (
    <Card
      className={`overflow-hidden flex flex-col transition-all group ${
        hasStock
          ? "hover:shadow-md"
          : "border-slate-200 bg-slate-50 opacity-70 grayscale"
      }`}
    >
      <button
        className="relative overflow-hidden"
        onClick={() => onSelect(product)}
        aria-label={`Lihat detail ${product.name}`}
        disabled={!hasStock}
      >
        <ProductAvatarLarge
          images={product.images}
          categoryName={product.category_name}
          name={product.name}
          className="aspect-[4/3] w-full group-hover:scale-105 transition-transform duration-300"
        />
        {!hasStock && (
          <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">
            Stok Habis
          </Badge>
        )}
      </button>

      <CardContent className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="h-3 w-3" /> {product.vendor_store_name || "Vendor"}
        </div>

        <div
          className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStockIndicatorClass(
            product.stock_quantity
          )}`}
        >
          {product.stock_quantity > 0 && product.stock_quantity < 10 && (
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {getStockLabel(product.stock_quantity)}
        </div>

        <div className="mt-auto pt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Harga Voucher</span>
            <span className="text-sm font-bold text-primary">
              {formatIDR(product.voucher_price)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={() => onAddToCart(product.id)}
          disabled={isLoading || !hasStock}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Menambahkan...
            </>
          ) : !hasStock ? (
            "Stok Habis"
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
});

const KatalogPangan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState<string | null>(null); // track which product is loading
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Local state untuk cart items yang sedang di-add dengan quantity
  const [pendingCartItems, setPendingCartItems] = useState<Map<string, number>>(new Map());

  const itemsPerPage = 12;
  const gridRef = useStaggerChildren({ stagger: 0.05 });
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      // Check cache
      if (
        !forceRefresh &&
        lastUpdated &&
        Date.now() - lastUpdated.getTime() < CACHE_DURATION &&
        products.length > 0
      ) {
        console.log("Using cached data");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [productsData, catsData, balanceData, cartData] = await Promise.all([
          getProducts({ page_size: 100 }).catch((err) => {
            console.error("Failed to load products:", err);
            return { items: [] };
          }),
          getCategories().catch((err) => {
            console.error("Failed to load categories:", err);
            return [];
          }),
          user?.id
            ? getWalletBalance().catch((err) => {
                console.error("Failed to load balance:", err);
                return { wallet_available: 0 };
              })
            : Promise.resolve({ wallet_available: 0 }),
          user?.id
            ? getCart().catch((err) => {
                console.error("Failed to load cart:", err);
                return { items: [] };
              })
            : Promise.resolve({ items: [] }),
        ]);

        setProducts((productsData.items || []) as unknown as Product[]);
        const catNames = (catsData || []).map((c: any) => c.name);
        setCategories(["Semua", ...catNames]);
        setBalance(Number(balanceData.wallet_available || 0));
        setCartItemCount((cartData.items || []).length);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Gagal memuat data");
        setLoading(false);
      }
    },
    [user, products.length, lastUpdated]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(
    () =>
      products
        .filter((p) => {
          if (category !== "Semua" && p.category_name !== category) return false;
          if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
          return true;
        })
        .sort((a, b) => {
          const aOutOfStock = a.stock_quantity <= 0;
          const bOutOfStock = b.stock_quantity <= 0;
          if (aOutOfStock !== bOutOfStock) return aOutOfStock ? 1 : -1;
          return 0;
        }),
    [products, category, search]
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const addToCartHandler = useCallback(
    async (productId: string, quantity: number = 1) => {
      if (addingToCart || quantity <= 0) return;

      // Find product for optimistic update
      const product = products.find((p) => p.id === productId);
      if (!product || product.stock_quantity < quantity) {
        toast.error("Stok tidak cukup");
        return;
      }

      // Store original state for rollback
      const originalStock = product.stock_quantity;
      const originalCartCount = cartItemCount;
      const originalPendingItems = new Map(pendingCartItems);

      setAddingToCart(productId);
      try {
        // 1. Optimistic update: update local state immediately
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, stock_quantity: Math.max(0, p.stock_quantity - quantity) }
              : p
          )
        );

        // 2. Increment cart count (by 1 item, not quantity — backend merges existing items)
        setCartItemCount((prev) => prev + 1);

        // 3. Track pending cart item (for UI feedback)
        setPendingCartItems((prev) => {
          const updated = new Map(prev);
          updated.set(productId, (updated.get(productId) || 0) + quantity);
          return updated;
        });

        // 4. Make API call in background
        await addToCart({
          product_id: productId,
          quantity: quantity,
        });

        // 5. Clear pending item after successful add
        setPendingCartItems((prev) => {
          const updated = new Map(prev);
          updated.delete(productId);
          return updated;
        });

        toast.success(`${quantity} item ditambahkan ke keranjang`);
      } catch (err: any) {
        // Rollback on error - restore original state
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock_quantity: originalStock } : p))
        );
        setCartItemCount(originalCartCount);
        setPendingCartItems(originalPendingItems);

        const errorMsg = err.message || "Coba lagi";
        toast.error("Gagal menambahkan ke keranjang", {
          description: errorMsg,
        });
        console.error("Add to cart error:", err);
      } finally {
        setAddingToCart(null);
      }
    },
    [products, addingToCart, cartItemCount, pendingCartItems]
  );

  if (loading) {
    return (
      <DashboardLayout
        title="Katalog Pangan Bergizi"
        subtitle="Belanja bahan makanan bergizi dari mitra vendor terverifikasi."
      >
        {/* Skeleton Balance Bar */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-secondary animate-pulse" />
            <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
            <div className="h-4 w-20 bg-secondary rounded animate-pulse" />
          </div>
        </div>

        {/* Skeleton Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row mb-6">
          <div className="h-10 flex-1 bg-secondary rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-secondary rounded animate-pulse" />
            <div className="h-10 w-32 bg-secondary rounded animate-pulse" />
          </div>
        </div>

        {/* Skeleton Category Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-secondary rounded-full animate-pulse" />
          ))}
        </div>

        {/* Skeleton Product Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              {/* Skeleton Image Area */}
              <div className="aspect-[4/3] bg-secondary/30 animate-pulse" />

              <CardContent className="p-3">
                {/* Skeleton Product Name */}
                <div className="h-4 bg-secondary rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-secondary rounded animate-pulse mb-3" />

                {/* Skeleton Vendor Name */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="h-3 w-3 bg-secondary rounded animate-pulse" />
                  <div className="h-3 w-20 bg-secondary rounded animate-pulse" />
                </div>

                {/* Skeleton Price Section */}
                <div className="mt-auto">
                  <div className="h-3 w-24 bg-secondary rounded animate-pulse mb-1" />
                  <div className="h-5 w-28 bg-secondary rounded animate-pulse" />
                </div>
              </CardContent>

              {/* Skeleton Button */}
              <div className="p-3 pt-0">
                <div className="h-9 w-full bg-secondary rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Katalog Pangan Bergizi"
        subtitle="Belanja bahan makanan bergizi dari mitra vendor terverifikasi."
      >
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)}>
            <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Katalog Pangan Bergizi"
      subtitle="Belanja bahan makanan bergizi dari mitra vendor terverifikasi."
    >
      <div className="space-y-6">
        {/* Balance Bar */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingBasket className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Saldo E-Voucher:</span>
            <span className="font-bold text-primary">{formatIDR(balance)}</span>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => fetchData(true)}
            disabled={loading}
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            className="gap-2 self-start relative"
            onClick={() => navigate("/dashboard/cart")}
          >
            <ShoppingCart className="h-4 w-4" />
            Lihat Keranjang
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div ref={gridRef} className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={setSelectedProduct}
              onAddToCart={addToCartHandler}
              addingToCart={addingToCart}
              pendingQuantity={pendingCartItems.get(product.id) || 0}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Berikutnya
            </Button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBasket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Coba ubah filter atau kata kunci pencarian
            </p>
            {(search || category !== "Semua") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setCategory("Semua");
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            )}
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-center text-xs text-muted-foreground pt-4">
            Data diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
          </div>
        )}

        {/* Product Detail Modal */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent>
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedProduct.name}</DialogTitle>
                  <DialogDescription>
                    {selectedProduct.vendor_store_name || "Vendor"}
                  </DialogDescription>
                </DialogHeader>
                <ModalProductDetail
                  product={selectedProduct}
                  onAddToCart={(quantity) => {
                    addToCartHandler(selectedProduct.id, quantity);
                    // Don't close modal immediately - let user see confirmation
                    setTimeout(() => setSelectedProduct(null), 800);
                  }}
                  isLoading={addingToCart === selectedProduct.id}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KatalogPangan;
