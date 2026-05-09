import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.svg";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.25-.95 2.31-2.02 3.01l3.27 2.53c1.9-1.75 3-4.33 3-7.43 0-.7-.06-1.37-.18-2.01H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.45l-3.27-2.53c-.9.61-2.05.97-3.34.97-2.57 0-4.76-1.74-5.54-4.08l-3.37 2.6A9.99 9.99 0 0 0 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.46 13.91A5.99 5.99 0 0 1 6.15 12c0-.66.11-1.29.31-1.91l-3.37-2.6A9.99 9.99 0 0 0 2 12c0 1.61.38 3.13 1.09 4.51l3.37-2.6z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.01c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.99 14.7 2 12 2a9.99 9.99 0 0 0-8.91 5.49l3.37 2.6c.78-2.34 2.97-4.08 5.54-4.08z"
      />
    </svg>
  );
}

const passwordRequirements = [
  { regex: /.{8,}/, label: "Minimal 8 karakter" },
  { regex: /[A-Z]/, label: "1 huruf besar" },
  { regex: /[0-9]/, label: "1 angka" },
  { regex: /[@$!%*?&]/, label: "1 simbol (@$!%*?&)" },
];

function isPasswordValid(password: string): boolean {
  return passwordRequirements.every((req) => req.regex.test(password));
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const fromCheckout = searchParams.get("from") === "checkout";
  const sessionExpired = searchParams.get("expired") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      if (fromCheckout) {
        navigate("/donation/create");
      } else {
        navigate("/dashboard");
      }
    }
  }, [authLoading, user, fromCheckout, navigate]);

  // Show expired session message on mount
  useEffect(() => {
    if (sessionExpired) {
      toast.error("Sesi Anda telah berakhir", {
        description: "Silakan login kembali untuk melanjutkan",
        duration: 5000,
      });
    }
  }, [sessionExpired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email tidak valid", {
        description: "Masukkan email dengan format yang benar (contoh: nama@email.com)",
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Password terlalu pendek", { description: "Password minimal 6 karakter" });
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      let errorMessage = error;
      if (error.toLowerCase().includes("invalid") || error.toLowerCase().includes("credentials")) {
        errorMessage = "Email atau password salah. Silakan coba lagi.";
      } else if (error.toLowerCase().includes("email")) {
        errorMessage = "Email belum terdaftar. Silakan daftar terlebih dahulu.";
      }
      toast.error("Login gagal", { description: errorMessage });
      setLoading(false);
      return;
    }

    toast.success("Login berhasil!", { description: "Selamat datang kembali" });

    if (fromCheckout) {
      navigate("/donation/create");
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();

    if (error) {
      toast.error("Login Google gagal", { description: error });
      setGoogleLoading(false);
      return;
    }

    toast.info("Mengalihkan ke Google...");
  };

  const passwordValid = isPasswordValid(password);

  return (
    <div
      className="flex h-screen items-center justify-center px-4 overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)",
      }}
    >
      {/* Background Decor */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(34,197,94,0.1)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(37,99,235,0.07)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="w-full max-w-md bg-white p-8 sm:p-10 relative z-10"
        style={{
          borderRadius: "28px",
          boxShadow: "0 24px 48px -12px rgba(22,163,74,0.15), 0 0 24px 0 rgba(0,0,0,0.04)",
          border: "1px solid rgba(22,163,74,0.1)",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          className="block mb-8 transition-transform hover:scale-105"
          style={{ textDecoration: "none" }}
        >
          <div className="flex flex-col items-center">
            <img
              src={logo}
              alt="SeribuAsa Logo"
              style={{
                width: 90,
                height: 90,
                objectFit: "contain",
                marginBottom: -15,
                filter: "drop-shadow(0 4px 8px rgba(22,163,74,0.2))",
              }}
            />
            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                margin: 0,
                color: "#346A43",
              }}
            >
              SeribuAsa
            </h1>
          </div>
        </Link>

        {/* Title */}
        <div className="text-center mb-8">
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#111",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Selamat Datang Kembali
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#666",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        {/* Checkout redirect banner */}
        {fromCheckout && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(22,163,74,0.08)",
              border: "1px solid rgba(22,163,74,0.2)",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 13, color: "#15803d", fontWeight: 500 }}>
              Silakan login untuk melanjutkan donasi Anda
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#333",
                display: "block",
                marginBottom: 8,
              }}
            >
              Email Lengkap
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid #e5e5e5",
                background: "#fafafa",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#16a34a";
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.boxShadow = "0 0 0 4px rgba(22,163,74,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e5e5";
                e.currentTarget.style.background = "#fafafa";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#333",
                display: "block",
                marginBottom: 8,
              }}
            >
              Kata Sandi
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "14px 44px 14px 16px",
                  borderRadius: "14px",
                  border: "1px solid #e5e5e5",
                  background: "#fafafa",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                  letterSpacing: !showPw && password ? "3px" : "normal",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#16a34a";
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(22,163,74,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e5e5e5";
                  e.currentTarget.style.background = "#fafafa";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#a3a3a3",
                  padding: 4,
                }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Requirements Notes */}
            {password.length > 0 && !passwordValid && (
              <div
                style={{
                  marginTop: 8,
                  padding: "10px 12px",
                  background: "#fafafa",
                  borderRadius: 8,
                }}
              >
                <p style={{ fontSize: 10, color: "#a3a3a3", marginBottom: 4 }}>
                  Jika lupa password, gunakan:
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "#737373" }}>Min. 8 karakter</span>
                  <span style={{ fontSize: 10, color: "#737373" }}>• 1 huruf besar</span>
                  <span style={{ fontSize: 10, color: "#737373" }}>• 1 angka</span>
                  <span style={{ fontSize: 10, color: "#737373" }}>• 1 simbol</span>
                </div>
              </div>
            )}
          </div>

          {/* Forgot password */}
          <p style={{ textAlign: "right", marginTop: -8 }}>
            <Link
              to="/lupa-sandi"
              style={{
                fontSize: 13,
                color: "#16a34a",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Lupa kata sandi?
            </Link>
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email || password.length < 6}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              border: "none",
              cursor: loading || !email || password.length < 6 ? "not-allowed" : "pointer",
              opacity: loading || !email || password.length < 6 ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 8px 20px -6px rgba(22,163,74,0.4)",
              transition: "all 0.2s ease",
              marginTop: 4,
            }}
            onMouseEnter={(e) => {
              if (!loading && email && password.length >= 6) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 25px -6px rgba(22,163,74,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && email && password.length >= 6) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px -6px rgba(22,163,74,0.4)";
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span>Memproses...</span>
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        {/* Google Login */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, height: "1px", background: "#e5e5e5" }} />
            <span style={{ fontSize: 12, color: "#a3a3a3" }}>atau lanjutkan dengan</span>
            <div style={{ flex: 1, height: "1px", background: "#e5e5e5" }} />
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              fontSize: 14,
              fontWeight: 600,
              color: "#333",
              background: "#fff",
              border: "1px solid #e5e5e5",
              cursor: loading || googleLoading ? "not-allowed" : "pointer",
              opacity: loading || googleLoading ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading && !googleLoading) {
                e.currentTarget.style.background = "#fafafa";
                e.currentTarget.style.borderColor = "#d4d4d4";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !googleLoading) {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#e5e5e5";
              }
            }}
          >
            {googleLoading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span>Mengalihkan...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>
        </div>

        {/* Register Link */}
        <p style={{ fontSize: 13, textAlign: "center", color: "#737373", marginTop: 24 }}>
          Belum punya akun?{" "}
          <Link
            to="/register"
            style={{
              color: "#16a34a",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
