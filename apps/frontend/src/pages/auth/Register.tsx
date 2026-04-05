import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Eye,
  EyeOff,
  Heart,
  Users,
  Store,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Role = "donor" | "beneficiary" | "vendor";

const roles: { id: Role; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "donor", label: "Donatur", icon: Heart, desc: "Bantu nutrisi anak" },
  { id: "beneficiary", label: "Penerima", icon: Users, desc: "Terima bantuan" },
  { id: "vendor", label: "Vendor", icon: Store, desc: "Menjembatani Bantuan" },
];

const passwordRequirements = [
  { regex: /.{8,}/, label: "Minimal 8 karakter" },
  { regex: /[A-Z]/, label: "1 huruf besar" },
  { regex: /[0-9]/, label: "1 angka" },
  { regex: /[@$!%*?&]/, label: "1 simbol (@$!%*?&)" },
];

function isPasswordValid(password: string): boolean {
  return passwordRequirements.every((req) => req.regex.test(password));
}

export default function Register() {
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.error("Pilih role terlebih dahulu", { description: "Pilih salah satu opsi di bawah" });
      return;
    }

    if (!fullName.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email tidak valid", {
        description: "Masukkan email dengan format yang benar (contoh: nama@email.com)",
      });
      return;
    }

    if (!isPasswordValid(password)) {
      toast.error("Password belum memenuhi syarat", {
        description: "Pastikan password memenuhi semua kriteria di bawah",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok", {
        description: "Pastikan password dan konfirmasi password sama",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName, selectedRole);

    if (error) {
      let errorMessage = error;
      if (error.toLowerCase().includes("email")) {
        errorMessage = "Email sudah terdaftar atau tidak valid. Silakan gunakan email lain.";
      } else if (error.toLowerCase().includes("password")) {
        errorMessage = "Password terlalu lemah. Gunakan kombinasi yang lebih kuat.";
      }
      toast.error("Registrasi gagal", { description: errorMessage });
      setLoading(false);
      return;
    }

    toast.success("Akun berhasil dibuat!", { description: "Selamat datang di SeribuAsa" });
    navigate("/dashboard");
  };

  const passwordValid = password.length > 0 && isPasswordValid(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
            }}
          >
            <Shield style={{ width: 26, height: 26, color: "#fff" }} />
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginTop: 14,
              color: "#111",
              letterSpacing: "-0.02em",
            }}
          >
            SeribuAsa
          </h1>
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            textAlign: "center",
            marginBottom: 4,
            color: "#111",
          }}
        >
          Buat Akun Baru
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#737373",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          Bergabung dengan gerakan nutrisi anak Indonesia
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Role Selection */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#404040",
                display: "block",
                marginBottom: 10,
              }}
            >
              Daftar sebagai
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 8px",
                    borderRadius: "14px",
                    border: selectedRole === r.id ? "2px solid #16a34a" : "1.5px solid #e5e5e5",
                    background: selectedRole === r.id ? "rgba(22,163,74,0.04)" : "#fafafa",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRole !== r.id) {
                      e.currentTarget.style.borderColor = "#d4d4d4";
                      e.currentTarget.style.background = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRole !== r.id) {
                      e.currentTarget.style.borderColor = "#e5e5e5";
                      e.currentTarget.style.background = "#fafafa";
                    }
                  }}
                >
                  <r.icon
                    size={22}
                    style={{ color: selectedRole === r.id ? "#16a34a" : "#a3a3a3" }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: selectedRole === r.id ? "#16a34a" : "#525252",
                    }}
                  >
                    {r.label}
                  </span>
                  <span style={{ fontSize: 10, color: "#a3a3a3", textAlign: "center" }}>
                    {r.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#404040",
                display: "block",
                marginBottom: 6,
              }}
            >
              Nama Lengkap
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1.5px solid #e5e5e5",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#16a34a")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
            />
          </div>

          {/* Email */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#404040",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1.5px solid #e5e5e5",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#16a34a")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#404040",
                display: "block",
                marginBottom: 6,
              }}
            >
              Kata Sandi
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                required
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #e5e5e5",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#16a34a")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5e5")}
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

            {/* Password Requirements */}
            {password.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  padding: "12px 14px",
                  background: "#fafafa",
                  borderRadius: 10,
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 500, color: "#737373", marginBottom: 8 }}>
                  Password harus memenuhi:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {passwordRequirements.map((req, idx) => {
                    const valid = req.regex.test(password);
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {valid ? (
                          <CheckCircle2 size={12} style={{ color: "#16a34a" }} />
                        ) : (
                          <Circle size={12} style={{ color: "#d4d4d4" }} />
                        )}
                        <span style={{ fontSize: 11, color: valid ? "#16a34a" : "#a3a3a3" }}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#404040",
                display: "block",
                marginBottom: 6,
              }}
            >
              Konfirmasi Kata Sandi
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan ulang kata sandi"
                required
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 14px",
                  borderRadius: "12px",
                  border:
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "1.5px solid #16a34a"
                        : "1.5px solid #ef4444"
                      : "1.5px solid #e5e5e5",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#16a34a")}
                onBlur={(e) => {
                  if (confirmPassword.length > 0) {
                    e.currentTarget.style.borderColor = passwordsMatch ? "#16a34a" : "#ef4444";
                  } else {
                    e.currentTarget.style.borderColor = "#e5e5e5";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
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
                {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>Password tidak cocok</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              !selectedRole ||
              !fullName.trim() ||
              !email ||
              !passwordValid ||
              !passwordsMatch
            }
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(22,163,74,0.25)",
              marginTop: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span>Memproses...</span>
              </>
            ) : (
              "Buat Akun"
            )}
          </button>
        </form>

        {/* Login Link */}
        <p style={{ fontSize: 13, textAlign: "center", color: "#737373", marginTop: 24 }}>
          Sudah punya akun?{" "}
          <Link
            to="/masuk"
            style={{
              color: "#16a34a",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
