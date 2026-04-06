import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Plus, Baby, Loader2 } from 'lucide-react';
import { useStaggerChildren } from '@/hooks/useStaggerChildren';
import { addMeasurement, getChildren, getMeasurementHistory } from '@/services/nutrition';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

type ChildData = {
  id: string;
  full_name: string;
  date_of_birth: string;
  age_months: number;
  gender: string | null;
};

const PemantauanGizi = () => {
  const { user } = useAuth();
  const gridRef = useStaggerChildren({ stagger: 0.1 });
  const [showForm, setShowForm] = useState(false);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formWeight, setFormWeight] = useState('');
  const [formHeight, setFormHeight] = useState('');
  const [formMuac, setFormMuac] = useState('');

  const fetchChildren = useCallback(async () => {
    try {
      const data = await getChildren();
      const childList = data.data || [];
      setChildren(childList);
      if (childList.length > 0 && !selectedChild) {
        setSelectedChild(childList[0]);
      }
    } catch {
      setChildren([]);
    }
  }, [selectedChild]);

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  const fetchMeasurements = async (childId: string) => {
    try {
      setLoading(true);
      const result = await getMeasurementHistory(childId);
      setMeasurements(result.data?.measurements || []);
    } catch {
      setMeasurements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && selectedChild) {
      fetchMeasurements(selectedChild.id);
    }
  }, [user, selectedChild?.id]);

  const handleAddMeasurement = async () => {
    if (!formWeight || !formHeight) {
      toast.error('Lengkapi berat dan tinggi badan');
      return;
    }
    setSubmitting(true);
    if (!selectedChild) {
      toast.error("Silakan pilih anak terlebih dahulu");
      setSubmitting(false);
      return;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      await addMeasurement({
        child_id: selectedChild.id,
        measurement_date: today,
        weight: parseFloat(formWeight),
        height: parseFloat(formHeight),
        muac: formMuac ? parseFloat(formMuac) : undefined,
      });

      toast.success('Data pengukuran berhasil disimpan');
      setFormWeight('');
      setFormHeight('');
      setFormMuac('');
      setShowForm(false);
      fetchMeasurements(selectedChild.id);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (classification: string) => {
    switch (classification) {
      case 'normal': return 'bg-primary/10 text-primary border-primary/20';
      case 'moderate_malnourished': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'severe_malnourished': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const getStatusLabel = (classification: string) => {
    switch (classification) {
      case 'normal': return 'Normal';
      case 'moderate_malnourished': return 'Kurang Gizi';
      case 'severe_malnourished': return 'Gizi Buruk';
      default: return classification || '-';
    }
  };

  const chartData = useMemo(
    () => measurements.slice(0, 10).reverse().map((m: any) => ({
      month: formatDate(m.measurement_date).split(' ')[0] || m.measurement_date,
      weight: parseFloat(m.weight),
      height: parseFloat(m.height),
    })),
    [measurements]
  );

  if (loading) {
    return (
      <DashboardLayout title="Pemantauan Gizi" subtitle="Pantau tumbuh kembang dan status gizi anak Anda.">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="animate-pulse space-y-3"><div className="h-12 w-12 bg-secondary rounded-full" /><div className="h-4 w-32 bg-secondary rounded" /><div className="h-3 w-20 bg-secondary rounded" /></div></CardContent></Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pemantauan Gizi" subtitle="Pantau tumbuh kembang dan status gizi anak Anda.">
      <div className="space-y-6">
        {/* Children List */}
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Input Pengukuran
          </Button>
        </div>

        <div ref={gridRef} className="grid gap-4 md:grid-cols-2">
          {children.length === 0 ? (
            <Card className="md:col-span-2 text-center"><CardContent className="pt-8 pb-8"><Baby className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" /><p className="text-muted-foreground">Belum ada data anak</p><p className="text-sm text-muted-foreground/70 mt-1">Tambahkan data anak untuk memulai pemantauan gizi</p></CardContent></Card>
          ) : (
            children.map((child) => {
              const childMeasurements = measurements.filter((m) => m.child_id === child.id);
              const latest = childMeasurements[0];
              return (
                <Card key={child.id} className={`cursor-pointer hover:border-primary/30 transition-colors ${selectedChild?.id === child.id ? 'border-primary/30' : ''}`} onClick={() => setSelectedChild(child)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Baby className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{child.full_name}</div>
                        <div className="text-sm text-muted-foreground">{child.age_months} bulan · {child.gender === 'male' ? 'Laki-laki' : child.gender === 'female' ? 'Perempuan' : '-'}</div>
                      </div>
                      {latest ? (
                        <Badge variant="outline" className={getStatusColor(latest.classification)}>{getStatusLabel(latest.classification)}</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-secondary text-muted-foreground">Belum diukur</Badge>
                      )}
                    </div>
                    {latest && (
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div className="text-center">
                          <div className="text-lg font-bold">{latest.weight} kg</div>
                          <div className="text-xs text-muted-foreground">Berat</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{latest.height} cm</div>
                          <div className="text-xs text-muted-foreground">Tinggi</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {latest.z_score_weight !== null ? `${latest.z_score_weight}` : '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">Z-Score</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Growth Chart */}
        {chartData.length > 0 && selectedChild && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Grafik Tumbuh Kembang - {selectedChild?.full_name}</CardTitle>
              <CardDescription>Perkembangan berat dan tinggi badan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Berat Badan (kg)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
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
                    <BarChart data={chartData}>
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

        {measurements.length === 0 && !loading && (
          <Card className="text-center"><CardContent className="pt-8 pb-8"><Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" /><p className="text-muted-foreground">Belum ada data pengukuran</p><p className="text-sm text-muted-foreground/70 mt-1">Input data berat dan tinggi badan anak untuk memulai pemantauan</p></CardContent></Card>
        )}

        {/* Add Measurement Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Input Pengukuran - {selectedChild?.full_name || 'Anak'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Anak</Label>
                <Select value={selectedChild?.id || ''} onValueChange={(v: string) => {
                  const child = children.find((c) => c.id === v);
                  if (child) setSelectedChild(child);
                }}>
                  <SelectTrigger><SelectValue placeholder="Pilih anak" /></SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Berat Badan (kg)</Label>
                  <Input type="number" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} placeholder="0.0" step="0.1" />
                </div>
                <div>
                  <Label>Tinggi Badan (cm)</Label>
                  <Input type="number" value={formHeight} onChange={(e) => setFormHeight(e.target.value)} placeholder="0.0" step="0.1" />
                </div>
              </div>
              <div>
                <Label>MUAC (cm) — Opsional</Label>
                <Input type="number" value={formMuac} onChange={(e) => setFormMuac(e.target.value)} placeholder="0.0" step="0.1" />
              </div>
              <Button className="w-full" onClick={handleAddMeasurement} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submitting ? 'Menyimpan...' : 'Simpan Pengukuran'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PemantauanGizi;
