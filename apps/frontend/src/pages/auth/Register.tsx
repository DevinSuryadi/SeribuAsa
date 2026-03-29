import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Eye, EyeOff, Heart, Users, Store } from "lucide-react";

type Role = "donor" | "beneficiary" | "vendor";

const roles: { id: Role; label: string; icon: React.ElementType }[] = [
  { id: "donor", label: "Donatur", icon: Heart },
  { id: "beneficiary", label: "Penerima", icon: Users },
  { id: "vendor", label: "Vendor", icon: Store },
];

export default function Register() {
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [showPw, setShowPw] = useState(false);
  const [nik, setNik] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
            <Shield className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold mt-2">SeribuAsa</h1>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-1">
          Buat Akun Baru
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          Bergabunglah dengan SeribuAsa
        </p>

        <form className="space-y-4">

          {/* Role */}
          <div>
            <label className="text-sm font-medium">Daftar sebagai</label>

            <div className="grid grid-cols-3 gap-2 mt-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`flex flex-col items-center gap-1 border rounded-lg p-3 text-xs transition ${
                    selectedRole === r.id
                      ? "border-green-600 bg-green-50"
                      : "border-gray-300"
                  }`}
                >
                  <r.icon size={18} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nama */}
          <div>
            <label className="text-sm font-medium">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Nama lengkap"
              className="w-full border rounded-md px-3 py-2 mt-1"
            />
          </div>

          {/* NIK hanya untuk beneficiary */}
          {selectedRole === "beneficiary" && (
            <div>
              <label className="text-sm font-medium">NIK</label>
              <input
                type="text"
                placeholder="Masukkan NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1"
                maxLength={16}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="email@contoh.com"
              className="w-full border rounded-md px-3 py-2 mt-1"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium">Kata Sandi</label>

            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Min. 6 karakter"
                className="w-full border rounded-md px-3 py-2 pr-10"
              />

              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Button */}
          <button className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition">
            Daftar
          </button>
        </form>

        {/* Login link */}
        <p className="text-sm text-center text-gray-500 mt-6">
          Sudah punya akun?{" "}
          <Link to="/masuk" className="text-green-600 font-medium hover:underline">
            Masuk
          </Link>
        </p>

      </div>
    </div>
  );
}