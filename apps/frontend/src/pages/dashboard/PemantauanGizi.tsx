import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import {
  Activity, Plus, Baby, Loader2, Trash2, Pencil, Calendar,
  AlertCircle, TrendingUp, ChevronLeft, ChevronRight,
  Scale, Ruler, Heart, ShieldCheck,
} from "lucide-react";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";
import {
  addMeasurement,
  getChildren,
  getMeasurementHistory,
  updateMeasurement,
  deleteMeasurement,
  addChild,
} from "@/services/nutrition";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────
type ChildData = {
  id: string;
  full_name: string;
  date_of_birth: string;
  age_months: number;
  gender: string | null;
};

type Measurement = {
  id: string;
  child_id: string;
  measurement_date: string;
  weight: number;
  height: number;
  muac: number | null;
  z_score_weight: number | null;
  z_score_height: number | null;
  classification: string;
};

// ── Status helpers ────────────────────────────────────────────
const classificationConfig: Record<string, {
  label: string; cls: string; bg: string; border: string; desc: string; icon: React.ElementType;
}> = {
  normal: {
    label: "Normal", cls: "text-green-700", bg: "bg-green-50", border: "border-green-200",
    desc: "Status gizi baik", icon: ShieldCheck,
  },
  moderate_malnourished: {
    label: "Kurang Gizi", cls: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
    desc: "Perlu perhatian lebih", icon: AlertCircle,
  },
  severe_malnourished: {
    label: "Gizi Buruk", cls: "text-red-700", bg: "bg-red-50", border: "border-red-200",
    desc: "Butuh penanganan segera", icon: Heart,
  },
};

const getClassCfg = (cl: string) =>
  classificationConfig[cl] ?? {
    label: cl || "Belum diukur", cls: "text-muted-foreground", bg: "bg-secondary",
    border: "border-border", desc: "", icon: Activity,
  };

// ── Child Selector Card ───────────────────────────────────────
function ChildCard({
  child,
  latestMeasurement,
  isSelected,
  onClick,
}: {
  child: ChildData;
  latestMeasurement: Measurement | undefined;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cfg = latestMeasurement ? getClassCfg(latestMeasurement.classification) : null;
  const StatusIcon = cfg?.icon ?? Baby;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
            isSelected ? "bg-primary/10" : "bg-secondary"
          }`}
        >
          <Baby className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm leading-tight truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
            {child.full_name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {child.age_months} bulan · {child.gender === "male" ? "Laki-laki" : child.gender === "female" ? "Perempuan" : "-"}
          </div>
        </div>

        {/* Status badge */}
        {cfg && (
          <Badge
            variant="outline"
            className={`text-[10px] border flex-shrink-0 gap-0.5 ${cfg.bg} ${cfg.cls} ${cfg.border}`}
          >
            <StatusIcon className="h-2.5 w-2.5" />
            {cfg.label}
          </Badge>
        )}
      </div>

      {/* Latest measurement mini stats */}
      {latestMeasurement && (
        <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-3 gap-3">
          {[
            { icon: Scale, label: "Berat", val: `${latestMeasurement.weight} kg` },
            { icon: Ruler, label: "Tinggi", val: `${latestMeasurement.height} cm` },
            { icon: Activity, label: "Z-Score", val: latestMeasurement.z_score_weight !== null ? latestMeasurement.z_score_weight.toString() : "-" },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="text-center">
              <Icon className="h-3 w-3 text-muted-foreground mx-auto mb-0.5" />
              <div className="text-sm font-bold text-foreground">{val}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const PemantauanGizi = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const gridRef = useStaggerChildren({ stagger: 0.1 });

  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [deletingMeasurement, setDeletingMeasurement] = useState<Measurement | null>(null);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [chartPage, setChartPage] = useState(0);
  const measurementsPerPage = 10;

  // Form
  const [formWeight, setFormWeight] = useState("");
  const [formHeight, setFormHeight] = useState("");
  const [formMuac, setFormMuac] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formErrors, setFormErrors] = useState<{ weight?: string; height?: string; date?: string }>({});

  // Add child
  const [showAddChild, setShowAddChild] = useState(false);
  const [childFormName, setChildFormName] = useState("");
  const [childFormDob, setChildFormDob] = useState("");
  const [childFormGender, setChildFormGender] = useState<"male" | "female">("male");
  const [childFormErrors, setChildFormErrors] = useState<{ name?: string; dob?: string }>({});

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getChildren();
      const childList = Array.isArray(data) ? data : [];
      setChildren(childList);
      if (childList.length > 0 && !selectedChild) setSelectedChild(childList[0]);
    } catch (err: unknown) {
      toast.error("Gagal memuat data anak", { description: err instanceof Error ? err.message : undefined });
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) fetchChildren(); }, [user, fetchChildren]);

  const fetchMeasurements = useCallback(async (childId: string) => {
    try {
      setLoading(true);
      const result = await getMeasurementHistory(childId);
      setMeasurements(result?.measurements || []);
    } catch (err: unknown) {
      toast.error("Gagal memuat data pengukuran", { description: err instanceof Error ? err.message : undefined });
      setMeasurements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user && selectedChild) fetchMeasurements(selectedChild.id); }, [user, selectedChild, fetchMeasurements]);

  const validateForm = (): boolean => {
    const errors: { weight?: string; height?: string; date?: string } = {};
    const weight = parseFloat(formWeight);
    const height = parseFloat(formHeight);
    if (!formWeight || isNaN(weight) || weight <= 0) errors.weight = "Berat badan harus lebih dari 0 kg";
    else if (weight > 100) errors.weight = "Berat badan tidak realistis (>100 kg)";
    if (!formHeight || isNaN(height) || height <= 0) errors.height = "Tinggi badan harus lebih dari 0 cm";
    else if (height > 200) errors.height = "Tinggi badan tidak realistis (>200 cm)";
    if (!formDate) errors.date = "Tanggal pengukuran wajib diisi";
    else {
      const inputDate = new Date(formDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (inputDate > today) errors.date = "Tanggal tidak boleh di masa depan";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormWeight(""); setFormHeight(""); setFormMuac("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormErrors({}); setEditingMeasurement(null);
  };

  const handleAddMeasurement = async () => {
    if (!validateForm() || !selectedChild) {
      if (!selectedChild) toast.error("Silakan pilih anak terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      const weight = parseFloat(formWeight);
      const height = parseFloat(formHeight);
      const existingOnDate = measurements.find((m) => m.measurement_date === formDate && m.id !== editingMeasurement?.id);
      if (existingOnDate && !editingMeasurement) {
        toast.error("Sudah ada pengukuran pada tanggal ini", { description: "Silakan edit pengukuran yang sudah ada" });
        setSubmitting(false);
        return;
      }
      if (editingMeasurement) {
        await updateMeasurement(editingMeasurement.id, { child_id: selectedChild.id, measurement_date: formDate, weight, height, muac: formMuac ? parseFloat(formMuac) : undefined });
        toast.success("Data pengukuran berhasil diperbarui");
      } else {
        await addMeasurement({ child_id: selectedChild.id, measurement_date: formDate, weight, height, muac: formMuac ? parseFloat(formMuac) : undefined });
        toast.success("Data pengukuran berhasil disimpan");
      }
      resetForm(); setShowForm(false);
      fetchMeasurements(selectedChild.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (m: Measurement) => {
    setEditingMeasurement(m);
    setFormWeight(m.weight.toString()); setFormHeight(m.height.toString());
    setFormMuac(m.muac?.toString() || ""); setFormDate(m.measurement_date);
    setShowForm(true);
  };

  const handleDeleteClick = (m: Measurement) => { setDeletingMeasurement(m); setShowDeleteConfirm(true); };

  const handleConfirmDelete = async () => {
    if (!deletingMeasurement) return;
    try {
      await deleteMeasurement(deletingMeasurement.id);
      toast.success("Data pengukuran berhasil dihapus");
      setShowDeleteConfirm(false); setDeletingMeasurement(null);
      if (selectedChild) fetchMeasurements(selectedChild.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus data");
    }
  };

  const handleAddChild = async () => {
    const errors: { name?: string; dob?: string } = {};
    if (!childFormName.trim()) errors.name = "Nama anak wajib diisi";
    if (!childFormDob) errors.dob = "Tanggal lahir wajib diisi";
    else if (new Date(childFormDob) > new Date()) errors.dob = "Tanggal lahir tidak boleh di masa depan";
    setChildFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setSubmitting(true);
      await addChild({ full_name: childFormName.trim(), date_of_birth: childFormDob, gender: childFormGender });
      toast.success("Anak berhasil ditambahkan");
      setShowAddChild(false); setChildFormName(""); setChildFormDob("");
      setChildFormGender("male"); setChildFormErrors({});
      fetchChildren();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan anak");
    } finally {
      setSubmitting(false);
    }
  };

  // Chart
  const paginatedMeasurements = useMemo(() => {
    const start = chartPage * measurementsPerPage;
    return measurements.slice(start, start + measurementsPerPage);
  }, [measurements, chartPage]);

  const totalChartPages = Math.ceil(measurements.length / measurementsPerPage);

  const chartData = useMemo(() =>
    [...paginatedMeasurements].reverse().map((m) => ({
      month: formatDate(m.measurement_date).split(" ")[0] || m.measurement_date,
      weight: parseFloat(m.weight.toString()),
      height: parseFloat(m.height.toString()),
      z_score: m.z_score_weight,
    })),
    [paginatedMeasurements]
  );

  const whoReferenceLines = [-3, -2, -1, 0, 1, 2, 3];

  // Latest measurement for selected child
  const latestMeasurement = useMemo(() =>
    measurements.filter((m) => selectedChild && m.child_id === selectedChild.id)[0],
    [measurements, selectedChild]
  );

  const latestCfg = latestMeasurement ? getClassCfg(latestMeasurement.classification) : null;
  const LatestIcon = latestCfg?.icon ?? Activity;

  // ── Skeleton ─────────────────────────────────────────────────
  if (loading && children.length === 0) {
    return (
      <DashboardLayout title="Pemantauan Gizi" subtitle="Pantau tumbuh kembang dan status gizi anak Anda.">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-secondary rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-9 w-32 bg-secondary rounded animate-pulse" />
              <div className="h-9 w-36 bg-secondary rounded animate-pulse" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-secondary rounded" />
                    <div className="h-3 w-20 bg-secondary rounded" />
                  </div>
                  <div className="h-5 w-16 bg-secondary rounded-full" />
                </div>
                <div className="pt-3 border-t border-border/60 grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((j) => <div key={j} className="h-10 bg-secondary rounded" />)}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
            <div className="h-5 w-48 bg-secondary rounded mb-4" />
            <div className="h-56 bg-secondary rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pemantauan Gizi" subtitle="Pantau tumbuh kembang dan status gizi anak Anda.">
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Data Anak</h2>
            <p className="text-xs text-muted-foreground">{children.length} anak terdaftar</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAddChild(true)}>
              <Baby className="h-3.5 w-3.5" /> Tambah Anak
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)} disabled={!selectedChild}>
              <Plus className="h-3.5 w-3.5" /> Input Pengukuran
            </Button>
          </div>
        </div>

        {/* ── Status Hero (if selected child has measurement) ── */}
        {latestCfg && latestMeasurement && selectedChild && (
          <div className={`rounded-2xl border p-5 flex items-center gap-4 ${latestCfg.bg} ${latestCfg.border}`}>
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/60`}>
              <LatestIcon className={`h-6 w-6 ${latestCfg.cls}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`text-sm font-bold ${latestCfg.cls}`}>{latestCfg.label}</p>
                {latestCfg.desc && (
                  <span className={`text-[10px] ${latestCfg.cls} opacity-70`}>— {latestCfg.desc}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedChild.full_name} · Pengukuran terakhir: {formatDate(latestMeasurement.measurement_date)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className={`flex-shrink-0 border ${latestCfg.border} ${latestCfg.cls} bg-white/60 hover:bg-white/80 text-xs gap-1`}
              onClick={() => handleEditClick(latestMeasurement)}
            >
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          </div>
        )}

        {/* ── Children Grid ── */}
        <div ref={gridRef} className="grid gap-3 md:grid-cols-2">
          {children.length === 0 ? (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-border bg-card text-center py-16 px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4">
                <Baby className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Belum Ada Data Anak</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Tambahkan data anak untuk memulai pemantauan gizi
              </p>
              <Button onClick={() => navigate("/dashboard/profile")}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Data Anak
              </Button>
            </div>
          ) : (
            children.map((child) => {
              const latestForChild = measurements.filter((m) => m.child_id === child.id)[0];
              return (
                <ChildCard
                  key={child.id}
                  child={child}
                  latestMeasurement={latestForChild}
                  isSelected={selectedChild?.id === child.id}
                  onClick={() => setSelectedChild(child)}
                />
              );
            })
          )}
        </div>

        {/* ── Measurement History Table ── */}
        {measurements.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Riwayat Pengukuran
                  </CardTitle>
                  <CardDescription>{selectedChild?.full_name} — {measurements.length} data</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowForm(true)}>
                  <Plus className="h-3 w-3" /> Tambah
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Tanggal</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Berat</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Tinggi</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Z-Score</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="text-right py-2 px-4 text-xs font-semibold text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.slice(0, 8).map((m, i) => {
                      const cfg = getClassCfg(m.classification);
                      return (
                        <tr key={m.id} className={`border-b border-border/60 last:border-0 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                          <td className="py-2.5 px-4 text-xs text-muted-foreground">{formatDate(m.measurement_date)}</td>
                          <td className="py-2.5 px-4 text-sm font-semibold text-foreground">{m.weight} kg</td>
                          <td className="py-2.5 px-4 text-sm font-semibold text-foreground">{m.height} cm</td>
                          <td className="py-2.5 px-4 text-sm font-semibold text-foreground">{m.z_score_weight ?? "-"}</td>
                          <td className="py-2.5 px-4">
                            <Badge variant="outline" className={`text-[10px] border ${cfg.bg} ${cfg.cls} ${cfg.border}`}>
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex gap-0.5 justify-end">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditClick(m)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeleteClick(m)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {measurements.length > 8 && (
                <div className="px-4 py-3 border-t border-border/60 text-xs text-muted-foreground text-center">
                  Dan {measurements.length - 8} data lainnya (lihat grafik di bawah)
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Growth Charts ── */}
        {chartData.length > 0 && selectedChild && (
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Grafik Tumbuh Kembang — {selectedChild.full_name}
                  </CardTitle>
                  <CardDescription>Perkembangan berat & tinggi badan dengan referensi WHO</CardDescription>
                </div>
                {totalChartPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm" className="h-7 w-7 p-0"
                      onClick={() => setChartPage((p) => Math.max(0, p - 1))}
                      disabled={chartPage === 0}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{chartPage + 1}/{totalChartPages}</span>
                    <Button
                      variant="outline" size="sm" className="h-7 w-7 p-0"
                      onClick={() => setChartPage((p) => Math.min(totalChartPages - 1, p + 1))}
                      disabled={chartPage === totalChartPages - 1}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Weight */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Scale className="h-3 w-3" /> Berat Badan (kg)
                  </h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(220,10%,46%)", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(220,10%,46%)", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,90%)", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="weight" stroke="hsl(152,55%,33%)" strokeWidth={2.5} dot={{ fill: "hsl(152,55%,33%)", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Height */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Ruler className="h-3 w-3" /> Tinggi Badan (cm)
                  </h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(220,10%,46%)", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(220,10%,46%)", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,90%)", borderRadius: 8 }} />
                      <Bar dataKey="height" fill="hsl(210,65%,50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Z-Score */}
                <div className="lg:col-span-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity className="h-3 w-3" /> Z-Score Berat vs Referensi WHO
                  </h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(220,10%,46%)", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(220,10%,46%)", fontSize: 11 }} domain={[-4, 4]} />
                      <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,90%)", borderRadius: 8 }} />
                      {whoReferenceLines.map((score) => (
                        <ReferenceLine
                          key={score} y={score}
                          stroke={score === 0 ? "hsl(152,55%,33%)" : Math.abs(score) <= 2 ? "hsl(45,90%,50%)" : "hsl(0,70%,50%)"}
                          strokeDasharray="4 3"
                          strokeWidth={score === 0 || score === -2 ? 2 : 1}
                          label={{ value: `${score} SD`, position: "right", fontSize: 9, fill: score === 0 ? "hsl(152,55%,33%)" : Math.abs(score) <= 2 ? "hsl(45,90%,50%)" : "hsl(0,70%,50%)" }}
                        />
                      ))}
                      <Line type="monotone" dataKey="z_score" stroke="hsl(220,70%,50%)" strokeWidth={3} dot={{ fill: "hsl(220,70%,50%)", r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-green-600" /><span>0 SD — Normal</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-yellow-500" /><span>±2 SD — Perhatian</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-red-500" /><span>±3 SD — Gizi Buruk/Lebih</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Empty measurement state ── */}
        {measurements.length === 0 && !loading && selectedChild && (
          <div className="rounded-2xl border border-dashed border-border bg-card text-center py-14 px-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground mb-1">Belum Ada Data Pengukuran</p>
            <p className="text-sm text-muted-foreground mb-5">
              Input data berat dan tinggi badan anak untuk memulai pemantauan
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Input Pengukuran
            </Button>
          </div>
        )}

        {/* ── Add/Edit Measurement Dialog ── */}
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); setShowForm(open); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                {editingMeasurement ? "Edit" : "Input"} Pengukuran — {selectedChild?.full_name || "Anak"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Anak</Label>
                <Select
                  value={selectedChild?.id || ""}
                  onValueChange={(v: string) => { const child = children.find((c) => c.id === v); if (child) setSelectedChild(child); }}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih anak" /></SelectTrigger>
                  <SelectContent>
                    {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Tanggal Pengukuran</Label>
                <Input type="date" value={formDate} onChange={(e) => { setFormDate(e.target.value); setFormErrors((p) => ({ ...p, date: undefined })); }} max={new Date().toISOString().split("T")[0]} />
                {formErrors.date && <p className="text-xs text-destructive mt-1">{formErrors.date}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Berat Badan (kg)</Label>
                  <Input type="number" value={formWeight} onChange={(e) => { setFormWeight(e.target.value); setFormErrors((p) => ({ ...p, weight: undefined })); }} placeholder="0.0" step="0.1" min="0.1" max="100" />
                  {formErrors.weight && <p className="text-xs text-destructive mt-1">{formErrors.weight}</p>}
                </div>
                <div>
                  <Label>Tinggi Badan (cm)</Label>
                  <Input type="number" value={formHeight} onChange={(e) => { setFormHeight(e.target.value); setFormErrors((p) => ({ ...p, height: undefined })); }} placeholder="0.0" step="0.1" min="1" max="200" />
                  {formErrors.height && <p className="text-xs text-destructive mt-1">{formErrors.height}</p>}
                </div>
              </div>
              <div>
                <Label>MUAC (cm) — Opsional</Label>
                <Input type="number" value={formMuac} onChange={(e) => setFormMuac(e.target.value)} placeholder="0.0" step="0.1" min="1" max="50" />
                <p className="text-xs text-muted-foreground mt-1">Lingkar Lengan Atas (untuk deteksi gizi buruk)</p>
              </div>
              <Button className="w-full" onClick={handleAddMeasurement} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {submitting ? "Menyimpan..." : editingMeasurement ? "Perbarui Pengukuran" : "Simpan Pengukuran"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm ── */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" /> Hapus Pengukuran?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Data pengukuran tanggal <strong>{deletingMeasurement && formatDate(deletingMeasurement.measurement_date)}</strong> akan dihapus permanen. Lanjutkan?
            </p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
              <Button variant="destructive" className="flex-1" onClick={handleConfirmDelete}>Hapus</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Add Child Dialog ── */}
        <Dialog open={showAddChild} onOpenChange={(open) => { if (!open) { setChildFormName(""); setChildFormDob(""); setChildFormGender("male"); setChildFormErrors({}); } setShowAddChild(open); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-primary" /> Tambah Data Anak
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nama Lengkap Anak</Label>
                <Input value={childFormName} onChange={(e) => { setChildFormName(e.target.value); setChildFormErrors((p) => ({ ...p, name: undefined })); }} placeholder="Contoh: Budi Santoso" />
                {childFormErrors.name && <p className="text-xs text-destructive mt-1">{childFormErrors.name}</p>}
              </div>
              <div>
                <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Tanggal Lahir</Label>
                <Input type="date" value={childFormDob} onChange={(e) => { setChildFormDob(e.target.value); setChildFormErrors((p) => ({ ...p, dob: undefined })); }} max={new Date().toISOString().split("T")[0]} />
                {childFormErrors.dob && <p className="text-xs text-destructive mt-1">{childFormErrors.dob}</p>}
              </div>
              <div>
                <Label>Jenis Kelamin</Label>
                <Select value={childFormGender} onValueChange={(v: "male" | "female") => setChildFormGender(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Laki-laki</SelectItem>
                    <SelectItem value="female">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAddChild} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {submitting ? "Menyimpan..." : "Tambah Anak"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PemantauanGizi;
