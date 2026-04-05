import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { Session } from "@supabase/supabase-js"

type UserRole = "donor" | "beneficiary" | "vendor" | "admin" | "government" | null

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
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: string | null }>
  signInAsDemo: (role: UserRole) => void
  signOut: () => Promise<void>
}

const AUTH_KEY = "nutriguard-auth"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single()
    if (error || !data) return "donor"
    return data.role as UserRole
  } catch {
    return "donor"
  }
}

async function getUserProfile(userId: string): Promise<{ fullName: string }> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single()
    if (error || !data) return { fullName: "User" }
    return { fullName: data.full_name || "User" }
  } catch {
    return { fullName: "User" }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      if (currentSession) {
        Promise.all([
          getUserRole(currentSession.user.id),
          getUserProfile(currentSession.user.id),
        ]).then(([role, profile]) => {
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || "",
            fullName: profile.fullName,
            role,
          })
          setUserRole(role)
        }).catch(() => {
          const email = currentSession.user.email || ""
          const role: UserRole = email.toLowerCase().includes("penerima") || email.toLowerCase().includes("beneficiary")
            ? "beneficiary"
            : "donor"
          setUser({
            id: currentSession.user.id,
            email,
            fullName: email.split("@")[0],
            role,
          })
          setUserRole(role)
        })
      } else {
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
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        Promise.all([
          getUserRole(newSession.user.id),
          getUserProfile(newSession.user.id),
        ]).then(([role, profile]) => {
          setUser({
            id: newSession.user.id,
            email: newSession.user.email || "",
            fullName: profile.fullName,
            role,
          })
          setUserRole(role)
        }).catch(() => {
          const email = newSession.user.email || ""
          const role: UserRole = email.toLowerCase().includes("penerima") || email.toLowerCase().includes("beneficiary")
            ? "beneficiary"
            : "donor"
          setUser({
            id: newSession.user.id,
            email,
            fullName: email.split("@")[0],
            role,
          })
          setUserRole(role)
        })
      } else {
        setUser(null)
        setUserRole(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      if (data.session) {
        setSession(data.session)
        const [role, profile] = await Promise.all([
          getUserRole(data.session.user.id),
          getUserProfile(data.session.user.id),
        ])
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || "",
          fullName: profile.fullName,
          role,
        })
        setUserRole(role)
      }
      return { error: null }
    } catch {
      return { error: "Login gagal. Silakan coba lagi." }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) return { error: error.message }
      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role })
        if (roleError) console.error("Failed to insert user role:", roleError)
        if (data.session) {
          setSession(data.session)
          setUser({
            id: data.user.id,
            email: data.user.email || "",
            fullName,
            role: role as UserRole,
          })
          setUserRole(role as UserRole)
        }
      }
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
    setSession(null)
    localStorage.setItem(AUTH_KEY, JSON.stringify(demoUser))
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setSession(null)
    localStorage.removeItem(AUTH_KEY)
  }

  const value = {
    user,
    userRole,
    loading,
    session,
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
