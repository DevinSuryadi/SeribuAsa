import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Package, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { formatIDR } from '@/lib/format';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '@/services/products';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  price: number;
  voucher_price: number;
  stock_quantity: number;
  unit: string;
  approval_status: string;
  description: string | null;
};

const KelolaProduk = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formVoucherPrice, setFormVoucherPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsData, catsData] = await Promise.all([
        getProducts({ vendor_id: user?.id || '' }),
        getCategories(),
      ]);
      setProducts(productsData.items || []);
      setCategories(catsData || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data produk');
      toast.error('Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const filtered = products.filter((p) => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()));

  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormName(product.name);
      setFormCategory(product.category_id || '');
      setFormPrice(String(product.price));
      setFormVoucherPrice(String(product.voucher_price));
      setFormStock(String(product.stock_quantity));
      setFormUnit(product.unit);
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormCategory('');
      setFormPrice('');
      setFormVoucherPrice('');
      setFormStock('');
      setFormUnit('pcs');
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName || !formPrice || !formVoucherPrice) {
      toast.error('Lengkapi semua field wajib');
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        name: formName,
        category_id: formCategory || undefined,
        price: parseFloat(formPrice),
        voucher_price: parseFloat(formVoucherPrice),
        stock_quantity: parseInt(formStock) || 0,
        unit: formUnit,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success('Produk diperbarui');
      } else {
        await createProduct(data);
        toast.success('Produk ditambahkan');
      }
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      toast.success(`"${product.name}" dihapus`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus produk');
    }
  };

  const approvalColor: Record<string, string> = {
    approved: 'bg-primary/10 text-primary border-primary/20',
    pending: 'bg-accent/10 text-accent-foreground border-accent/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const approvalLabel: Record<string, string> = {
    approved: 'Disetujui',
    pending: 'Menunggu',
    rejected: 'Ditolak',
  };

  if (loading) {
    return (
      <DashboardLayout title="Kelola Produk" subtitle="Tambah, edit, dan kelola produk pangan Anda.">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="py-4"><div className="animate-pulse flex items-center gap-4"><div className="h-12 w-12 bg-secondary rounded-lg" /><div className="flex-1 space-y-2"><div className="h-4 w-32 bg-secondary rounded" /><div className="h-3 w-20 bg-secondary rounded" /></div></div></CardContent></Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Kelola Produk" subtitle="Tambah, edit, dan kelola produk pangan Anda.">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kelola Produk" subtitle="Tambah, edit, dan kelola produk pangan Anda.">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <Button className="gap-2" onClick={() => openForm()}>
            <Plus className="h-4 w-4" /> Tambah Produk
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." className="pl-9" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
        </div>

        <div className="space-y-3">
          {filtered.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl">
                    🍽️
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{product.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{product.category_name || 'Uncategorized'}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${approvalColor[product.approval_status] || ''}`}>
                        {approvalLabel[product.approval_status] || product.approval_status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{formatIDR(product.price)}</div>
                    <div className="text-xs text-muted-foreground">Stok: {product.stock_quantity}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openForm(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Tidak ada produk ditemukan.</p>
          </div>
        )}

        {/* Add/Edit Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nama Produk</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: Telur Ayam 1 kg" />
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Harga (IDR)</Label>
                  <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Harga Voucher (IDR)</Label>
                  <Input type="number" value={formVoucherPrice} onChange={(e) => setFormVoucherPrice(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stok</Label>
                  <Input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Satuan</Label>
                  <Select value={formUnit} onValueChange={setFormUnit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pcs</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="liter">Liter</SelectItem>
                      <SelectItem value="ikat">Ikat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submitting ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KelolaProduk;
