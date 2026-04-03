import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, ShoppingBasket, Plus, Minus, ShoppingCart, MapPin } from 'lucide-react';
import { formatIDR } from '@/lib/format';
import { mockProducts, mockCategories } from '@/data/mockData';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { toast } from 'sonner';

const KatalogPangan = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const [showCart, setShowCart] = useState(false);
  const gridRef = useStaggerChildren({ stagger: 0.05 });

  const balance = 450000;

  const filtered = mockProducts.filter((p) => {
    if (category !== 'Semua' && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = mockProducts.find((x) => x.id === id);
    return sum + (p ? p.voucherPrice * qty : 0);
  }, 0);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    toast.success('Ditambahkan ke keranjang');
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = (prev[id] || 0) + delta;
      if (next <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const checkout = () => {
    if (cartTotal > balance) {
      toast.error('Saldo tidak cukup', { description: 'Total belanja melebihi saldo e-voucher Anda.' });
      return;
    }
    toast.success('Pembelian Berhasil!', { description: `Total ${formatIDR(cartTotal)} telah dipotong dari saldo voucher Anda.` });
    setCart({});
    setShowCart(false);
  };

  const categoryEmojis: Record<string, string> = {
    'Pokok': '🌾',
    'Protein': '🥚',
    'Susu': '🥛',
    'Sayuran': '🥬',
    'Buah': '🍌',
    'Snack': '🍪',
  };

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
          {mockCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat !== 'Semua' && categoryEmojis[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div ref={gridRef} className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => {
            const inCart = cart[product.id] || 0;
            const emoji = categoryEmojis[product.category] || '🍽️';
            return (
              <Card key={product.id} className="overflow-hidden flex flex-col transition-all hover:shadow-md group">
                {/* Image area */}
                <button
                  className="aspect-[4/3] bg-secondary/30 flex items-center justify-center text-5xl relative overflow-hidden"
                  onClick={() => setSelectedProduct(product)}
                >
                  <span className="group-hover:scale-110 transition-transform">{emoji}</span>
                  {product.stock <= 20 && (
                    <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">Sisa {product.stock}</Badge>
                  )}
                </button>

                <CardContent className="p-3 flex-1 flex flex-col">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{product.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" /> {product.vendor}
                  </div>

                  <div className="mt-auto pt-2">
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-sm font-bold text-primary">{formatIDR(product.voucherPrice)}</span>
                      <span className="text-xs text-muted-foreground line-through">{formatIDR(product.price)}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-3 pt-0">
                  {inCart > 0 ? (
                    <div className="flex items-center justify-between w-full rounded-lg border border-primary/20 bg-primary/5 p-1">
                      <button onClick={() => updateQty(product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-primary/10 transition-colors">
                        <Minus className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <span className="text-sm font-semibold text-primary">{inCart}</span>
                      <button onClick={() => updateQty(product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-primary/10 transition-colors">
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
                  <DialogDescription>{selectedProduct.vendor}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center text-6xl">
                    {categoryEmojis[selectedProduct.category]}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">{formatIDR(selectedProduct.voucherPrice)}</div>
                      <div className="text-sm text-muted-foreground line-through">{formatIDR(selectedProduct.price)}</div>
                    </div>
                    <Badge variant={selectedProduct.stock > 20 ? 'secondary' : 'destructive'}>
                      Stok: {selectedProduct.stock}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {selectedProduct.vendor}
                  </div>
                  <Button className="w-full gap-2" onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null); }}>
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
                    const p = mockProducts.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex items-start gap-3 border-b border-border/50 pb-3 last:border-0">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-lg">
                          {categoryEmojis[p.category]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{formatIDR(p.voucherPrice)}</div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <button onClick={() => updateQty(id, -1)} className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"><Minus className="h-3 w-3" /></button>
                            <span className="text-sm font-medium w-6 text-center">{qty}</span>
                            <button onClick={() => updateQty(id, 1)} className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"><Plus className="h-3 w-3" /></button>
                            <span className="text-sm font-semibold text-foreground ml-auto">{formatIDR(p.voucherPrice * qty)}</span>
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
                <Button className="w-full" onClick={checkout} disabled={cartTotal > balance || cartTotal === 0}>
                  {cartTotal > balance ? 'Saldo Tidak Cukup' : `Bayar ${formatIDR(cartTotal)}`}
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
