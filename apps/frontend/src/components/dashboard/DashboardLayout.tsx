import { useState, memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Wallet,
  Users,
  Store,
  Shield,
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Package,
  ClipboardList,
  Activity,
  CreditCard,
  Sparkles,
  ShoppingCart,
  QrCode,
} from "lucide-react";
import roleDonatur from "@/assets/role-donatur.svg";
import rolePenerima from "@/assets/role-penerima.svg";
import roleVendor from "@/assets/role-vendor.svg";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

type NavItem = { label: string; href: string; icon: React.ElementType };

const navByRole: Record<string, NavItem[]> = {
  donor: [
    { label: "Ringkasan", href: "/dashboard/donor", icon: LayoutDashboard },
    { label: "Langganan", href: "/dashboard/langganan", icon: CreditCard },
    { label: "Riwayat Donasi", href: "/dashboard/riwayat", icon: History },
    { label: "Dampak", href: "/dashboard/dampak", icon: TrendingUp },
    { label: "Profil", href: "/dashboard/profile", icon: Settings },
  ],
  beneficiary: [
    { label: "Ringkasan", href: "/dashboard/beneficiary", icon: LayoutDashboard },
    { label: "Katalog Pangan", href: "/dashboard/katalog", icon: Package },
    { label: "Keranjang", href: "/dashboard/cart", icon: ShoppingCart },
    { label: "Dompet & Aktivitas", href: "/dashboard/dompet-nutrisi", icon: Wallet },
    { label: "Survei FIES", href: "/dashboard/survei-fies", icon: ClipboardList },
    { label: "Pemantauan Gizi", href: "/dashboard/pemantauan-gizi", icon: Activity },
    { label: "Rekomendasi AI", href: "/dashboard/rekomendasi-ai", icon: Sparkles },
    { label: "Profil", href: "/dashboard/profile", icon: Settings },
  ],
  vendor: [
    { label: "Ringkasan", href: "/dashboard/vendor", icon: LayoutDashboard },
    { label: "Kelola Produk", href: "/dashboard/kelola-produk", icon: Package },
    { label: "Scan QR Pickup", href: "/dashboard/scan-qr", icon: QrCode },
    { label: "Pencairan", href: "/dashboard/settlement", icon: CreditCard },
    { label: "Profil", href: "/dashboard/profile", icon: Settings },
  ],
  admin: [
    { label: "Dashboard Admin", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Kelola Pengguna", href: "/dashboard/admin/users", icon: Users },
    { label: "Kelola Produk", href: "/dashboard/admin/products", icon: Package },
    { label: "Kelayakan Penerima", href: "/dashboard/admin/beneficiaries", icon: ClipboardList },
    { label: "Kelola Donasi", href: "/dashboard/admin/donations", icon: Heart },
    { label: "Kelola Pesanan", href: "/dashboard/admin/orders", icon: ShoppingCart },
    { label: "Kelola Voucher", href: "/dashboard/admin/vouchers", icon: Wallet },
    { label: "Laporan & Ekspor", href: "/dashboard/admin/reports", icon: TrendingUp },
    { label: "Profil", href: "/dashboard/profile", icon: Settings },
  ],
};

const roleLabel: Record<string, string> = {
  donor: "Donatur",
  beneficiary: "Penerima",
  vendor: "Vendor",
  admin: "Admin",
};

const roleColor: Record<string, string> = {
  donor: "bg-green-600",
  beneficiary: "bg-blue-600",
  vendor: "bg-purple-600",
  admin: "bg-red-600",
};

const RoleImageMap: Record<string, string> = {
  donor: roleDonatur,
  beneficiary: rolePenerima,
  vendor: roleVendor,
};

function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = userRole || "donor";
  const navItems = navByRole[role] || navByRole.donor;
  const displayName =
    (user as any)?.fullName ||
    (user as any)?.full_name ||
    user?.email?.split("@")[0] ||
    "Pengguna";
  const roleImage = RoleImageMap[role];
  const FallbackIcon = Shield;
  const colorClass = roleColor[role] || "bg-gray-600";

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f7faf8]">
      <div className="pointer-events-none fixed -left-[190px] top-[80px] h-[460px] w-[460px] rounded-full bg-[#DCE6D7] opacity-90 blur-[2px]" />
      <div className="pointer-events-none fixed -right-[220px] top-[120px] h-[560px] w-[560px] rounded-full bg-[#DCE6D7] opacity-85 blur-[2px]" />
      <div className="pointer-events-none fixed right-[120px] bottom-[30px] h-[120px] w-[120px] rounded-full bg-[#E9E4D8] opacity-80 blur-[2px]" />

      {/* Sidebar - Desktop */}
      <aside className="relative z-20 hidden h-screen shrink-0 p-4 lg:flex lg:w-[292px] lg:flex-col">
        <div className="flex h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
          <div className="border-b border-slate-100 px-5 py-5">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">
                {roleImage ? (
                  <img
                    src={roleImage}
                    alt={`Role ${roleLabel[role] || "Pengguna"}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FallbackIcon className="h-5 w-5 text-slate-700" />
                )}
              </div>

              <div>
                <span className="block text-lg font-black tracking-tight text-slate-950">
                  SeribuAsa
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Dashboard {roleLabel[role] || "Pengguna"}
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const active = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all duration-300",
                    active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-700/20"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>

                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="rounded-[1.5rem] border border-slate-100 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-slate-900">
                    {displayName}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {roleLabel[role]}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                  className="h-9 w-9 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          <aside className="absolute bottom-0 left-0 top-0 flex w-[82%] max-w-[320px] flex-col overflow-hidden rounded-r-[2rem] border-r border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex h-20 items-center justify-between border-b border-slate-100 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">
                  {roleImage ? (
                    <img
                      src={roleImage}
                      alt={`Role ${roleLabel[role] || "Pengguna"}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FallbackIcon className="h-4 w-4 text-slate-700" />
                  )}
                </div>

                <div>
                  <span className="block font-black text-slate-950">
                    SeribuAsa
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Dashboard {roleLabel[role] || "Pengguna"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
              {navItems.map((item) => {
                const active = location.pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all duration-300",
                      active
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-700/20"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>

                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-100 p-4">
              <div className="rounded-[1.5rem] border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-slate-900">
                      {displayName}
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      {roleLabel[role]}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      signOut();
                      navigate("/");
                    }}
                    className="h-9 w-9 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden p-3 lg:p-4 lg:pl-0">
        {/* Page Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
          <div className="mx-auto w-full max-w-[1440px] space-y-6 px-1 pb-8">
            {/* Top Bar */}
            <header className="flex h-16 items-center justify-between rounded-[1.5rem] border border-slate-200/70 bg-white/85 px-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl lg:px-5">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl p-2 text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Buka menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 lg:hidden">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                    {roleImage ? (
                      <img
                        src={roleImage}
                        alt={`Role ${roleLabel[role] || "Pengguna"}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FallbackIcon className="h-4 w-4 text-slate-700" />
                    )}
                  </div>

                  <span className="font-black text-slate-950">SeribuAsa</span>
                </div>

                <div className="hidden lg:block">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    {roleLabel[role] || "Dashboard"}
                  </p>
                  <p className="text-sm font-semibold text-slate-500">
                    Selamat datang kembali, {displayName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-xs font-black text-emerald-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="max-w-[160px] truncate text-sm font-bold text-slate-700">
                    {displayName}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 lg:hidden"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <div className="px-1 pt-1">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default memo(DashboardLayout);