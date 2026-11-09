import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Trash2,
  Loader2,
  Package,
  ImagePlus,
  X,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from "@/services/products";
import { uploadImage } from "@/services/upload";
import { getProvinces, getRegencies, type Province, type Regency } from "@/services/regions";
import type { VendorProduct } from "@/types/vendor";
import type { Category } from "@/services/products";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { productApprovalConfig } from "@/lib/status-config";
import { ProductImageTile } from "@/components/product/ProductImageTile";

interface ProductFormState {
  name: string;
  category: string;
  price: string;
  voucherPrice: string;
  stock: string;
  unit: string;
  serviceProvinceCode: string;
  serviceRegencyCode: string;
  images: string[];
}

const DEFAULT_FORM: ProductFormState = {
  name: "",
  category: "",
  price: "",
  voucherPrice: "",
  stock: "",
  unit: "pcs",
  serviceProvinceCode: "",
  serviceRegencyCode: "",
  images: [],
};

type StatusFilter = "all" | "approved" | "pending" | "rejected";

const statusTabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "approved", label: "Disetujui" },
  { key: "pending", label: "Menunggu" },
  { key: "rejected", label: "Ditolak" },
];

const pageSize = 12;
const unitOptions = ["pcs", "kg", "gr", "liter", "pack", "ikat"];
const selectClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50";

function voucherDiscount(product: VendorProduct) {
  if (product.price <= 0) return 0;
  return Math.max(0, Math.round((1 - product.voucher_price / product.price) * 100));
}

const statusTone: Record<string, string> = {
  approved: "text-emerald-700",
  pending: "text-amber-700",
  rejected: "text-red-600",
};

const KelolaProduk = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [regionError, setRegionError] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<VendorProduct | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [form, setForm] = useState<ProductFormState>(DEFAULT_FORM);

  const setField =
    (key: keyof ProductFormState) =>
    (value: string) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsData, catsData] = await Promise.all([
        getProducts({ vendor_id: user?.id || "" }),
        getCategories(),
      ]);

      setProducts(productsData.items || []);
      setCategories(catsData || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal memuat data produk";
      setError(msg);
      toast.error("Gagal memuat data produk");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    getProvinces().then(setProvinces).catch(() => setRegionError("Daftar provinsi gagal dimuat."));
  }, []);

  useEffect(() => {
    if (!form.serviceProvinceCode) { setRegencies([]); return; }
    let active = true;
    getRegencies(form.serviceProvinceCode)
      .then((rows) => { if (active) { setRegencies(rows); setRegionError(""); } })
      .catch(() => { if (active) { setRegencies([]); setRegionError("Daftar kota/kabupaten gagal dimuat."); } });
    return () => { active = false; };
  }, [form.serviceProvinceCode]);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: products.length,
      approved: 0,
      pending: 0,
      rejected: 0,
    };
    products.forEach((product) => {
      if (product.approval_status in result) {
        result[product.approval_status as StatusFilter] += 1;
      }
    });
    return result;
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchSearch =
        !searchQ || product.name.toLowerCase().includes(searchQ.toLowerCase());

      const matchStatus =
        statusFilter === "all"
          ? true
          : product.approval_status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [products, searchQ, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openForm = (product?: VendorProduct) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name,
        category: product.category || "",
        price: String(product.price),
        voucherPrice: String(product.voucher_price),
        stock: String(product.stock),
        unit: product.unit || "pcs",
        serviceProvinceCode: product.service_province_code || "",
        serviceRegencyCode: product.service_regency_code || "",
        images: product.images || [],
      });
    } else {
      setEditingProduct(null);
      setForm(DEFAULT_FORM);
    }

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || form.voucherPrice === "" || !form.serviceProvinceCode || !form.serviceRegencyCode) {
      toast.error("Lengkapi semua field wajib");
      return;
    }

    const priceNum = parseFloat(form.price);
    const voucherPriceNum = parseFloat(form.voucherPrice);
    const stockNum = form.stock.trim() === "" ? 0 : Number(form.stock);

    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Harga produk harus lebih dari 0");
      return;
    }

    if (Number.isNaN(voucherPriceNum) || voucherPriceNum < 0) {
      toast.error("Harga voucher tidak boleh negatif");
      return;
    }

    if (voucherPriceNum > priceNum) {
      toast.error("Harga voucher tidak boleh melebihi harga produk");
      return;
    }

    if (!Number.isInteger(stockNum) || stockNum < 0) {
      toast.error("Stok harus berupa angka bulat dan tidak boleh negatif");
      return;
    }

    if (!regencies.some((region) => region.code === form.serviceRegencyCode)) {
      toast.error("Pilih kota/kabupaten yang sesuai dengan provinsi.");
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        name: form.name,
        category_id: form.category || undefined,
        price: priceNum,
        voucher_price: voucherPriceNum,
        stock_quantity: stockNum,
        unit: form.unit,
        images: form.images.length > 0 ? form.images : undefined,
        service_province_code: form.serviceProvinceCode,
        service_regency_code: form.serviceRegencyCode,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success("Produk diperbarui");
      } else {
        await createProduct(data);
        toast.success("Produk ditambahkan");
      }

      closeForm();
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan produk";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: VendorProduct) => {
    if (!window.confirm(`Hapus "${product.name}"?`)) return;

    try {
      await deleteProduct(product.id);
      toast.success(`"${product.name}" dihapus`);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus produk";
      toast.error(msg);
    }
  };

  const discountPct = useMemo(() => {
    const p = parseFloat(form.price);
    const vp = parseFloat(form.voucherPrice);

    if (!p || !vp || p === 0) return 0;
    return Math.max(0, Math.round((1 - vp / p) * 100));
  }, [form.price, form.voucherPrice]);

  const categoryNameMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  const approvalOf = (product: VendorProduct) =>
    productApprovalConfig[
      product.approval_status as keyof typeof productApprovalConfig
    ] || productApprovalConfig.pending;

  const categoryOf = (product: VendorProduct) =>
    categoryNameMap.get(product.category || "") ||
    product.category ||
    "Tanpa kategori";

  return (
    <DashboardLayout
      title="Kelola Produk"
      subtitle="Tambah, edit, dan pantau status persetujuan produk pangan Anda."
      actions={
        <Button className="rounded-full" onClick={() => openForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="flex max-w-full overflow-x-auto rounded-full bg-[#ececef] p-1 [scrollbar-width:none]"
          aria-label="Filter status produk"
        >
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                className={`flex-1 shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-all duration-200 sm:px-4 ${
                  active
                    ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
              >
                {tab.label} <span className="text-slate-500">{counts[tab.key]}</span>
              </button>
            );
          })}
        </nav>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            aria-label="Cari produk"
            className="h-9 rounded-full border-0 bg-[#ececef] pl-9 text-sm shadow-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-0"
            placeholder="Cari produk"
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-96 rounded-[20px]" />)}
        </div>
      ) : error ? (
        <ErrorState
          title="Gagal memuat produk"
          message={error}
          onRetry={fetchData}
        />
      ) : products.length === 0 ? (
        <div className="rounded-[20px] bg-white">
          <EmptyState
            icon={<Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />}
            title="Belum ada produk"
            description="Tambahkan produk pangan pertama Anda untuk ditinjau admin."
            action={{ label: "Tambah Produk", onClick: () => openForm() }}
          />
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="rounded-[20px] bg-white px-5 py-16 text-center">
          <p className="text-[17px] font-semibold tracking-tight text-slate-900">Produk tidak ditemukan</p>
          <p className="mt-1 text-[13px] text-slate-500">Coba ubah kata kunci atau status produk.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 rounded-full bg-slate-900/[0.06] px-4 text-[13px] font-medium hover:bg-slate-900/10"
            onClick={() => {
              setSearchQ("");
              setStatusFilter("all");
              setPage(1);
            }}
          >
            Reset filter
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visibleRows.map((product) => {
              const categoryLabel = categoryOf(product);
              const discount = voucherDiscount(product);
              return (
                <article
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-[20px] bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[2px_4px_20px_rgba(0,0,0,0.12)]"
                >
                  <ProductImageTile images={product.images} name={product.name} categoryName={categoryLabel} />

                  <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                    <p className={`text-xs font-medium ${statusTone[product.approval_status] || statusTone.pending}`}>
                      {approvalOf(product).label}
                    </p>
                    <h3 className="mt-1 truncate text-[17px] font-semibold tracking-tight text-slate-900" title={product.name}>
                      {product.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[13px] text-slate-500">
                      {categoryLabel} · {product.service_regency_name || "Wilayah belum diisi"}
                    </p>

                    <dl className="mt-3 divide-y divide-slate-100 text-[13px]">
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-slate-500">Harga</dt>
                        <dd className="text-slate-900">{formatIDR(product.price)}</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-slate-500">Harga voucher</dt>
                        <dd className="font-semibold text-slate-900">
                          {discount > 0 && <span className="mr-1.5 font-normal text-emerald-700">Diskon {discount}%</span>}
                          {formatIDR(product.voucher_price)}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-slate-500">Stok</dt>
                        <dd className="text-slate-900">{product.stock} {product.unit}</dd>
                      </div>
                    </dl>

                    <div className="mt-auto flex items-center gap-2 pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 rounded-full bg-slate-900/[0.06] text-[13px] font-medium text-slate-900 hover:bg-slate-900/10"
                        onClick={() => openForm(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Hapus ${product.name}`}
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <footer className="flex items-center justify-between gap-3 px-1 text-[13px] text-slate-500">
            <span>Menampilkan {visibleRows.length} dari {filtered.length} produk</span>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full bg-slate-900/[0.06] text-[13px] font-medium text-slate-900 hover:bg-slate-900/10"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full bg-slate-900/[0.06] text-[13px] font-medium text-slate-900 hover:bg-slate-900/10"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </footer>
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-[20px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Produk" : "Tambah Produk"}
            </DialogTitle>
            <DialogDescription>
              Produk baru akan ditinjau admin sebelum tampil di katalog.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload Area */}
            <div className="space-y-1.5">
              <Label>Foto produk</Label>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img src={img} alt={`Foto produk ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Hapus foto ${idx + 1}`}
                      onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {form.images.length < 3 && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-700">
                    {uploadingImg ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="mb-1 h-5 w-5" />
                        <span className="text-xs">Unggah</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImg}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("Ukuran maksimal gambar adalah 2MB");
                          return;
                        }

                        setUploadingImg(true);
                        try {
                          const { url, error } = await uploadImage(file);
                          if (error) throw new Error(error);
                          if (url) {
                            setForm(prev => ({ ...prev, images: [...prev.images, url] }));
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Gagal upload gambar");
                        } finally {
                          setUploadingImg(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Maksimal 3 foto, masing-masing 2 MB.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="product-name">Nama produk</Label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(e) => setField("name")(e.target.value)}
                  placeholder="Contoh: Beras Premium 5kg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-category">Kategori</Label>
                <select
                  id="product-category"
                  className={selectClass}
                  value={form.category}
                  onChange={(e) => setField("category")(e.target.value)}
                >
                  <option value="">Tanpa kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-unit">Satuan</Label>
                <select
                  id="product-unit"
                  className={selectClass}
                  value={form.unit}
                  onChange={(e) => setField("unit")(e.target.value)}
                >
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-province">Provinsi layanan</Label>
                <select id="product-province" className={selectClass} value={form.serviceProvinceCode}
                  onChange={(event) => setForm((current) => ({ ...current, serviceProvinceCode: event.target.value, serviceRegencyCode: "" }))}>
                  <option value="">Pilih provinsi</option>
                  {provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-regency">Kota/kabupaten layanan</Label>
                <select id="product-regency" className={selectClass} value={form.serviceRegencyCode}
                  disabled={!form.serviceProvinceCode || !regencies.length}
                  onChange={(event) => setField("serviceRegencyCode")(event.target.value)}>
                  <option value="">Pilih kota/kabupaten</option>
                  {regencies.map((regency) => <option key={regency.code} value={regency.code}>{regency.name}</option>)}
                </select>
              </div>
              {regionError && <p role="alert" className="sm:col-span-2 text-sm text-destructive">{regionError}</p>}

              <div className="space-y-1.5">
                <Label htmlFor="product-price">Harga normal</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setField("price")(e.target.value)}
                  placeholder="Contoh: 25000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-voucher-price">Harga voucher</Label>
                <Input
                  id="product-voucher-price"
                  type="number"
                  value={form.voucherPrice}
                  onChange={(e) => setField("voucherPrice")(e.target.value)}
                  placeholder="Contoh: 20000"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="product-stock">Stok</Label>
                <Input
                  id="product-stock"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setField("stock")(e.target.value)}
                  placeholder="Contoh: 100"
                />
              </div>
            </div>

            <dl className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="px-3 py-3 sm:px-4">
                <dt className="text-xs text-slate-500">Harga normal</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {form.price ? formatIDR(Number(form.price)) : "-"}
                </dd>
              </div>
              <div className="px-3 py-3 sm:px-4">
                <dt className="text-xs text-slate-500">Harga voucher</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {form.voucherPrice ? formatIDR(Number(form.voucherPrice)) : "-"}
                </dd>
              </div>
              <div className="px-3 py-3 sm:px-4">
                <dt className="text-xs text-slate-500">Diskon</dt>
                <dd className="mt-1 text-sm font-semibold text-emerald-700">{discountPct}%</dd>
              </div>
            </dl>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={closeForm}
                disabled={submitting}
              >
                Batal
              </Button>

              <Button className="rounded-full" onClick={handleSave} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default KelolaProduk;
