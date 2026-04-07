import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, Loader2, Heart, Users, Store } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import logo from '@/assets/logo.svg'

type Role = "donor" | "beneficiary" | "vendor"

const roles: { id: Role; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "donor", label: "Donatur", icon: Heart, desc: "Bantu nutrisi" },
  { id: "beneficiary", label: "Penerima", icon: Users, desc: "Terima dukungan" },
  { id: "vendor", label: "Vendor", icon: Store, desc: "Jual pangan" },
]

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

const passwordRequirements = [
  { regex: /.{8,}/, label: "Minimal 8 karakter" },
  { regex: /[A-Z]/, label: "1 huruf besar" },
  { regex: /[0-9]/, label: "1 angka" },
  { regex: /[@$!%*?&]/, label: "1 simbol (@$!%*?&)" },
]

function isPasswordValid(password: string): boolean {
  return passwordRequirements.every((req) => req.regex.test(password))
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const fromCheckout = searchParams.get("from") === "checkout"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleRole, setGoogleRole] = useState<Role>("donor")
  const { signIn, signInWithGoogle, signInAsDemo, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && user) {
      if (fromCheckout) {
        navigate("/donation/create")
      } else {
        navigate("/dashboard")
      }
    }
  }, [authLoading, user, fromCheckout, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Email tidak valid", { description: "Masukkan email dengan format yang benar (contoh: nama@email.com)" })
      return
    }

    if (password.length < 6) {
      toast.error("Password terlalu pendek", { description: "Password minimal 6 karakter" })
      return
    }

    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      let errorMessage = error
      if (error.toLowerCase().includes("invalid") || error.toLowerCase().includes("credentials")) {
        errorMessage = "Email atau password salah. Silakan coba lagi."
      } else if (error.toLowerCase().includes("email")) {
        errorMessage = "Email belum terdaftar. Silakan daftar terlebih dahulu."
      }
      toast.error("Login gagal", { description: errorMessage })
      setLoading(false)
      return
    }

    toast.success("Login berhasil!", { description: "Selamat datang kembali" })

    if (fromCheckout) {
      navigate("/donation/create")
    } else {
      navigate("/dashboard")
    }
  }

  const handleDemoLogin = (role: "donor" | "beneficiary" | "vendor") => {
    signInAsDemo(role)
    toast.success(`Login sebagai Demo ${role === "donor" ? "Donatur" : role === "beneficiary" ? "Penerima" : "Vendor"}!`)
    navigate("/dashboard")
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle(googleRole)

    if (error) {
      toast.error("Login Google gagal", { description: error })
      setGoogleLoading(false)
      return
    }

    toast.info("Mengalihkan ke Google...")
  }

  const passwordValid = isPasswordValid(password)

  return (
    <div className="flex min-h-screen justify-center px-4 py-12 overflow-y-auto"
      style={{
        background:"#F9FBF9",
      }}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg p-6">
        {/* Logo */}
        <Link to="/">
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
        </Link>

        {/* Title */}
        <h2 style={{ 
          fontSize: 22, 
          fontWeight: 600, 
          textAlign: 'center', 
          marginBottom: 4, 
          color: '#111',
        }}>
          Masuk ke Akun
        </h2>
        <p style={{ 
          fontSize: 14, 
          color: '#737373', 
          textAlign: 'center', 
          marginBottom: 24,
        }}>
          Masukkan email dan kata sandi Anda
        </p>

        {/* Checkout redirect banner */}
        {fromCheckout && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(22,163,74,0.08)',
            border: '1px solid rgba(22,163,74,0.2)',
            marginBottom: 20,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
              Silakan login untuk melanjutkan donasi Anda
            </p>
          </div>
        )}

        {/* Demo Account Buttons */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#737373', textAlign: 'center', marginBottom: 12 }}>
            Login Cepat (Demo)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <button
              type="button"
              onClick={() => handleDemoLogin("donor")}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '14px 8px',
                borderRadius: '14px',
                border: '1.5px solid #bbf7d0',
                background: '#f0fdf4',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dcfce7'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f0fdf4'}
            >
              <Heart size={20} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>Donatur</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("beneficiary")}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '14px 8px',
                borderRadius: '14px',
                border: '1.5px solid #bfdbfe',
                background: '#eff6ff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
            >
              <Users size={20} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8' }}>Penerima</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("vendor")}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '14px 8px',
                borderRadius: '14px',
                border: '1.5px solid #e9d5ff',
                background: '#faf5ff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3e8ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#faf5ff'}
            >
              <Store size={20} style={{ color: '#9333ea' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#7e22ce' }}>Vendor</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e5e5' }} />
          <span style={{ fontSize: 12, color: '#a3a3a3' }}>atau</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e5e5' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#404040', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid #e5e5e5',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#16a34a'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5e5'}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#404040', display: 'block', marginBottom: 6 }}>
              Kata Sandi
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e5e5',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#16a34a'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5e5'}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a3a3a3',
                  padding: 4,
                }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password Requirements Notes */}
            {password.length > 0 && !passwordValid && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: '#fafafa', borderRadius: 8 }}>
                <p style={{ fontSize: 10, color: '#a3a3a3', marginBottom: 4 }}>
                  Jika lupa password, gunakan:
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: '#737373' }}>Min. 8 karakter</span>
                  <span style={{ fontSize: 10, color: '#737373' }}>• 1 huruf besar</span>
                  <span style={{ fontSize: 10, color: '#737373' }}>• 1 angka</span>
                  <span style={{ fontSize: 10, color: '#737373' }}>• 1 simbol</span>
                </div>
              </div>
            )}
          </div>

          {/* Forgot password */}
          <p style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/lupa-sandi" style={{ 
              fontSize: 13, 
              color: '#16a34a', 
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              Lupa kata sandi?
            </Link>
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email || password.length < 6}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
              marginTop: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Memproses...</span>
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        {/* Google Login */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e5e5' }} />
            <span style={{ fontSize: 12, color: '#a3a3a3' }}>atau lanjutkan dengan</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e5e5' }} />
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: 14,
              fontWeight: 600,
              color: '#262626',
              background: '#fff',
              border: '1.5px solid #d4d4d4',
              cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
              opacity: loading || googleLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 0.2s ease',
            }}
          >
            {googleLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Mengalihkan...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>
          <div style={{ marginTop: 12 }}>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => {
                const Icon = r.icon
                const isSelected = googleRole === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setGoogleRole(r.id)}
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
        </div>

        {/* Register Link */}
        <p style={{ fontSize: 13, textAlign: 'center', color: '#737373', marginTop: 24 }}>
          Belum punya akun?{" "}
          <Link 
            to="/register" 
            style={{ 
              color: '#16a34a', 
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}