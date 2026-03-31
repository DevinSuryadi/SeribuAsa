import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Masuk from "./pages/auth/Masuk";
import Register from "./pages/auth/Register";
import Donasi from "./pages/Donasi";
import Tentang from "./pages/Tentang";
import Dampak from "./pages/Dampak";
import LupaSandi from "./pages/auth/LupaSandi";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/masuk" element={<Masuk />} />
      <Route path="/register" element={<Register />} />
      <Route path="/donasi" element={<Donasi />} />
      <Route path="/tentang" element={<Tentang />} />
      <Route path="/dampak" element={<Dampak />} />
      <Route path="/lupa-sandi" element={<LupaSandi/>} />

    </Routes>
  );
}

export default App;
