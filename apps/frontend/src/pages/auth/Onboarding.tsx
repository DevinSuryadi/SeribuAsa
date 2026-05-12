import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Users, Store, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/services/api";

type Role = "donor" | "beneficiary" | "vendor";

const roles: { id: Role; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "donor", label: "Donatur", icon: Heart, desc: "Bantu penuhi nutrisi" },
  { id: "beneficiary", label: "Penerima", icon: Users, desc: "Dapatkan dukungan pangan" },
  { id: "vendor", label: "Vendor", icon: Store, desc: "Sediakan bahan pangan" },
];

export default function Onboarding() {
  const { userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && userRole !== "unassigned") {
      navigate("/dashboard");
    }
  }, [userRole, authLoading, navigate]);

  const handleSubmit = async () => {
    if (!selectedRole) return;
    setSubmitting(true);

    try {
      await apiFetch("/auth/complete-onboarding", {
        method: "POST",
        body: JSON.stringify({ role: selectedRole }),
      });
      toast.success("Profil berhasil dibuat!");
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error("Gagal menyimpan profil", {
        description: err.message || "Silakan coba lagi",
      });
      setSubmitting(false);
    }
  };

  if (authLoading || userRole !== "unassigned") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-2">
          Pilih Peran Anda
        </h2>
        <p className="text-center text-gray-500 mb-7 text-sm leading-relaxed">
          Untuk memberikan pengalaman terbaik, beritahu kami bagaimana Anda ingin menggunakan NutriGuard.
        </p>

        <div className="space-y-3 mb-6">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-200 min-h-[64px] text-left ${
                  isSelected
                    ? "border-green-500 bg-green-50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-green-200 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`p-3 rounded-xl mr-4 shrink-0 ${
                    isSelected ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <div className="text-left">
                  <h3 className={`font-semibold text-base ${isSelected ? "text-green-900" : "text-gray-900"}`}>
                    {r.label}
                  </h3>
                  <p className="text-sm text-gray-500">{r.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedRole || submitting}
          className={`w-full h-12 px-4 rounded-2xl font-semibold text-white flex items-center justify-center transition-all text-sm ${
            selectedRole && !submitting
              ? "bg-green-600 hover:bg-green-700 shadow-md"
              : "bg-gray-200 cursor-not-allowed text-gray-400"
          }`}
        >
          {submitting ? <Loader2 size={20} className="animate-spin" /> : "Lanjutkan"}
        </button>
      </div>
    </div>
  );
}
