import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Donasi from "./pages/Donasi";
import Tentang from "./pages/Tentang";
import Dampak from "./pages/Dampak";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/daftar" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/donasi" element={<Donasi />} />
      <Route path="/tentang" element={<Tentang />} />
      <Route path="/dampak" element={<Dampak />} />

    </Routes>
  );
}

export default App;
