import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2, Heart, Users, Store } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import logo from "@/assets/logo.svg"

export default function Masuk() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signInAsDemo } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Email validation with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Email tidak valid", { description: "Masukkan email dengan format yang benar (contoh: nama@email.com)" })
      return
    }

    // Password validation
    if (password.length < 6) {
      toast.error("Password terlalu pendek", { description: "Password minimal 6 karakter" })
      return
    }

    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      toast.error("Login gagal", { description: error })
      setLoading(false)
      return
    }

    toast.success("Login berhasil!")
    navigate("/dashboard")
  }

  const handleDemoLogin = (role: "donor" | "beneficiary" | "vendor") => {
    signInAsDemo(role)
    toast.success(`Login sebagai Demo ${role === "donor" ? "Donatur" : role === "beneficiary" ? "Penerima" : "Vendor"}!`)
    navigate("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
            <img 
              src={logo} 
              alt="Logo" 
              style={{ 
              width: 100, 
              height: 100, 
              objectFit: 'contain',
              marginTop: -10, 
              }} 
            />
          <h1 className="text-xl font-bold mt-2 "
              style={{
                marginTop: -23,
                marginBottom: -17,
                color: '#346A43'
              }}> SeribuAsa </h1>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-center mb-1">Masuk ke Akun</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Masukkan email dan kata sandi Anda</p>

        {/* Demo Account Buttons */}
        <div className="mb-6">
          <p className="text-sm font-medium text-center text-gray-600 mb-3">Login Cepat (Demo)</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("donor")}
              className="flex flex-col items-center gap-1 border border-green-200 rounded-lg p-3 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition"
            >
              <Heart size={18} />
              Donatur
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("beneficiary")}
              className="flex flex-col items-center gap-1 border border-blue-200 rounded-lg p-3 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
            >
              <Users size={18} />
              Penerima
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("vendor")}
              className="flex flex-col items-center gap-1 border border-purple-200 rounded-lg p-3 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
            >
              <Store size={18} />
              Vendor
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-400">atau</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
              className="w-full mt-1 border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-green-300"
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
                placeholder="••••••••"
                required
                className="w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring focus:ring-green-300"
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

          {/* Forgot password */}
          <p className="text-right">
            <Link to="/lupa-sandi" className="text-sm text-green-600 hover:underline">
              Lupa kata sandi?
            </Link>
          </p>

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
              "Masuk"
            )}
          </button>
        </form>

        {/* Register */}
        <p className="text-sm text-center text-gray-500 mt-6">
          Belum punya akun?{" "}
          <Link to="/register" className="text-green-600 font-medium">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}
