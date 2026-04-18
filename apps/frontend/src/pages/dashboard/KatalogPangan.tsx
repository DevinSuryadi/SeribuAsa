import { useState, useEffect, useMemo, useCallback, type ComponentType } from "react";
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
  Wheat,
  Egg,
  Milk,
  Carrot,
  Apple,
  Package,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import { getProducts, getCategories } from "@/services/products";
import { addToCart } from "@/services/cart";
import { getVoucherBalance } from "@/services/vouchers";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";
import { toast } from "sonner";

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
};

const categoryIcons: Record<string, ComponentType<{ className?: string }>> = {
  Pokok: Wheat,
  Protein: Egg,
  Susu: Milk,
  Sayuran: Carrot,
  Buah: Apple,
  Snack: Package,
};

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
  const [addingToCart, setAddingToCart] = useState(false);
  const gridRef = useStaggerChildren({ stagger: 0.05 });

  useEffect(() => {
    Promise.all([
      getProducts({ in_stock_only: true }).catch((err) => {
        console.error("Failed to load products:", err);
        return { items: [] };
      }),
      getCategories().catch((err) => {
        console.error("Failed to load categories:", err);
        return [];
      }),
      user?.id
        ? getVoucherBalance(user.id).catch((err) => {
            console.error("Failed to load balance:", err);
            return { total_balance: 0 };
          })
        : Promise.resolve({ total_balance: 0 }),
    ])
      .then(([productsData, catsData, balanceData]) => {
        setProducts(productsData.items || []);
        const catNames = (catsData || []).map((c: any) => c.name);
        setCategories(["Semua", ...catNames]);
        setBalance(parseFloat(balanceData.total_balance || 0));
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat data");
        setLoading(false);
      });
  }, [user]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (category !== "Semua" && p.category_name !== category) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [products, category, search]
  );

  const addToCartHandler = useCallback(
    async (productId: string) => {
      if (addingToCart) return;
      setAddingToCart(true);
      try {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        await addToCart({
          product_id: productId,
          quantity: 1,
        });
        toast.success("Ditambahkan ke keranjang");
      } catch (err: any) {
        toast.error("Gagal menambahkan ke keranjang", {
          description: err.message || "Coba lagi",
        });
      } finally {
        setAddingToCart(false);
      }
    },
    [products, addingToCart]
  );

  if (loading) {
    return (
      <DashboardLayout
        title="Katalog Pangan Bergizi"
        subtitle="Belanja bahan makanan bergizi dari mitra vendor terverifikasi."
      >
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-32 bg-secondary rounded" />
                  <div className="h-4 w-3/4 bg-secondary rounded" />
                  <div className="h-4 w-1/2 bg-secondary rounded" />
                </div>
              </CardContent>
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
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
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
            className="gap-2 self-start"
            onClick={() => navigate("/dashboard/cart")}
          >
            <ShoppingCart className="h-4 w-4" />
            Lihat Keranjang
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
          {filtered.map((product) => {
            const ProductIcon = product.category_name
              ? categoryIcons[product.category_name] || Package
              : Package;
            return (
              <Card
                key={product.id}
                className="overflow-hidden flex flex-col transition-all hover:shadow-md group"
              >
                <button
                  className="aspect-[4/3] bg-secondary/30 flex items-center justify-center relative overflow-hidden"
                  onClick={() => setSelectedProduct(product)}
                  aria-label={`Lihat detail ${product.name}`}
                >
                  <span className="group-hover:scale-110 transition-transform rounded-full bg-white/80 p-4">
                    <ProductIcon className="h-10 w-10 text-primary" />
                  </span>
                  {product.stock_quantity <= 20 && (
                    <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">
                      Sisa {product.stock_quantity}
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

                  <div className="mt-auto pt-2">
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-sm font-bold text-primary">
                        {formatIDR(product.voucher_price)}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatIDR(product.price)}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-3 pt-0">
                  <Button
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => addToCartHandler(product.id)}
                    disabled={addingToCart}
                  >
                    {addingToCart ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {addingToCart ? "Menambahkan..." : "Tambah"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBasket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Coba ubah filter atau kata kunci pencarian
            </p>
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
                <div className="space-y-4">
                  <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center text-6xl">
                    {(() => {
                      const SelectedIcon = selectedProduct.category_name
                        ? categoryIcons[selectedProduct.category_name] || Package
                        : Package;
                      return <SelectedIcon className="h-16 w-16 text-primary" />;
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.description || "Tidak ada deskripsi"}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {formatIDR(selectedProduct.voucher_price)}
                      </div>
                      <div className="text-sm text-muted-foreground line-through">
                        {formatIDR(selectedProduct.price)}
                      </div>
                    </div>
                    <Badge
                      variant={selectedProduct.stock_quantity > 20 ? "secondary" : "destructive"}
                    >
                      Stok: {selectedProduct.stock_quantity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {selectedProduct.vendor_store_name || "Vendor"}
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      addToCartHandler(selectedProduct!.id);
                      setSelectedProduct(null);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Tambah ke Keranjang
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KatalogPangan;
