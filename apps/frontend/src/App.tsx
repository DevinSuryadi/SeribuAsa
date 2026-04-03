import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Masuk from "./pages/auth/Masuk";
import Register from "./pages/auth/Register";
import Donasi from "./pages/Donasi";
import Tentang from "./pages/Tentang";
import Dampak from "./pages/Dampak";
import LupaSandi from "./pages/auth/LupaSandi";
import ResetPassword from "./pages/auth/ResetPassword";
import CreateDonation from "./pages/donation/CreateDonation";
import MockPaymentModal from "./pages/donation/MockPaymentModal";
import DonationSuccess from "./pages/donation/DonationSuccess";

function App() {
  return (
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

      {/* Donation flow routes */}
      <Route path="/donation/create" element={<CreateDonation />} />
      <Route path="/donation/payment/:donationId" element={<MockPaymentModal />} />
      <Route path="/donation/success" element={<DonationSuccess />} />
    </Routes>
  );
}

export default App;
