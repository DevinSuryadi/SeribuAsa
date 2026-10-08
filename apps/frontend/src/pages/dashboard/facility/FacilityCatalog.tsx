import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ProductAvatarLarge } from "@/components/product/ProductAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/format";
import { getCategories, getProducts, type Category } from "@/services/products";
import { listFamilies, type Family } from "@/services/facility-families";
import { createFacilityOrder } from "@/services/facility-orders";
import type { VendorProduct } from "@/types/vendor";
import { ArrowLeft, Minus, Plus, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type CartLine = { product: VendorProduct; quantity: number };

export default function FacilityCatalog() {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyError, setFamilyError] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState(familyId || "");
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setSelectedFamilyId(familyId || ""); }, [familyId]);

  useEffect(() => {
    let active = true;
    listFamilies().then((rows) => {
      if (!active) return;
      setFamilies(rows);
      if (familyId && !rows.some((family) => family.id === familyId)) setFamilyError("Keluarga tidak ditemukan pada fasilitas ini.");
    }).catch((err: unknown) => { if (active) setFamilyError(err instanceof Error ? err.message : "Gagal memuat keluarga"); });
    getCategories().then((rows) => { if (active) setCategories(rows); }).catch(() => {});
    return () => { active = false; };
  }, [familyId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProducts({ page, page_size: 12, search: search || undefined, category_id: categoryId || undefined })
      .then((result) => { if (active) { setProducts(result.items); setTotalPages(Math.max(1, result.total_pages)); setError(""); } })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Gagal memuat katalog"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, categoryId]);

  const vendorId = cart[0]?.product.vendor_id;
  const total = useMemo(() => cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0), [cart]);
  const familyName = families.find((family) => family.id === selectedFamilyId)?.head_name;

  function changeQuantity(product: VendorProduct, delta: number) {
    if (delta > 0 && vendorId && vendorId !== product.vendor_id) {
      toast.error("Satu pesanan hanya dapat berisi produk dari satu vendor. Selesaikan pesanan ini dahulu.");
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      const next = Math.max(0, Math.min(product.stock, (existing?.quantity || 0) + delta));
      if (!existing && next > 0) return [...current, { product, quantity: next }];
      return current.map((line) => line.product.id === product.id ? { ...line, quantity: next } : line).filter((line) => line.quantity > 0);
    });
  }

  async function submitOrder() {
    if (submitting || !cart.length) return;
    if (!selectedFamilyId) { toast.error("Pilih keluarga sebelum memesan."); return; }
    if (familyError || !families.some((family) => family.id === selectedFamilyId)) { toast.error("Keluarga belum dapat diverifikasi."); return; }
    setSubmitting(true);
    try {
      await createFacilityOrder({
        family_id: selectedFamilyId,
        client_request_id: crypto.randomUUID(),
        items: cart.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
      });
      setCart([]);
      toast.success("Pesanan tercatat dan dana donasi sudah dicadangkan.");
      navigate("/dashboard/health-facility/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pesanan gagal dibuat");
    } finally { setSubmitting(false); }
  }

  return (
    <DashboardLayout title="Katalog Pangan" subtitle="Pilih pangan untuk keluarga terdaftar. Pesanan dikirim ke fasilitas kesehatan Anda.">
      <div className="mx-auto max-w-[1400px] space-y-5">
        {familyId && <Button asChild variant="ghost" className="pl-0 text-primary"><Link to={`/dashboard/health-facility/families/${familyId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke keluarga</Link></Button>}
        <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <form className="flex flex-1 gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
            <Input aria-label="Cari pangan" placeholder="Cari nama pangan..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
            <Button type="submit" variant="outline"><Search className="h-4 w-4" /></Button>
          </form>
          <select aria-label="Kategori" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}>
            <option value="">Semua kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </CardContent></Card>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {error && <p className="rounded-xl bg-destructive/5 p-4 text-destructive">{error}</p>}
            {loading ? <p className="p-6 text-muted-foreground">Memuat katalog...</p> : products.length === 0 ? <p className="rounded-xl border bg-white p-6 text-muted-foreground">Belum ada produk untuk ditampilkan.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => {
                const quantity = cart.find((line) => line.product.id === product.id)?.quantity || 0;
                return <Card key={product.id} className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
                  <ProductAvatarLarge images={product.images} categoryName={product.category_name} name={product.name} className="h-40 w-full" />
                  <CardContent className="space-y-3 p-4"><div><p className="text-xs text-muted-foreground">{product.vendor_store_name || "Vendor"}</p><h3 className="font-semibold">{product.name}</h3><p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p></div>
                    <div className="flex items-end justify-between"><div><p className="font-bold text-primary">{formatIDR(product.price)}</p><p className="text-xs text-muted-foreground">per {product.unit} · stok {product.stock}</p></div>
                      <div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label={`Kurangi ${product.name}`} disabled={!quantity} onClick={() => changeQuantity(product, -1)}><Minus className="h-4 w-4" /></Button><span className="w-5 text-center text-sm">{quantity}</span><Button size="icon" variant="outline" aria-label={`Tambah ${product.name}`} disabled={product.stock <= quantity} onClick={() => changeQuantity(product, 1)}><Plus className="h-4 w-4" /></Button></div>
                    </div>
                  </CardContent></Card>;
              })}</div>
            )}
            <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button><span className="text-sm">{page} / {totalPages}</span><Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Berikutnya</Button></div>
          </div>
          <Card className="h-fit rounded-2xl border-border/70 shadow-sm lg:sticky lg:top-4"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShoppingCart className="h-5 w-5" /> Pesanan</CardTitle></CardHeader><CardContent className="space-y-4">
            <div><label htmlFor="order-family" className="mb-1 block text-sm font-medium">Keluarga penerima</label><select id="order-family" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedFamilyId} disabled={Boolean(familyId)} onChange={(event) => setSelectedFamilyId(event.target.value)}><option value="">Pilih keluarga saat akan memesan</option>{families.map((family) => <option key={family.id} value={family.id}>{family.head_name}</option>)}</select>{familyError && <p className="mt-1 text-xs text-destructive">{familyError}</p>}</div>
            {cart.length ? <div className="space-y-2 border-t pt-3">{cart.map(({ product, quantity }) => <div key={product.id} className="flex justify-between gap-2 text-sm"><span>{quantity}× {product.name}</span><span>{formatIDR(product.price * quantity)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Pilih pangan untuk mulai memesan. Katalog dapat dilihat tanpa memilih keluarga.</p>}
            <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{formatIDR(total)}</span></div>
            <p className="rounded-xl bg-primary/5 p-3 text-xs leading-5 text-primary">Total pesanan akan dicadangkan dari pool donasi. Pesanan hanya dapat dibuat jika saldo pool mencukupi.</p>
            <Button className="w-full rounded-xl" disabled={!cart.length || !selectedFamilyId || !familyName || Boolean(familyError) || submitting} onClick={submitOrder}>{submitting ? "Menyimpan..." : `Pesan untuk ${familyName || "keluarga"}`}</Button>
          </CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
