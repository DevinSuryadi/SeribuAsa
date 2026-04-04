import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, ShoppingBasket, Plus, Minus, ShoppingCart, MapPin, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { formatIDR } from '@/lib/format';
import { getProducts, getCategories } from '@/services/products';
import { createOrder } from '@/services/orders';
import { getVoucherBalance } from '@/services/vouchers';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { toast } from 'sonner';

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

const categoryEmojis: Record<string, string> = {
  'Pokok': '🌾',
  'Protein': '🥚',
  'Susu': '🥛',
  'Sayuran': '🥬',
  'Buah': '🍌',
  'Snack': '🍪',
};

const KatalogPangan = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const gridRef = useStaggerChildren({ stagger: 0.05 });

  useEffect(() => {
    Promise.all([
      getProducts({ in_stock_only: true }).catch((err) => {
        console.error('Failed to load products:', err);
        return { items: [] };
      }),
      getCategories().catch((err) => {
        console.error('Failed to load categories:', err);
        return [];
      }),
      user?.id ? getVoucherBalance(user.id).catch((err) => {
        console.error('Failed to load balance:', err);
        return { total_balance: 0 };
      }) : Promise.resolve({ total_balance: 0 }),
    ]).then(([productsData, catsData, balanceData]) => {
      setProducts(productsData.items || []);
      const catNames = (catsData || []).map((c: any) => c.name);
      setCategories(['Semua', ...catNames]);
      setBalance(parseFloat(balanceData.total_balance || 0));
      setLoading(false);
    }).catch(() => {
      setError('Gagal memuat data');
      setLoading(false);
    });
  }, [user]);

  const filtered = useMemo(() => products.filter((p) => {
    if (category !== 'Semua' && p.category_name !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [products, category, search]);

  const cartTotal = useMemo(() => Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.id === id);
    return sum + (p ? p.voucher_price * qty : 0);
  }), [products, cart]);

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const addToCart = useCallback((id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    toast.success('Ditambahkan ke keranjang');
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) => {
      const next = (prev[id] || 0) + delta;
      if (next <= 0) {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }, []);

  const checkout = useCallback(async () => {
    if (cartTotal > balance) {
      toast.error('Saldo tidak cukup', { description: 'Total belanja melebihi saldo e-voucher Anda.' });
      return;
    }
    if (!user?.id) return;

    setCheckingOut(true);
    try {
      const vendorMap = new Map<string, { product_id: string; quantity: number; price: number }[]>();
      Object.entries(cart).forEach(([id, qty]) => {
        const p = products.find((x) => x.id === id);
        if (!p) return;
        const items = vendorMap.get(p.vendor_id) || [];
        items.push({ product_id: id, quantity: qty, price: p.voucher_price });
        vendorMap.set(p.vendor_id, items);
      });

      const promises = Array.from(vendorMap.entries()).map(([vendorId, items]) =>
        createOrder({ vendor_id: vendorId, items })
      );

      await Promise.all(promises);
      toast.success('Pembelian Berhasil!', { description: `Total ${formatIDR(cartTotal)} telah dipotong dari saldo voucher Anda.` });
      setCart({});
      setShowCart(false);
    } catch (err: any) {
      toast.error('Checkout gagal', { description: err.message });
    } finally {
      setCheckingOut(false);
    }
  }, [cartTotal, balance, user?.id, cart, products]);

  if (loading) {
    return (
      <DashboardLayout title="Katalog Pangan Bergizi" subtitle="Belanja bahan makanan bergizi dari mitra vendor terverifikasi.">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="animate-pulse space-y-3"><div className="h-32 bg-secondary rounded" /><div className="h-4 w-3/4 bg-secondary rounded" /><div className="h-4 w-1/2 bg-secondary rounded" /></div></CardContent></Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Katalog Pangan Bergizi" subtitle="Belanja bahan makanan bergizi dari mitra vendor terverifikasi.">
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
    <DashboardLayout title="Katalog Pangan Bergizi" subtitle="Belanja bahan makanan bergizi dari mitra vendor terverifikasi.">
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
          {cartTotal > 0 && (
            <div className="text-sm">
              Total keranjang: <span className={`font-bold ${cartTotal > balance ? 'text-destructive' : 'text-foreground'}`}>{formatIDR(cartTotal)}</span>
            </div>
          )}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari produk..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" className="gap-2 relative self-start" onClick={() => setShowCart(true)}>
            <ShoppingCart className="h-4 w-4" />
            Keranjang
            {cartCount > 0 && (
              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] absolute -top-2 -right-2">{cartCount}</Badge>
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
                category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat !== 'Semua' && (categoryEmojis[cat] || '🍽️')} {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div ref={gridRef} className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => {
            const inCart = cart[product.id] || 0;
            const emoji = product.category_name ? (categoryEmojis[product.category_name] || '🍽️') : '🍽️';
            return (
              <Card key={product.id} className="overflow-hidden flex flex-col transition-all hover:shadow-md group">
                <button
                  className="aspect-[4/3] bg-secondary/30 flex items-center justify-center text-5xl relative overflow-hidden"
                  onClick={() => setSelectedProduct(product)}
                  aria-label={`Lihat detail ${product.name}`}
                >
                  <span className="group-hover:scale-110 transition-transform">{emoji}</span>
                  {product.stock_quantity <= 20 && (
                    <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">Sisa {product.stock_quantity}</Badge>
                  )}
                </button>

                <CardContent className="p-3 flex-1 flex flex-col">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{product.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" /> {product.vendor_store_name || 'Vendor'}
                  </div>

                  <div className="mt-auto pt-2">
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-sm font-bold text-primary">{formatIDR(product.voucher_price)}</span>
                      <span className="text-xs text-muted-foreground line-through">{formatIDR(product.price)}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-3 pt-0">
                  {inCart > 0 ? (
                    <div className="flex items-center justify-between w-full rounded-lg border border-primary/20 bg-primary/5 p-1">
                      <button onClick={() => updateQty(product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-primary/10 transition-colors" aria-label={`Kurangi ${product.name}`}>
                        <Minus className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <span className="text-sm font-semibold text-primary">{inCart}</span>
                      <button onClick={() => updateQty(product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-primary/10 transition-colors" aria-label={`Tambah ${product.name}`}>
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      </button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full gap-1.5" onClick={() => addToCart(product.id)}>
                      <Plus className="h-3.5 w-3.5" /> Tambah
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBasket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}

        {/* Product Detail Modal */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent>
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedProduct.name}</DialogTitle>
                  <DialogDescription>{selectedProduct.vendor_store_name || 'Vendor'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center text-6xl">
                    {selectedProduct.category_name ? (categoryEmojis[selectedProduct.category_name] || '🍽️') : '🍽️'}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description || 'Tidak ada deskripsi'}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">{formatIDR(selectedProduct.voucher_price)}</div>
                      <div className="text-sm text-muted-foreground line-through">{formatIDR(selectedProduct.price)}</div>
                    </div>
                    <Badge variant={selectedProduct.stock_quantity > 20 ? 'secondary' : 'destructive'}>
                      Stok: {selectedProduct.stock_quantity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {selectedProduct.vendor_store_name || 'Vendor'}
                  </div>
                  <Button className="w-full gap-2" onClick={() => { addToCart(selectedProduct!.id); setSelectedProduct(null); }}>
                    <Plus className="h-4 w-4" /> Tambah ke Keranjang
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Cart Modal */}
        <Dialog open={showCart} onOpenChange={setShowCart}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Keranjang Belanja</DialogTitle>
              <DialogDescription>Belanja menggunakan saldo E-Voucher</DialogDescription>
            </DialogHeader>
            {Object.keys(cart).length === 0 ? (
              <div className="text-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mx-auto mb-3">
                  <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Keranjang masih kosong</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(cart).map(([id, qty]) => {
                    const p = products.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex items-start gap-3 border-b border-border/50 pb-3 last:border-0">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-lg">
                          {p.category_name ? (categoryEmojis[p.category_name] || '🍽️') : '🍽️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{formatIDR(p.voucher_price)}</div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <button onClick={() => updateQty(id, -1)} className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"><Minus className="h-3 w-3" /></button>
                            <span className="text-sm font-medium w-6 text-center">{qty}</span>
                            <button onClick={() => updateQty(id, 1)} className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"><Plus className="h-3 w-3" /></button>
                            <span className="text-sm font-semibold text-foreground ml-auto">{formatIDR(p.voucher_price * qty)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saldo tersedia</span>
                    <span className="font-medium text-foreground">{formatIDR(balance)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total Belanja</span>
                    <span className={`text-lg font-bold ${cartTotal > balance ? 'text-destructive' : 'text-primary'}`}>{formatIDR(cartTotal)}</span>
                  </div>
                  {cartTotal <= balance && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sisa saldo</span>
                      <span className="font-medium text-primary">{formatIDR(balance - cartTotal)}</span>
                    </div>
                  )}
                </div>
                <Button className="w-full" onClick={checkout} disabled={cartTotal > balance || cartTotal === 0 || checkingOut}>
                  {checkingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {checkingOut ? 'Memproses...' : cartTotal > balance ? 'Saldo Tidak Cukup' : `Bayar ${formatIDR(cartTotal)}`}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KatalogPangan;
