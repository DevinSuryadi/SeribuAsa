import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Plus, TrendingUp, Baby, ChevronUp, ChevronDown } from 'lucide-react';
import { formatIDR, formatDate } from '@/lib/format';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { toast } from 'sonner';

const mockChildren = [
  { id: 'c1', name: 'Ahmad Fauzi', age: 24, gender: 'male', weight: 12.5, height: 85, muac: 13.2, zScore: -0.8, status: 'Normal' },
  { id: 'c2', name: 'Siti Nurhaliza', age: 18, gender: 'female', weight: 10.2, height: 78, muac: 12.8, zScore: -1.2, status: 'At Risk' },
];

const growthData = [
  { month: 'Jan', weight: 11.5, height: 83 },
  { month: 'Feb', weight: 11.8, height: 83.5 },
  { month: 'Mar', weight: 12.0, height: 84 },
  { month: 'Apr', weight: 12.2, height: 84.5 },
  { month: 'May', weight: 12.5, height: 85 },
];

const PemantauanGizi = () => {
  const navigate = useNavigate();
  const gridRef = useStaggerChildren({ stagger: 0.1 });
  const [showForm, setShowForm] = useState(false);
  const [selectedChild, setSelectedChild] = useState(mockChildren[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-primary/10 text-primary border-primary/20';
      case 'At Risk': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'Malnutrition': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <DashboardLayout title="Pemantauan Gizi" subtitle="Pantau tumbuh kembang dan status gizi anak Anda.">
      <div className="space-y-6">
        {/* Children List */}
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Tambah Anak
          </Button>
        </div>

        <div ref={gridRef} className="grid gap-4 md:grid-cols-2">
          {mockChildren.map((child) => (
            <Card key={child.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedChild(child)}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Baby className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{child.name}</div>
                    <div className="text-sm text-muted-foreground">{child.age} bulan · {child.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(child.status)}>{child.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold">{child.weight} kg</div>
                    <div className="text-xs text-muted-foreground">Berat</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{child.height} cm</div>
                    <div className="text-xs text-muted-foreground">Tinggi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{child.muac} cm</div>
                    <div className="text-xs text-muted-foreground">MUAC</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Growth Chart */}
        {selectedChild && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Grafik Tumbuh Kembang - {selectedChild.name}</CardTitle>
              <CardDescription>Perkembangan berat dan tinggi badan 5 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Berat Badan (kg)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 15%, 90%)', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="weight" stroke="hsl(152, 55%, 33%)" strokeWidth={2} dot={{ fill: 'hsl(152, 55%, 33%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Tinggi Badan (cm)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 15%, 90%)', borderRadius: '8px' }} />
                      <Bar dataKey="height" fill="hsl(210, 65%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Child Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Data Anak</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nama Anak</Label>
                <Input placeholder="Nama lengkap anak" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usia (bulan)</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div>
                  <Label>Jenis Kelamin</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Laki-laki</SelectItem>
                      <SelectItem value="female">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Berat (kg)</Label>
                  <Input type="number" placeholder="0" step="0.1" />
                </div>
                <div>
                  <Label>Tinggi (cm)</Label>
                  <Input type="number" placeholder="0" step="0.1" />
                </div>
                <div>
                  <Label>MUAC (cm)</Label>
                  <Input type="number" placeholder="0" step="0.1" />
                </div>
              </div>
              <Button className="w-full" onClick={() => { toast.success('Data anak berhasil ditambahkan'); setShowForm(false); }}>
                Simpan Data
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PemantauanGizi;
