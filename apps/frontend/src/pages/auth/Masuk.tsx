import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export default function Masuk() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      toast.error("Login gagal", { description: error.message })
      setLoading(false)
      return
    }

    toast.success("Login berhasil!")
    navigate("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
            <Shield className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold mt-2">SeribuAsa</h1>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-center mb-1">Masuk ke Akun</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Masukkan email dan kata sandi Anda</p>

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
