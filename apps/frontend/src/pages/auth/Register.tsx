import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Leaf, Eye, EyeOff, Heart, Users, Store, Loader2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.25-.95 2.31-2.02 3.01l3.27 2.53c1.9-1.75 3-4.33 3-7.43 0-.7-.06-1.37-.18-2.01H12z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.45l-3.27-2.53c-.9.61-2.05.97-3.34.97-2.57 0-4.76-1.74-5.54-4.08l-3.37 2.6A9.99 9.99 0 0 0 12 22z" />
      <path fill="#4A90E2" d="M6.46 13.91A5.99 5.99 0 0 1 6.15 12c0-.66.11-1.29.31-1.91l-3.37-2.6A9.99 9.99 0 0 0 2 12c0 1.61.38 3.13 1.09 4.51l3.37-2.6z" />
      <path fill="#FBBC05" d="M12 6.01c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.99 14.7 2 12 2a9.99 9.99 0 0 0-8.91 5.49l3.37 2.6c.78-2.34 2.97-4.08 5.54-4.08z" />
    </svg>
  )
}

type Role = "donor" | "beneficiary" | "vendor"

const roles: { id: Role; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "donor", label: "Donatur", icon: Heart, desc: "Bantu nutrisi" },
  { id: "beneficiary", label: "Penerima", icon: Users, desc: "Terima dukungan" },
  { id: "vendor", label: "Vendor", icon: Store, desc: "Jual pangan" },
]

const passwordRequirements = [
  { regex: /.{8,}/, label: "Minimal 8 karakter" },
  { regex: /[A-Z]/, label: "1 huruf besar" },
  { regex: /[0-9]/, label: "1 angka" },
  { regex: /[@$!%*?&]/, label: "1 simbol (@$!%*?&)" },
]

function isPasswordValid(password: string): boolean {
  return passwordRequirements.every((req) => req.regex.test(password))
}

export default function Register() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuth()
  const [role, setRole] = useState<Role | null>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showRequirements, setShowRequirements] = useState(false)

  const passwordValid = password.length > 0 && isPasswordValid(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!role) {
      toast.error("Pilih peran Anda terlebih dahulu")
      return
    }

    if (!fullName.trim()) {
      toast.error("Nama lengkap tidak boleh kosong")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Email tidak valid")
      return
    }

    if (phone.trim()) {
      const phoneRegex = /^[0-9+\-\s]{8,20}$/
      if (!phoneRegex.test(phone.trim())) {
        toast.error("Nomor HP tidak valid")
        return
      }
    }

    if (!passwordValid) {
      toast.error("Password tidak memenuhi syarat")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok")
      return
    }

    setLoading(true)
    try {
      const { error } = await signUp(email, password, fullName, role, {
        phone,
        address,
      })

      if (error) {
        const errorMsg = error.toLowerCase()
        if (errorMsg.includes("email") || errorMsg.includes("already")) {
          toast.error("Email sudah terdaftar", { description: "Gunakan email lain atau coba login" })
        } else if (errorMsg.includes("password")) {
          toast.error("Password error", { description: error })
        } else {
          toast.error("Registrasi gagal", { description: error })
        }
        return
      }

      toast.success("Registrasi berhasil!")
      navigate("/dashboard")
    } catch (err) {
      const error = err as Error
      const errorMsg = error.message.toLowerCase()
      if (errorMsg.includes("email") || errorMsg.includes("already")) {
        toast.error("Email sudah terdaftar", { description: "Gunakan email lain atau coba login" })
      } else if (errorMsg.includes("password")) {
        toast.error("Password error", { description: error.message })
      } else {
        toast.error("Registrasi gagal", { description: error.message || "Coba lagi nanti" })
      }
      console.error("Registration error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    if (!role) {
      toast.error("Pilih peran terlebih dahulu", { description: "Role akan dipakai untuk akun Google baru Anda." })
      return
    }

    setGoogleLoading(true)
    const { error } = await signInWithGoogle(role)

    if (error) {
      toast.error("Registrasi Google gagal", { description: error })
      setGoogleLoading(false)
      return
    }

    toast.info("Mengalihkan ke Google...")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-md">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">SeribuAsa</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Anda adalah</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => {
                const Icon = r.icon
                const isSelected = role === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`p-2 rounded-lg border-2 transition ${
                      isSelected
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? "text-green-600" : "text-gray-400"}`} />
                    <p className="text-xs font-medium text-gray-900">{r.label}</p>
                    <p className="text-xs text-gray-500">{r.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
              placeholder="Masukkan nama"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
              placeholder="nama@email.com"
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor HP (opsional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
              placeholder="08xxxxxxxxxx"
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat (opsional)</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none resize-y min-h-[80px]"
              placeholder="Masukkan alamat"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none pr-10"
                placeholder="Buat password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Requirements - Collapsible */}
            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRequirements(!showRequirements)}
                className="text-xs text-green-600 font-medium mt-1"
              >
                {showRequirements ? "Sembunyikan" : "Lihat"} persyaratan password
              </button>
            )}

            {showRequirements && password.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 space-y-1">
                {passwordRequirements.map((req) => {
                  const met = req.regex.test(password)
                  return (
                    <div key={req.label} className="flex items-center gap-2 text-xs">
                      {met ? (
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={met ? "text-green-700" : "text-gray-600"}>{req.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Konfirmasi Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none pr-10"
                placeholder="Ulangi password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Password tidak cocok</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !role}
            className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-semibold mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mendaftar...
              </>
            ) : (
              "Daftar"
            )}
          </Button>

          <div className="flex items-center gap-3 mt-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">atau</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading || googleLoading || !role}
            className="w-full h-10 rounded-lg border border-gray-300 bg-white text-gray-800 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mengalihkan...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Daftar dengan Google</span>
              </>
            )}
          </button>
          {!role && (
            <p className="text-xs text-gray-500 text-center">Pilih role di atas sebelum daftar dengan Google</p>
          )}

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-green-600 font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
