import { useState, useEffect, useCallback, useMemo } from "react";
import type { ElementType } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Loader2,
  ShoppingBag,
  CheckCircle,
  Clock,
  Tag,
  ScanSearch,
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
import type { VendorProduct } from "@/types/vendor";
import type { Category } from "@/services/products";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ListItemSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { productApprovalConfig } from "@/lib/status-config";
import { ProductAvatar } from "@/components/product/ProductAvatar";

interface ProductFormState {
  name: string;
  category: string;
  price: string;
  voucherPrice: string;
  stock: string;
  unit: string;
  images: string[];
}

const DEFAULT_FORM: ProductFormState = {
  name: "",
  category: "",
  price: "",
  voucherPrice: "",
  stock: "",
  unit: "pcs",
  images: [],
};

type StatusFilter = "all" | "approved" | "pending" | "rejected";

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: ElementType;
  iconWrapClass: string;
  iconClass: string;
  valueClass: string;
  borderClass: string;
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconWrapClass,
  iconClass,
  valueClass,
  borderClass,
}: StatCardProps) {
  return (
    <div
      className={`flex h-full min-h-[92px] rounded-[17px] border bg-white px-3.5 py-3.5 shadow-[0_7px_18px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,23,42,0.055)] ${borderClass}`}
    >
      <div className="flex w-full items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${iconWrapClass}`}
        >
          <Icon className={`h-[17px] w-[17px] ${iconClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`break-words text-[22px] font-black leading-none tracking-tight ${valueClass}`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-[11.5px] font-bold leading-tight text-slate-700">
            {title}
          </p>

          <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

const KelolaProduk = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  const totalCount = products.length;

  const activeCount = useMemo(
    () => products.filter((p) => p.approval_status === "approved").length,
    [products]
  );

  const pendingCount = useMemo(
    () => products.filter((p) => p.approval_status === "pending").length,
    [products]
  );

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
    if (!form.name || !form.price || form.voucherPrice === "") {
      toast.error("Lengkapi semua field wajib");
      return;
    }

    const priceNum = parseFloat(form.price);
    const voucherPriceNum = parseFloat(form.voucherPrice);

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

    setSubmitting(true);

    try {
      const data = {
        name: form.name,
        category_id: form.category || undefined,
        price: priceNum,
        voucher_price: voucherPriceNum,
        stock_quantity: parseInt(form.stock) || 0,
        unit: form.unit,
        images: form.images.length > 0 ? form.images : undefined,
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

  if (loading) {
    return (
      <DashboardLayout
        title="Kelola Produk"
        subtitle="Tambah, edit, dan kelola produk pangan Anda."
      >
        <div className="space-y-4">
          <ListItemSkeleton count={6} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Kelola Produk"
        subtitle="Tambah, edit, dan kelola produk pangan Anda."
      >
        <ErrorState message={error} onRetry={fetchData} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Kelola Produk"
      subtitle="Tambah, edit, dan kelola produk pangan Anda."
    >
      <div className="flex min-h-[calc(100vh-132px)] w-full max-w-none flex-col gap-3 pb-3">
        {/* Header Cards */}
        <section className="grid w-full shrink-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Produk"
            value={totalCount.toString()}
            subtitle="Seluruh produk toko"
            icon={ShoppingBag}
            iconWrapClass="bg-indigo-50"
            iconClass="text-indigo-600"
            valueClass="text-indigo-600"
            borderClass="border-indigo-100"
          />

          <StatCard
            title="Disetujui"
            value={activeCount.toString()}
            subtitle="Produk aktif ditampilkan"
            icon={CheckCircle}
            iconWrapClass="bg-emerald-50"
            iconClass="text-emerald-600"
            valueClass="text-emerald-600"
            borderClass="border-emerald-100"
          />

          <StatCard
            title="Menunggu Tinjauan"
            value={pendingCount.toString()}
            subtitle="Menunggu review admin"
            icon={Clock}
            iconWrapClass="bg-amber-50"
            iconClass="text-amber-600"
            valueClass="text-amber-600"
            borderClass="border-amber-100"
          />

          <div className="flex h-full min-h-[92px] rounded-[17px] border border-slate-200 bg-[linear-gradient(135deg,#faf5ff_0%,#eef2ff_100%)] px-3.5 py-3.5 shadow-[0_7px_18px_rgba(15,23,42,0.035)]">
            <div className="flex w-full items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-white/80">
                <Tag className="h-[17px] w-[17px] text-violet-600" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black leading-tight text-slate-900">
                  Kelola produk lebih cepat
                </p>

                <p className="mt-1 text-[10.5px] leading-4 text-slate-600">
                  Tambahkan produk baru, edit data, dan pantau status
                  persetujuan dalam satu halaman.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <section className="shrink-0 rounded-[18px] border border-slate-200/70 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari produk..."
                className="h-10 rounded-xl border-slate-200 pl-9 text-[13px]"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[180px_auto] lg:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(value: string) =>
                  setStatusFilter(value as StatusFilter)
                }
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-[13px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="h-10 gap-2 rounded-xl bg-indigo-600 px-4 text-[12.5px] font-bold hover:bg-indigo-700"
                onClick={() => openForm()}
              >
                <Plus className="h-4 w-4" />
                Tambah Produk
              </Button>
            </div>
          </div>
        </section>

        {/* Product Area */}
        <section className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-slate-200/70 bg-white p-3.5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] sm:p-4">
          <div className="mb-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[16px] font-black tracking-tight text-slate-900">
                Daftar Produk
              </h2>

              <p className="mt-0.5 text-[11.5px] font-medium text-slate-500">
                {filtered.length} produk{" "}
                {searchQ || statusFilter !== "all"
                  ? "sesuai hasil filter"
                  : "tersedia di toko Anda"}
              </p>
            </div>

            {(searchQ || statusFilter !== "all") && (
              <Button
                variant="outline"
                className="h-9 rounded-xl text-[12px]"
                onClick={() => {
                  setSearchQ("");
                  setStatusFilter("all");
                }}
              >
                Reset Filter
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex min-h-[140px] flex-1 items-center justify-center rounded-[17px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
              <div className="flex flex-col items-center sm:flex-row sm:gap-4 sm:text-left">
                <div className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 sm:mb-0">
                  <ScanSearch className="h-5 w-5 text-slate-500" />
                </div>

                <div>
                  <p className="text-[16px] font-black tracking-tight text-slate-900">
                    Tidak ada produk ditemukan
                  </p>

                  <p className="mt-1.5 max-w-md text-[12px] leading-5 text-slate-500">
                    {searchQ || statusFilter !== "all"
                      ? "Coba ubah kata kunci atau filter pencarian Anda."
                      : "Mulai tambahkan produk pangan Anda agar toko terlihat lebih aktif."}
                  </p>

                  {!searchQ && statusFilter === "all" && (
                    <Button
                      className="mt-4 h-10 gap-2 rounded-xl bg-indigo-600 px-4 text-[12px] font-bold hover:bg-indigo-700"
                      onClick={() => openForm()}
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Produk Pertama
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid flex-1 grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((product) => {
                const approval =
                  productApprovalConfig[
                    product.approval_status as keyof typeof productApprovalConfig
                  ] || productApprovalConfig.pending;

                const categoryLabel =
                  categoryNameMap.get(product.category || "") ||
                  product.category ||
                  "Tanpa kategori";

                return (
                  <div
                    key={product.id}
                    className="group flex h-full min-h-[218px] flex-col rounded-[18px] border border-slate-200/80 bg-white p-3.5 shadow-[0_7px_20px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <ProductAvatar
                          images={product.images}
                          categoryName={categoryLabel}
                          name={product.name}
                          className="h-10 w-10 rounded-[13px]"
                          emojiSize="text-lg"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-black leading-tight text-slate-900">
                            {product.name}
                          </p>

                          <p className="mt-1 truncate text-[10.5px] font-medium text-slate-500">
                            {categoryLabel}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`shrink-0 border text-[10px] font-bold ${approval.className}`}
                      >
                        {approval.label}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      <div className="rounded-[13px] bg-slate-50 px-3 py-2.5">
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                          Harga
                        </p>
                        <p className="mt-1 truncate text-[12.5px] font-black text-slate-900">
                          {formatIDR(product.price)}
                        </p>
                      </div>

                      <div className="rounded-[13px] bg-emerald-50 px-3 py-2.5">
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-emerald-500">
                          Harga Voucher
                        </p>
                        <p className="mt-1 truncate text-[12.5px] font-black text-emerald-700">
                          {formatIDR(product.voucher_price)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between rounded-[13px] border border-slate-100 px-3 py-2.5">
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                          Stok
                        </p>
                        <p className="mt-1 text-[12.5px] font-black text-slate-900">
                          {product.stock} {product.unit}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                          Diskon Voucher
                        </p>
                        <p className="mt-1 text-[12.5px] font-black text-violet-600">
                          {product.price > 0
                            ? `${Math.max(
                                0,
                                Math.round(
                                  (1 -
                                    product.voucher_price / product.price) *
                                    100
                                )
                              )}%`
                            : "0%"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-2 pt-3">
                      <Button
                        variant="outline"
                        className="h-9 flex-1 rounded-xl text-[12px] font-bold"
                        onClick={() => openForm(product)}
                      >
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        className="h-9 rounded-xl border-red-200 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[22px] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-black tracking-tight text-slate-900">
              {editingProduct ? "Edit Produk" : "Tambah Produk"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Isi detail produk pangan dengan lengkap agar lebih mudah dikelola.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 pt-1">
            {/* Image Upload Area */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-bold text-slate-700">Foto Produk</Label>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative h-20 w-20 rounded-xl border bg-slate-50 overflow-hidden shadow-sm">
                    <img src={img} alt="Product" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {form.images.length < 3 && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                    {uploadingImg ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="h-5 w-5 mb-1" />
                        <span className="text-[9px] font-bold">Upload</span>
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
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="mb-2 block text-sm font-bold text-slate-700">
                  Nama Produk
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setField("name")(e.target.value)}
                  placeholder="Contoh: Beras Premium 5kg"
                  className="h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="mb-2 block text-sm font-bold text-slate-700">
                  Kategori
                </Label>
                <Select
                  value={form.category || "__none__"}
                  onValueChange={(value: string) =>
                    setField("category")(value === "__none__" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Tanpa kategori</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-bold text-slate-700">
                  Satuan
                </Label>
                <Select value={form.unit} onValueChange={setField("unit")}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="gr">gr</SelectItem>
                    <SelectItem value="liter">liter</SelectItem>
                    <SelectItem value="pack">pack</SelectItem>
                    <SelectItem value="ikat">ikat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-bold text-slate-700">
                  Harga Normal
                </Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setField("price")(e.target.value)}
                  placeholder="Contoh: 25000"
                  className="h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="mb-2 block text-sm font-bold text-slate-700">
                  Harga Voucher
                </Label>
                <Input
                  type="number"
                  value={form.voucherPrice}
                  onChange={(e) => setField("voucherPrice")(e.target.value)}
                  placeholder="Contoh: 20000"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="mb-2 block text-sm font-bold text-slate-700">
                  Stok
                </Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setField("stock")(e.target.value)}
                  placeholder="Contoh: 100"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="rounded-[16px] border border-violet-100 bg-violet-50/70 p-3.5">
              <p className="text-[12px] font-semibold text-violet-600">
                Ringkasan Harga
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-[13px] bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Harga Normal
                  </p>
                  <p className="mt-1 text-[13px] font-black text-slate-900">
                    {form.price ? formatIDR(Number(form.price)) : "-"}
                  </p>
                </div>

                <div className="rounded-[13px] bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Harga Voucher
                  </p>
                  <p className="mt-1 text-[13px] font-black text-emerald-700">
                    {form.voucherPrice
                      ? formatIDR(Number(form.voucherPrice))
                      : "-"}
                  </p>
                </div>

                <div className="rounded-[13px] bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Diskon
                  </p>
                  <p className="mt-1 text-[13px] font-black text-violet-600">
                    {discountPct}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="h-10 rounded-xl"
                onClick={closeForm}
                disabled={submitting}
              >
                Batal
              </Button>

              <Button
                className="h-10 rounded-xl bg-indigo-600 px-5 font-bold hover:bg-indigo-700"
                onClick={handleSave}
                disabled={submitting}
              >
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