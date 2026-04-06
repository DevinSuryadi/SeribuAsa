import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Ini perintah saktinya buat maksa scroll ke paling atas (0,0)
    window.scrollTo(0, 0);
  }, [pathname]); // Setiap kali pathname (url) berubah, jalankan fungsi ini

  return null;
};

export default ScrollToTop;