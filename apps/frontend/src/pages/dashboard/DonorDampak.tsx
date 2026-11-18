import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ImpactDashboard from "@/components/dashboard/ImpactDashboard";

export default function DonorDampak() {
  return (
    <DashboardLayout
      title="Dampak Donasi Anda"
      subtitle="Pantau kontribusi dan penyaluran bantuan yang tercatat."
    >
      <ImpactDashboard />
    </DashboardLayout>
  );
}
