import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ProductImageTile } from "@/components/product/ProductImageTile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "@/lib/format";
import { getCategories, getProducts, type Category } from "@/services/products";
import { getMyFacility, listFamilies, type Family } from "@/services/facility-families";
import { createFacilityOrder } from "@/services/facility-orders";
import { listEligibleVendors, type EligibleVendor } from "@/services/facility-orders";
import { getProvinces, getRegencies, type Province, type Regency } from "@/services/regions";
import type { VendorProduct } from "@/types/vendor";
import { ArrowLeft, Minus, Plus, Search } from "lucide-react";
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
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [vendors, setVendors] = useState<EligibleVendor[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [regencyCode, setRegencyCode] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [regionError, setRegionError] = useState("");
  const [regionRetryKey, setRegionRetryKey] = useState(0);
  const [productRetryKey, setProductRetryKey] = useState(0);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const regionChanged = useRef(false);
  const [profileRegionError, setProfileRegionError] = useState("");

  useEffect(() => {
    let active = true;
    getMyFacility(true).then((facility) => {
      if (!active) return;
      setProfileRegionError("");
      if (!regionChanged.current && facility.province_code && facility.regency_code) {
        setProvinceCode(facility.province_code);
        setRegencyCode(facility.regency_code);
      }
    }).catch(() => { if (active) setProfileRegionError("Wilayah profil gagal dimuat. Pilih wilayah secara manual."); });
    return () => { active = false; };
  }, [regionRetryKey]);

  useEffect(() => { setSelectedFamilyId(familyId || ""); }, [familyId]);

  useEffect(() => {
    getMyFacility(true).then((facility) => setMissingAddress(!facility.address?.trim())).catch(() => {});
  }, []);

  async function saveAddress() {
    setSavingAddress(true);
    try {
      await updateMyFacilityContact({ address: addressDraft.trim() });
      setMissingAddress(false);
      toast.success("Alamat faskes disimpan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan alamat");
    } finally { setSavingAddress(false); }
  }

  useEffect(() => {
    let active = true;
    listFamilies().then((rows) => {
      if (!active) return;
      setFamilies(rows);
      setFamilyError(familyId && !rows.some((family) => family.id === familyId) ? "Keluarga tidak ditemukan pada fasilitas ini." : "");
    }).catch((err: unknown) => { if (active) setFamilyError(err instanceof Error ? err.message : "Gagal memuat keluarga"); });
    getCategories().then((rows) => { if (active) setCategories(rows); }).catch(() => {});
    getProvinces().then((rows) => { if (active) { setProvinces(rows); setRegionError(""); } }).catch(() => { if (active) setRegionError("Daftar provinsi gagal dimuat."); });
    return () => { active = false; };
  }, [familyId, regionRetryKey]);

  useEffect(() => {
    if (!provinceCode) { setRegencies([]); return; }
    let active = true;
    getRegencies(provinceCode)
      .then((rows) => { if (active) { setRegencies(rows); setRegionError(""); } })
      .catch(() => { if (active) { setRegencies([]); setRegionError("Daftar kota/kabupaten gagal dimuat."); } });
    return () => { active = false; };
  }, [provinceCode, regionRetryKey]);

  useEffect(() => {
    if (!provinceCode || !regencyCode) { setVendors([]); return; }
    let active = true;
    setVendorLoading(true);
    listEligibleVendors(provinceCode, regencyCode)
      .then((rows) => { if (active) { setVendors(rows); setRegionError(""); } })
      .catch((err: unknown) => { if (active) { setVendors([]); setRegionError(err instanceof Error ? err.message : "Daftar vendor gagal dimuat."); } })
      .finally(() => { if (active) setVendorLoading(false); });
    return () => { active = false; };
  }, [provinceCode, regencyCode, regionRetryKey]);

  useEffect(() => {
    if (!provinceCode || !regencyCode) { setProducts([]); setTotalPages(1); setLoading(false); return; }
    let active = true;
    setLoading(true);
    getProducts({ page, page_size: 12, search: search || undefined, category_id: categoryId || undefined,
      vendor_id: selectedVendorId || undefined, service_regency_code: regencyCode,
      vendor_regency_code: regencyCode, in_stock_only: true })
      .then((result) => { if (active) { setProducts(result.items); setTotalPages(Math.max(1, result.total_pages)); setError(""); } })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Gagal memuat katalog"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, categoryId, selectedVendorId, provinceCode, regencyCode, productRetryKey]);

  const vendorId = cart[0]?.product.vendor_id;
  const total = useMemo(() => cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0), [cart]);
  const familyName = families.find((family) => family.id === selectedFamilyId)?.head_name;

  function changeRegion(province: string, regency: string) {
    regionChanged.current = true;
    setProfileRegionError("");
    if (province !== provinceCode) setRegencies([]);
    setProvinceCode(province);
    setRegencyCode(regency);
    setVendors([]);
    setSelectedVendorId("");
    setCart([]);
    setPage(1);
  }

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
    if (!provinceCode || !regencyCode || !vendorId || !vendors.some((vendor) => vendor.id === vendorId) || cart.some(({ product }) => product.vendor_id !== vendorId || product.service_regency_code !== regencyCode)) {
      toast.error("Pilih daerah dan vendor yang sesuai dengan seluruh produk."); return;
    }
    setSubmitting(true);
    try {
      await createFacilityOrder({
        family_id: selectedFamilyId,
        vendor_id: vendorId,
        service_province_code: provinceCode,
        service_regency_code: regencyCode,
        client_request_id: crypto.randomUUID(),
        items: cart.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
      });
      setCart([]);
      toast.success("Pesanan diteruskan ke vendor dan dana sudah dicadangkan.");
      navigate("/dashboard/health-facility/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pesanan gagal dibuat");
    } finally { setSubmitting(false); }
  }

  return (
    <DashboardLayout title="Katalog Pangan" subtitle="Pilih pangan untuk keluarga terdaftar. Wilayah awal mengikuti profil fasilitas kesehatan.">
      <div className="space-y-6">
        {familyId && <Button asChild variant="ghost" className="pl-0 text-primary"><Link to={`/dashboard/health-facility/families/${familyId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke keluarga</Link></Button>}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardHeader><CardTitle className="text-base font-bold text-slate-900">Pilih daerah dan vendor</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">
          <div><label htmlFor="catalog-province" className="mb-1 block text-sm font-medium">Provinsi</label><select id="catalog-province" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" value={provinceCode} onChange={(event) => changeRegion(event.target.value, "")}><option value="">Pilih provinsi</option>{provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}</select></div>
          <div><label htmlFor="catalog-regency" className="mb-1 block text-sm font-medium">Kota/kabupaten</label><select id="catalog-regency" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" value={regencyCode} disabled={!provinceCode || !regencies.length} onChange={(event) => changeRegion(provinceCode, event.target.value)}><option value="">Pilih kota/kabupaten</option>{regencies.map((regency) => <option key={regency.code} value={regency.code}>{regency.name}</option>)}</select></div>
          <div><label htmlFor="catalog-vendor" className="mb-1 block text-sm font-medium">Vendor</label><select id="catalog-vendor" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" value={selectedVendorId} disabled={!regencyCode || vendorLoading || !vendors.length} onChange={(event) => { setSelectedVendorId(event.target.value); setCart([]); setPage(1); }}><option value="">{vendorLoading ? "Memuat vendor..." : "Semua vendor"}</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.store_name} ({vendor.product_count} produk)</option>)}</select></div>
          {(profileRegionError || regionError) && (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive sm:col-span-3">
              <span>{profileRegionError || regionError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setRegionRetryKey((key) => key + 1)}>Coba lagi</Button>
            </div>
          )}
          {regencyCode && !vendorLoading && !regionError && vendors.length === 0 && <p className="sm:col-span-3 text-sm text-muted-foreground">Belum ada vendor aktif dengan produk tersedia di daerah ini.</p>}
        </CardContent></Card>
        <Card className="rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <form className="flex flex-1 gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
            <Input aria-label="Cari pangan" className="h-10 rounded-xl border-slate-200" placeholder="Cari nama pangan..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
            <Button type="submit" variant="outline" className="rounded-full"><Search className="h-4 w-4" /></Button>
          </form>
          <select aria-label="Kategori" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}>
            <option value="">Semua kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </CardContent></Card>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {!provinceCode || !regencyCode ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Pilih provinsi dan kota/kabupaten untuk melihat produk.</p> : loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Memuat katalog">
                {[0, 1, 2].map((item) => <Skeleton key={item} className="h-72 rounded-2xl" />)}
              </div>
            ) : error ? (
              <ErrorState title="Gagal memuat katalog" message={error} onRetry={() => setProductRetryKey((key) => key + 1)} />
            ) : products.length === 0 ? (
              <div className="rounded-[20px] bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
                <EmptyState
                  title={search || categoryId ? "Produk tidak ditemukan" : "Belum ada produk"}
                  description={search || categoryId ? "Coba ubah kata pencarian atau kategori." : selectedVendorId ? "Vendor ini belum memiliki produk yang tersedia." : "Belum ada produk yang tersedia di wilayah ini."}
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => {
                const quantity = cart.find((line) => line.product.id === product.id)?.quantity || 0;
                return <Card key={product.id} className="group overflow-hidden rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
                  <ProductImageTile images={product.images} categoryName={product.category_name} name={product.name} />
                  <CardContent className="space-y-3 p-4"><div><p className="text-xs text-muted-foreground">{product.vendor_store_name || "Vendor"}</p><h3 className="font-semibold text-slate-900">{product.name}</h3><p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p></div>
                    <div className="flex items-end justify-between"><div><p className="font-bold text-primary">{formatIDR(product.price)}</p><p className="text-xs text-muted-foreground">per {product.unit} · stok {product.stock}</p></div>
                      <div className="flex items-center gap-2"><Button size="icon" variant="outline" className="h-9 w-9 rounded-full" aria-label={`Kurangi ${product.name}`} disabled={!quantity} onClick={() => changeQuantity(product, -1)}><Minus className="h-4 w-4" /></Button><span className="w-5 text-center text-sm">{quantity}</span><Button size="icon" variant="outline" className="h-9 w-9 rounded-full" aria-label={`Tambah ${product.name}`} disabled={product.stock <= quantity} onClick={() => changeQuantity(product, 1)}><Plus className="h-4 w-4" /></Button></div>
                    </div>
                  </CardContent></Card>;
              })}</div>
            )}
            <div className="flex items-center justify-end gap-3"><Button variant="outline" className="rounded-full" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button><span className="text-sm">{page} / {totalPages}</span><Button variant="outline" className="rounded-full" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Berikutnya</Button></div>
          </div>
          <Card id="order-summary" className="h-fit scroll-mt-4 rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)] lg:sticky lg:top-4"><CardHeader><CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">Pesanan</CardTitle></CardHeader><CardContent className="space-y-4">
            <div><label htmlFor="order-family" className="mb-1 block text-sm font-medium">Keluarga penerima</label><select id="order-family" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" value={selectedFamilyId} disabled={Boolean(familyId)} onChange={(event) => setSelectedFamilyId(event.target.value)}><option value="">Pilih keluarga saat akan memesan</option>{families.map((family) => <option key={family.id} value={family.id}>{family.head_name}</option>)}</select>{familyError && <p className="mt-1 text-xs text-destructive">{familyError}</p>}</div>
            {cart.length ? <div className="space-y-2 border-t pt-3">{cart.map(({ product, quantity }) => <div key={product.id} className="flex justify-between gap-2 text-sm"><span>{quantity}× {product.name}</span><span>{formatIDR(product.price * quantity)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Pilih pangan untuk mulai memesan. Katalog dapat dilihat tanpa memilih keluarga.</p>}
            <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{formatIDR(total)}</span></div>
            {missingAddress && (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <label htmlFor="facility-address" className="block text-sm font-medium text-amber-900">Alamat faskes belum diisi. Vendor butuh alamat ini untuk mengirim pesanan.</label>
                <Input id="facility-address" className="h-10 rounded-xl border-amber-200 bg-white" maxLength={500} placeholder="Alamat lengkap faskes" value={addressDraft} onChange={(event) => setAddressDraft(event.target.value)} />
                <Button type="button" variant="outline" size="sm" className="w-full rounded-full bg-white" disabled={savingAddress || addressDraft.trim().length < 5} onClick={() => { void saveAddress(); }}>{savingAddress ? "Menyimpan..." : "Simpan alamat"}</Button>
              </div>
            )}
            <p className="rounded-xl bg-primary/5 p-3 text-xs leading-5 text-primary">Pesanan langsung diteruskan ke vendor. Dana donasi dicadangkan saat memesan; pastikan produk dan keluarga penerima sudah sesuai.</p>
            <Button className="w-full rounded-xl" disabled={!cart.length || !selectedFamilyId || !familyName || !vendorId || vendorLoading || Boolean(familyError) || submitting} onClick={submitOrder}>{submitting ? "Menyimpan..." : `Pesan untuk ${familyName || "keluarga"}`}</Button>
          </CardContent></Card>
        </div>
        {cart.length > 0 && (
          <div className="sticky bottom-3 z-20 lg:hidden">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10">
              <div className="min-w-0 text-sm">
                <p className="text-xs text-slate-500">{cart.reduce((sum, line) => sum + line.quantity, 0)} item dipilih</p>
                <p className="font-bold text-slate-900">{formatIDR(total)}</p>
              </div>
              <Button className="shrink-0 rounded-full" onClick={() => document.getElementById("order-summary")?.scrollIntoView({ behavior: "smooth" })}>
                Lihat pesanan
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
