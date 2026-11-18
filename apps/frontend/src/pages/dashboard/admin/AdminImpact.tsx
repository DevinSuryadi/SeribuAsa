import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ImpactDashboard from "@/components/dashboard/ImpactDashboard";

export default function AdminImpact() {
  return (
    <DashboardLayout
      title="Dashboard Dampak"
      subtitle="Pantau pendanaan dan jangkauan penyaluran seluruh platform."
    >
      <ImpactDashboard admin />
    </DashboardLayout>
  );
}
