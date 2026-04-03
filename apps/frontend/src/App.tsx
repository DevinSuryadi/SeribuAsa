import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Index from "./pages/Index";
import Masuk from "./pages/auth/Masuk";
import Register from "./pages/auth/Register";
import Donasi from "./pages/Donasi";
import Tentang from "./pages/Tentang";
import Dampak from "./pages/Dampak";
import LupaSandi from "./pages/auth/LupaSandi";
import ResetPassword from "./pages/auth/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import DonorDashboard from "./pages/dashboard/DonorDashboard";
import BeneficiaryDashboard from "./pages/dashboard/BeneficiaryDashboard";
import DonorRiwayat from "./pages/dashboard/DonorRiwayat";
import DonorDampak from "./pages/dashboard/DonorDampak";
import KatalogPangan from "./pages/dashboard/KatalogPangan";
import PenukaranVoucher from "./pages/dashboard/PenukaranVoucher";
import Profile from "./pages/dashboard/Profile";
import KelolaProduk from "./pages/dashboard/KelolaProduk";
import VendorSettlement from "./pages/dashboard/VendorSettlement";
import VendorDashboard from "./pages/dashboard/VendorDashboard";
import SurveiFIES from "./pages/dashboard/SurveiFIES";
import PemantauanGizi from "./pages/dashboard/PemantauanGizi";
import CreateDonation from "./pages/donation/CreateDonation";
import MockPaymentModal from "./pages/donation/MockPaymentModal";
import DonationSuccess from "./pages/donation/DonationSuccess";
import { useAuth } from "./contexts/AuthContext";

function DashboardRedirect() {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (userRole === "donor") return <Navigate to="/dashboard/donor" replace />;
  if (userRole === "beneficiary") return <Navigate to="/dashboard/beneficiary" replace />;
  if (userRole === "vendor") return <Navigate to="/dashboard/vendor" replace />;
  if (userRole === "admin") return <Navigate to="/dashboard/admin" replace />;

  return <Navigate to="/" replace />;
}

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/register" element={<Register />} />
        <Route path="/donasi" element={<Donasi />} />
        <Route path="/tentang" element={<Tentang />} />
        <Route path="/dampak" element={<Dampak />} />
        <Route path="/lupa-sandi" element={<LupaSandi />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Authenticated routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
        <Route path="/dashboard/donor" element={<ProtectedRoute allowedRoles={["donor", "admin"]}><DonorDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/beneficiary" element={<ProtectedRoute allowedRoles={["beneficiary", "admin"]}><BeneficiaryDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/riwayat" element={<ProtectedRoute allowedRoles={["donor", "admin"]}><DonorRiwayat /></ProtectedRoute>} />
        <Route path="/dashboard/dampak" element={<ProtectedRoute allowedRoles={["donor", "admin"]}><DonorDampak /></ProtectedRoute>} />
        <Route path="/dashboard/katalog" element={<ProtectedRoute allowedRoles={["beneficiary", "admin"]}><KatalogPangan /></ProtectedRoute>} />
        <Route path="/dashboard/penukaran" element={<ProtectedRoute allowedRoles={["beneficiary", "admin"]}><PenukaranVoucher /></ProtectedRoute>} />
        <Route path="/dashboard/survei-fies" element={<ProtectedRoute allowedRoles={["beneficiary", "admin"]}><SurveiFIES /></ProtectedRoute>} />
        <Route path="/dashboard/pemantauan-gizi" element={<ProtectedRoute allowedRoles={["beneficiary", "admin"]}><PemantauanGizi /></ProtectedRoute>} />
        <Route path="/dashboard/kelola-produk" element={<ProtectedRoute allowedRoles={["vendor", "admin"]}><KelolaProduk /></ProtectedRoute>} />
        <Route path="/dashboard/settlement" element={<ProtectedRoute allowedRoles={["vendor", "admin"]}><VendorSettlement /></ProtectedRoute>} />
        <Route path="/dashboard/vendor" element={<ProtectedRoute allowedRoles={["vendor", "admin"]}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Donation flow routes */}
        <Route path="/donation/create" element={<ProtectedRoute allowedRoles={["donor", "admin"]}><CreateDonation /></ProtectedRoute>} />
        <Route path="/donation/payment/:donationId" element={<ProtectedRoute allowedRoles={["donor", "admin"]}><MockPaymentModal /></ProtectedRoute>} />
        <Route path="/donation/success" element={<ProtectedRoute><DonationSuccess /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
