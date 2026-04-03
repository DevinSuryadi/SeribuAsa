import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type UserRole = "donor" | "beneficiary" | "vendor" | "admin" | null

interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  userRole: UserRole
  loading: boolean
  signIn: (email: string, _password: string) => Promise<{ error: string | null }>
  signUp: (email: string, _password: string, fullName: string, role: string) => Promise<{ error: string | null }>
  signInAsDemo: (role: UserRole) => void
  signOut: () => void
}

const AUTH_KEY = "nutriguard-auth"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser
        setUser(parsed)
        setUserRole(parsed.role)
      } catch {
        localStorage.removeItem(AUTH_KEY)
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, _password: string) => {
    try {
      const role: UserRole = email.toLowerCase().includes("penerima") || email.toLowerCase().includes("beneficiary")
        ? "beneficiary"
        : "donor"

      const authUser: AuthUser = {
        id: role === "beneficiary"
          ? "00000000-0000-0000-0000-000000000002"
          : "00000000-0000-0000-0000-000000000001",
        email,
        fullName: email.split("@")[0],
        role,
      }

      setUser(authUser)
      setUserRole(role)
      localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
      return { error: null }
    } catch {
      return { error: "Login gagal. Silakan coba lagi." }
    }
  }

  const signUp = async (email: string, _password: string, fullName: string, role: string) => {
    try {
      const authUser: AuthUser = {
        id: role === "beneficiary"
          ? "00000000-0000-0000-0000-000000000002"
          : "00000000-0000-0000-0000-000000000001",
        email,
        fullName,
        role: role as UserRole,
      }

      setUser(authUser)
      setUserRole(role as UserRole)
      localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
      return { error: null }
    } catch {
      return { error: "Registrasi gagal. Silakan coba lagi." }
    }
  }

  const signInAsDemo = (role: UserRole) => {
    const demoUsers: Record<string, AuthUser> = {
      donor: {
        id: "00000000-0000-0000-0000-000000000001",
        email: "donor@nutriguard.id",
        fullName: "Donor Demo",
        role: "donor",
      },
      beneficiary: {
        id: "00000000-0000-0000-0000-000000000002",
        email: "penerima@nutriguard.id",
        fullName: "Penerima Demo",
        role: "beneficiary",
      },
      vendor: {
        id: "00000000-0000-0000-0000-000000000003",
        email: "vendor@nutriguard.id",
        fullName: "Vendor Demo",
        role: "vendor",
      },
    }

    const demoUser = demoUsers[role || "donor"]
    setUser(demoUser)
    setUserRole(demoUser.role)
    localStorage.setItem(AUTH_KEY, JSON.stringify(demoUser))
  }

  const signOut = () => {
    setUser(null)
    setUserRole(null)
    localStorage.removeItem(AUTH_KEY)
  }

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signInAsDemo,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
