import { useState } from "react";
import { Download, Users, ShoppingCart, Ticket, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_BASE_URL } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

const exportOptions = [
  {
    label: "Pengguna",
    desc: "Data akun pengguna",
    type: "users",
    icon: Users,
  },
  {
    label: "Pesanan",
    desc: "Riwayat pesanan",
    type: "orders",
    icon: ShoppingCart,
  },
  {
    label: "Voucher",
    desc: "Data voucher aktif",
    type: "vouchers",
    icon: Ticket,
  },
  {
    label: "Penukaran",
    desc: "Riwayat penukaran",
    type: "redemptions",
    icon: Gift,
  },
];

export function ExportSection() {
  const [selectedExport, setSelectedExport] = useState("users");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: string) => {
    try {
      setIsExporting(true);
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await fetch(`${API_BASE_URL}/admin/export/${type}`, {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Gagal mengekspor data");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${type}.csv`;
      a.click();

      window.URL.revokeObjectURL(url);
      toast.success(`Berhasil mengekspor ${type}.csv`);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.035)] ring-1 ring-slate-200">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
          <Download className="h-4 w-4 text-sky-600" />
        </div>
        <h2 className="text-sm font-semibold text-slate-950">Ekspor Data</h2>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="grid grid-cols-2 gap-2">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedExport === option.type;

            return (
              <button
                key={option.type}
                onClick={() => setSelectedExport(option.type)}
                className={[
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
                  isSelected
                    ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200"
                    : "border-slate-200 bg-white hover:border-slate-300",
                ].join(" ")}
              >
                <Icon
                  className={["h-4 w-4", isSelected ? "text-emerald-600" : "text-slate-400"].join(
                    " "
                  )}
                />
                <span
                  className={[
                    "text-xs font-semibold",
                    isSelected ? "text-emerald-900" : "text-slate-700",
                  ].join(" ")}
                >
                  {option.label}
                </span>
                <span className="text-[10px] text-slate-400">{option.desc}</span>
              </button>
            );
          })}
        </div>

        <Button
          onClick={() => handleExport(selectedExport)}
          disabled={isExporting}
          className="mt-auto h-9 w-full rounded-xl bg-emerald-600 text-xs font-semibold hover:bg-emerald-700"
        >
          {isExporting ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Mengekspor...
            </span>
          ) : (
            <>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Ekspor {exportOptions.find((o) => o.type === selectedExport)?.label}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
