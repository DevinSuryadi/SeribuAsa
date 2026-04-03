import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { formatIDR } from '@/lib/format';
import { mockProducts } from '@/data/mockData';
import { toast } from 'sonner';

const vendorProducts = mockProducts.slice(0, 8);

const KelolaProduk = () => {
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<typeof mockProducts[0] | null>(null);

  const filtered = vendorProducts.filter((p) => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()));

  const handleSave = () => {
    toast.success(editingProduct ? 'Produk diperbarui' : 'Produk ditambahkan');
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleDelete = (name: string) => {
    toast.success(`"${name}" dihapus`);
  };

  return (
    <DashboardLayout title="Kelola Produk" subtitle="Tambah, edit, dan kelola produk pangan Anda.">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kelola Produk</h1>
            <p className="text-muted-foreground text-sm">Tambah, edit, dan kelola produk pangan Anda.</p>
          </div>
          <Button className="gap-2" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
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
                      <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{formatIDR(product.price)}</div>
                    <div className="text-xs text-muted-foreground">Stok: {product.stock}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setShowForm(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.name)}>
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
                <Input defaultValue={editingProduct?.name || ''} placeholder="Contoh: Telur Ayam 1 kg" />
              </div>
              <div>
                <Label>Kategori</Label>
                <Select defaultValue={editingProduct?.category}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pokok">🌾 Pokok</SelectItem>
                    <SelectItem value="Protein">🥚 Protein</SelectItem>
                    <SelectItem value="Susu">🥛 Susu</SelectItem>
                    <SelectItem value="Sayuran">🥬 Sayuran</SelectItem>
                    <SelectItem value="Buah">🍌 Buah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Harga (IDR)</Label>
                  <Input type="number" defaultValue={editingProduct?.price || ''} placeholder="0" />
                </div>
                <div>
                  <Label>Stok</Label>
                  <Input type="number" defaultValue={editingProduct?.stock || ''} placeholder="0" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Produk Aktif</Label>
                <Switch defaultChecked />
              </div>
              <Button className="w-full" onClick={handleSave}>
                {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KelolaProduk;
