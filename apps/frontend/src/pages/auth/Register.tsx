import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Shield, Eye, EyeOff, Heart, Users, Store, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

type Role = "donor" | "beneficiary" | "vendor"

const roles: { id: Role; label: string; icon: React.ElementType }[] = [
  { id: "donor", label: "Donatur", icon: Heart },
  { id: "beneficiary", label: "Penerima", icon: Users },
  { id: "vendor", label: "Vendor", icon: Store },
]

export default function Register() {
  const [selectedRole, setSelectedRole] = useState<Role | "">("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nik, setNik] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRole) {
      toast.error("Pilih role terlebih dahulu")
      return
    }

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Email tidak valid", { description: "Masukkan email dengan format yang benar (contoh: nama@email.com)" })
      return
    }

    setLoading(true)

    await signUp(email, password, fullName, selectedRole)

    toast.success("Registrasi berhasil!")
    navigate("/dashboard")
  }

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

        <h2 className="text-2xl font-semibold text-center mb-1">Buat Akun Baru</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Bergabunglah dengan SeribuAsa</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap"
              required
              className="w-full border rounded-md px-3 py-2 mt-1"
            />
          </div>

          {/* NIK hanya untuk beneficiary */}
          {selectedRole === "beneficiary" && (
            <div>
              <label className="text-sm font-medium">NIK</label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="Masukkan NIK"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
              className="w-full border rounded-md px-3 py-2 mt-1"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium">Kata Sandi</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                required
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              "Daftar"
            )}
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
  )
}
