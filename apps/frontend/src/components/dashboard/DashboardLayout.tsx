import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Heart,
  Wallet,
  Store,
  Shield,
  LayoutDashboard,
  History,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Package,

} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

const donorNavItems = [
  { icon: LayoutDashboard, label: "Ringkasan", href: "/dashboard/donor" },
  { icon: History, label: "Riwayat Donasi", href: "/dashboard/riwayat" },
  { icon: TrendingUp, label: "Dampak", href: "/dashboard/dampak" },
  { icon: Settings, label: "Profil", href: "/dashboard/profile" },
]

const beneficiaryNavItems = [
  { icon: LayoutDashboard, label: "Ringkasan", href: "/dashboard/beneficiary" },
  { icon: Package, label: "Katalog Pangan", href: "/dashboard/katalog" },
  { icon: Wallet, label: "Penukaran Voucher", href: "/dashboard/penukaran" },
  { icon: Settings, label: "Profil", href: "/dashboard/profile" },
]

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, userRole, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = userRole === "donor" ? donorNavItems : beneficiaryNavItems

  const roleConfig = {
    donor: { icon: Heart, label: "Donatur", color: "bg-green-600" },
    beneficiary: { icon: Wallet, label: "Penerima", color: "bg-blue-600" },
    vendor: { icon: Store, label: "Vendor", color: "bg-purple-600" },
    admin: { icon: Shield, label: "Admin", color: "bg-red-600" },
  }

  const config = roleConfig[userRole as keyof typeof roleConfig] || roleConfig.donor
  const RoleIcon = config.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.color)}>
              <RoleIcon className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">SeribuAsa</h1>
              <p className="text-xs text-gray-500">{config.label}</p>
            </div>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <Separator />

          {/* User info */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user?.email}</p>
                <p className="truncate text-xs text-gray-500">{config.label}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                signOut()
                navigate("/")
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b bg-white px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
