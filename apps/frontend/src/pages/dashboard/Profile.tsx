import {
  useState,
  useEffect,
  useMemo,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit,
  LogOut,
  Lock,
  Loader2,
  Landmark,
  Store,
  Upload,
  Star,
} from "lucide-react";
import { uploadImage } from "@/services/upload";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import type { UserRole } from "@/types";

interface EditFormData {
  fullName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
}

interface StoreFormData {
  storeName: string;
  storeAddress: string;
  storeImageUrl: string;
  operatingHours: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface BankFormData {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
}

interface InfoCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: "green" | "purple" | "emerald" | "blue";
  className?: string;
}

interface SectionCardProps {
  title: string;
  description?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  accent?: "green" | "purple" | "emerald" | "blue" | "red";
}

const ROLE_LABELS: Record<UserRole | string, string> = {
  donor: "Donatur",
  corporate_donor: "Donatur Korporat",
  beneficiary: "Penerima Manfaat",
  vendor: "Vendor",
  admin: "Admin",
  government: "Pemerintah",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Laki-laki",
  female: "Perempuan",
};

const ACCENT_STYLES = {
  green: {
    icon: "bg-green-50 text-green-700",
    hover: "hover:border-green-200 hover:bg-green-50/50",
    label: "group-hover:text-green-700",
  },
  purple: {
    icon: "bg-purple-50 text-purple-700",
    hover: "hover:border-purple-200 hover:bg-purple-50/50",
    label: "group-hover:text-purple-700",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700",
    hover: "hover:border-emerald-200 hover:bg-emerald-50/50",
    label: "group-hover:text-emerald-700",
  },
  blue: {
    icon: "bg-blue-50 text-blue-700",
    hover: "hover:border-blue-200 hover:bg-blue-50/50",
    label: "group-hover:text-blue-700",
  },
};

const SECTION_ACCENT_STYLES = {
  green: "bg-green-50 text-green-700",
  purple: "bg-purple-50 text-purple-700",
  emerald: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-red-50 text-red-700",
};

const isEmptyDisplay = (value: ReactNode) =>
  value === "Belum diatur" ||
  value === "" ||
  value === null ||
  value === undefined;

const DisplayValue = ({ value }: { value: ReactNode }) => {
  if (isEmptyDisplay(value)) {
    return (
      <span className="text-sm font-medium italic text-slate-400">
        Belum diatur
      </span>
    );
  }

  return <>{value}</>;
};

const InfoCard = ({
  label,
  value,
  icon,
  accent = "green",
  className = "",
}: InfoCardProps) => {
  const style = ACCENT_STYLES[accent];

  return (
    <div
      className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${style.hover} ${className}`}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${style.icon}`}
      >
        {icon}
      </div>

      <p
        className={`text-xs font-bold uppercase tracking-[0.16em] text-slate-400 transition-colors ${style.label}`}
      >
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-bold leading-relaxed text-slate-900 sm:text-base">
        <DisplayValue value={value} />
      </p>
    </div>
  );
};

const SectionCard = ({
  title,
  description,
  icon,
  action,
  children,
  accent = "green",
}: SectionCardProps) => (
  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${SECTION_ACCENT_STYLES[accent]}`}
        >
          {icon}
        </div>

        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
            {title}
          </h3>

          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>

    {children}
  </section>
);

const Profile = () => {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const {
    data: profileData,
    loading: profileLoading,
    isSubmitting,
    updateProfile,
  } = useProfile();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [isUploadingStoreImage, setIsUploadingStoreImage] = useState(false);

  const [editFormData, setEditFormData] = useState<EditFormData>({
    fullName: user?.fullName || "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
  });

  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [bankFormData, setBankFormData] = useState<BankFormData>({
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolder: "",
  });

  const [storeFormData, setStoreFormData] = useState<StoreFormData>({
    storeName: "",
    storeAddress: "",
    storeImageUrl: "",
    operatingHours: "",
  });

  useEffect(() => {
    if (profileData) {
      setEditFormData({
        fullName: profileData.full_name || user?.fullName || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        dateOfBirth: profileData.date_of_birth || "",
        gender: profileData.gender || "",
      });

      setBankFormData({
        bankName: profileData.bank_name || "",
        bankAccountNumber: profileData.bank_account_number || "",
        bankAccountHolder: profileData.bank_account_holder || "",
      });

      setStoreFormData({
        storeName: profileData.store_name || "",
        storeAddress: profileData.store_address || "",
        storeImageUrl: profileData.store_image_url || "",
        operatingHours: profileData.operating_hours || "",
      });
    }
  }, [profileData, user?.fullName]);

  const resolvedRole = profileData?.role || userRole;
  const resolvedName = profileData?.full_name || user?.fullName || "Pengguna";

  const displayValues = useMemo(
    () => ({
      phone: profileLoading ? "Memuat..." : profileData?.phone || "Belum diatur",
      address: profileLoading
        ? "Memuat..."
        : profileData?.address || "Belum diatur",
      dateOfBirth: profileLoading
        ? "Memuat..."
        : profileData?.date_of_birth
          ? formatDate(profileData.date_of_birth)
          : "Belum diatur",
      gender: profileLoading
        ? "Memuat..."
        : profileData?.gender
          ? GENDER_LABELS[profileData.gender]
          : "Belum diatur",
      bankName: profileLoading
        ? "Memuat..."
        : profileData?.bank_name || "Belum diatur",
      bankAccountNumber: profileLoading
        ? "Memuat..."
        : profileData?.bank_account_number
          ? `****${profileData.bank_account_number.slice(-4)}`
          : "Belum diatur",
      bankAccountHolder: profileLoading
        ? "Memuat..."
        : profileData?.bank_account_holder || "Belum diatur",
      storeName: profileLoading
        ? "Memuat..."
        : profileData?.store_name || "Belum diatur",
      storeAddress: profileLoading
        ? "Memuat..."
        : profileData?.store_address || "Belum diatur",
      storeImageUrl: profileLoading ? "" : profileData?.store_image_url || "",
      operatingHours: profileLoading
        ? "Memuat..."
        : profileData?.operating_hours || "Belum diatur",
      rating:
        profileData?.rating !== undefined && profileData?.rating !== null
          ? Number(profileData.rating)
          : null,
      totalTransactions:
        profileData?.total_transactions !== undefined &&
        profileData?.total_transactions !== null
          ? Number(profileData.total_transactions)
          : 0,
      role: ROLE_LABELS[resolvedRole || ""] || "-",
    }),
    [profileLoading, profileData, resolvedRole]
  );

  const completedProfileFields = useMemo(() => {
    return [
      profileData?.phone,
      profileData?.address,
      profileData?.date_of_birth,
      profileData?.gender,
    ].filter(Boolean).length;
  }, [profileData]);

  const handleSignOut = () => {
    signOut();
    toast.success("Berhasil keluar");
    navigate("/");
  };

  const validateEditForm = (): boolean => {
    if (!editFormData.fullName.trim()) {
      toast.error("Nama tidak boleh kosong");
      return false;
    }

    if (editFormData.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s]{8,20}$/;
      if (!phoneRegex.test(editFormData.phone.trim())) {
        toast.error("Nomor HP tidak valid");
        return false;
      }
    }

    return true;
  };

  const handleEditProfile = async () => {
    if (!validateEditForm()) return;

    const success = await updateProfile({
      full_name: editFormData.fullName.trim(),
      phone: editFormData.phone.trim() || null,
      address: editFormData.address.trim() || null,
      date_of_birth: editFormData.dateOfBirth || null,
      gender: (editFormData.gender || null) as "male" | "female" | null,
    });

    if (success) {
      setShowEditModal(false);
    }
  };

  const validatePasswordForm = (): boolean => {
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword) {
      toast.error("Semua field harus diisi");
      return false;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error("Kata sandi baru tidak cocok");
      return false;
    }

    if (passwordFormData.newPassword.length < 8) {
      toast.error("Kata sandi minimal 8 karakter");
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    toast.info("Fitur ubah kata sandi akan segera tersedia");
    setShowPasswordModal(false);
    setPasswordFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const validateBankForm = (): boolean => {
    if (!bankFormData.bankName.trim()) {
      toast.error("Nama bank tidak boleh kosong");
      return false;
    }

    if (!bankFormData.bankAccountNumber.trim()) {
      toast.error("Nomor rekening tidak boleh kosong");
      return false;
    }

    if (!/^[0-9\s-]{6,50}$/.test(bankFormData.bankAccountNumber.trim())) {
      toast.error("Nomor rekening tidak valid");
      return false;
    }

    if (!bankFormData.bankAccountHolder.trim()) {
      toast.error("Nama pemilik rekening tidak boleh kosong");
      return false;
    }

    return true;
  };

  const handleSaveBankAccount = async () => {
    if (!validateBankForm()) return;

    const success = await updateProfile({
      full_name: profileData?.full_name || user?.fullName || resolvedName,
      phone: profileData?.phone || null,
      address: profileData?.address || null,
      date_of_birth: profileData?.date_of_birth || null,
      gender: profileData?.gender || null,
      bank_name: bankFormData.bankName.trim(),
      bank_account_number: bankFormData.bankAccountNumber.trim(),
      bank_account_holder: bankFormData.bankAccountHolder.trim(),
    });

    if (success) {
      setShowBankModal(false);
    }
  };

  const handleStoreImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingStoreImage(true);

    try {
      const { url, error } = await uploadImage(file);

      if (error) {
        toast.error(error);
      } else if (url) {
        setStoreFormData((prev) => ({ ...prev, storeImageUrl: url }));
        toast.success("Foto toko berhasil diunggah");
      }
    } catch {
      toast.error("Gagal mengunggah foto toko");
    } finally {
      setIsUploadingStoreImage(false);
    }
  };

  const validateStoreForm = (): boolean => {
    if (!storeFormData.storeName.trim()) {
      toast.error("Nama toko tidak boleh kosong");
      return false;
    }

    if (!storeFormData.storeAddress.trim()) {
      toast.error("Alamat toko tidak boleh kosong");
      return false;
    }

    return true;
  };

  const handleSaveStoreInfo = async () => {
    if (!validateStoreForm()) return;

    const success = await updateProfile({
      full_name: profileData?.full_name || user?.fullName || resolvedName,
      phone: profileData?.phone || null,
      address: profileData?.address || null,
      date_of_birth: profileData?.date_of_birth || null,
      gender: profileData?.gender || null,
      store_name: storeFormData.storeName.trim(),
      store_address: storeFormData.storeAddress.trim(),
      store_image_url: storeFormData.storeImageUrl.trim() || null,
      operating_hours: storeFormData.operatingHours.trim() || null,
    });

    if (success) {
      setShowStoreModal(false);
    }
  };

  if (profileLoading) {
    return (
      <DashboardLayout
        title="Profil Saya"
        subtitle="Kelola informasi pribadi dan pengaturan akun Anda."
      >
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
            <Loader2 className="mx-auto mb-4 h-11 w-11 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold text-slate-700">
              Memuat profil...
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Mohon tunggu sebentar.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Profil Saya"
      subtitle="Kelola informasi pribadi dan pengaturan akun Anda."
    >
      <div className="w-full space-y-6 pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-sm sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.7rem] border border-white bg-white shadow-lg sm:mx-0 sm:h-28 sm:w-28">
                <div className="flex h-[82%] w-[82%] items-center justify-center overflow-hidden rounded-[1.35rem] bg-emerald-50 text-emerald-600">
                  <User size={46} strokeWidth={1.8} />
                </div>
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                    {displayValues.role}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white/80 px-3 py-1 text-xs font-bold text-slate-600"
                  >
                    {completedProfileFields}/4 Data Terisi
                  </Badge>
                </div>

                <h2 className="break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                  {resolvedName}
                </h2>

                <div className="mt-3 flex min-w-0 items-center justify-center gap-2 text-sm font-medium text-slate-500 sm:justify-start">
                  <Mail size={16} className="shrink-0 text-emerald-600" />
                  <span className="min-w-0 break-all">{user?.email || "-"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[300px]">
              <Button
                onClick={() => setShowEditModal(true)}
                className="h-11 rounded-2xl bg-emerald-600 font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Edit size={17} className="mr-2" />
                Edit Profil
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
                className="h-11 rounded-2xl border-slate-200 bg-white/80 font-bold text-slate-700 hover:bg-white"
              >
                <Lock size={17} className="mr-2" />
                Keamanan
              </Button>
            </div>
          </div>

          <div className="relative z-10 mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Phone size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Kontak
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {displayValues.phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <User size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Role Akun
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {displayValues.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Edit size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Status Profil
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {completedProfileFields === 4 ? "Lengkap" : "Perlu dilengkapi"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="umum" className="w-full">
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:w-auto">
            <TabsTrigger
              value="umum"
              className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
            >
              Umum
            </TabsTrigger>

            {resolvedRole === "vendor" && (
              <>
                <TabsTrigger
                  value="toko"
                  className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
                >
                  Informasi Toko
                </TabsTrigger>

                <TabsTrigger
                  value="keuangan"
                  className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
                >
                  Keuangan
                </TabsTrigger>
              </>
            )}

            <TabsTrigger
              value="keamanan"
              className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              Keamanan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="umum" className="space-y-6">
            <SectionCard
              title="Informasi Pribadi"
              description="Data dasar akun yang digunakan untuk identitas dan kebutuhan transaksi di SeribuAsa."
              icon={<User size={21} />}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="h-9 rounded-xl border-slate-200 font-bold text-slate-700"
                >
                  <Edit size={14} className="mr-2" />
                  Edit
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <InfoCard
                  label="Nomor HP"
                  value={displayValues.phone}
                  icon={<Phone size={20} />}
                />

                <InfoCard
                  label="Tanggal Lahir"
                  value={displayValues.dateOfBirth}
                  icon={<Calendar size={20} />}
                />

                <InfoCard
                  label="Jenis Kelamin"
                  value={displayValues.gender}
                  icon={<User size={20} />}
                  className="sm:col-span-2 xl:col-span-1"
                />
              </div>
            </SectionCard>

            {resolvedRole !== "vendor" && (
              <SectionCard
                title="Alamat Terdaftar"
                description="Alamat utama yang tersimpan di akun Anda."
                icon={<MapPin size={21} />}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="h-9 rounded-xl border-slate-200 font-bold text-slate-700"
                  >
                    <Edit size={14} className="mr-2" />
                    Edit
                  </Button>
                }
              >
                <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6">
                  <MapPin className="pointer-events-none absolute -bottom-8 -right-6 h-32 w-32 text-emerald-100" />

                  <div className="relative z-10">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <p className="text-base font-black text-slate-950">
                        {resolvedName}
                      </p>

                      <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                        Alamat Utama
                      </span>
                    </div>

                    {displayValues.address !== "Belum diatur" ? (
                      <p className="max-w-3xl text-sm font-medium leading-7 text-slate-700 sm:text-base">
                        {displayValues.address}
                      </p>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-4">
                        <p className="text-sm font-semibold text-slate-500">
                          Alamat belum diatur.
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Lengkapi alamat agar data profil Anda lebih jelas.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            )}
          </TabsContent>

          {resolvedRole === "vendor" && (
            <>
              <TabsContent value="toko" className="space-y-6">
                <SectionCard
                  title="Informasi Toko"
                  description="Data toko vendor yang akan digunakan untuk pengelolaan produk dan transaksi."
                  icon={<Store size={21} />}
                  accent="purple"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStoreModal(true)}
                      className="h-9 rounded-xl border-purple-200 font-bold text-purple-700 hover:bg-purple-50"
                    >
                      <Edit size={14} className="mr-2" />
                      Edit Toko
                    </Button>
                  }
                >
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                    <div className="overflow-hidden rounded-[1.6rem] border border-purple-100 bg-purple-50/60">
                      {displayValues.storeImageUrl ? (
                        <div className="relative h-72 overflow-hidden">
                          <img
                            src={displayValues.storeImageUrl}
                            alt="Foto toko"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6 pt-16">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                              Nama Toko
                            </p>
                            <h4 className="mt-1 text-2xl font-black text-white">
                              <DisplayValue value={displayValues.storeName} />
                            </h4>
                          </div>

                          {displayValues.rating !== null && (
                            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-2xl border border-white/40 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
                              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                              <span className="font-black text-slate-900">
                                {displayValues.rating.toFixed(1)}
                              </span>
                              <span className="text-sm font-medium text-slate-500">
                                ({displayValues.totalTransactions})
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-purple-600 shadow-sm">
                            <Store size={30} />
                          </div>

                          <p className="text-lg font-black text-purple-950">
                            <DisplayValue value={displayValues.storeName} />
                          </p>

                          <p className="mt-2 max-w-md text-sm leading-relaxed text-purple-700/70">
                            Foto toko belum tersedia. Tambahkan foto agar profil toko
                            terlihat lebih jelas.
                          </p>

                          {displayValues.rating !== null && (
                            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-2">
                              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                              <span className="font-black text-amber-900">
                                {displayValues.rating.toFixed(1)}
                              </span>
                              <span className="text-sm font-medium text-amber-700/70">
                                ({displayValues.totalTransactions})
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <InfoCard
                        label="Jam Operasional"
                        value={displayValues.operatingHours}
                        icon={<Calendar size={20} />}
                        accent="purple"
                      />

                      <InfoCard
                        label="Alamat Toko"
                        value={displayValues.storeAddress}
                        icon={<MapPin size={20} />}
                        accent="purple"
                      />

                      <Button
                        onClick={() => setShowStoreModal(true)}
                        className="h-12 w-full rounded-2xl bg-purple-600 font-bold text-white hover:bg-purple-700"
                      >
                        <Store size={17} className="mr-2" />
                        Lengkapi Informasi Toko
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              </TabsContent>

              <TabsContent value="keuangan" className="space-y-6">
                <SectionCard
                  title="Rekening Pencairan"
                  description="Rekening ini digunakan untuk proses pencairan saldo vendor."
                  icon={<Landmark size={21} />}
                  accent="emerald"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBankModal(true)}
                      className="h-9 rounded-xl border-emerald-200 font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      <Edit size={14} className="mr-2" />
                      Edit Rekening
                    </Button>
                  }
                >
                  <div className="relative overflow-hidden rounded-[1.6rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 sm:p-6">
                    <Landmark className="pointer-events-none absolute -bottom-10 -right-8 h-36 w-36 text-emerald-100" />

                    <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                          Bank
                        </p>
                        <p className="mt-2 break-words text-base font-black text-emerald-950">
                          <DisplayValue value={displayValues.bankName} />
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                          Pemilik Rekening
                        </p>
                        <p className="mt-2 break-words text-base font-black text-emerald-950">
                          <DisplayValue value={displayValues.bankAccountHolder} />
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                          Nomor Rekening
                        </p>
                        <p className="mt-2 break-words font-mono text-base font-black tracking-wider text-emerald-950">
                          <DisplayValue value={displayValues.bankAccountNumber} />
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowBankModal(true)}
                      className="relative z-10 mt-5 h-12 rounded-2xl bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-700"
                    >
                      <Landmark size={17} className="mr-2" />
                      {profileData?.bank_account_number
                        ? "Ubah Rekening"
                        : "Tambahkan Rekening"}
                    </Button>
                  </div>
                </SectionCard>
              </TabsContent>
            </>
          )}

          <TabsContent value="keamanan" className="space-y-6">
            <SectionCard
              title="Keamanan Akun"
              description="Kelola kata sandi akun Anda dari halaman ini."
              icon={<Lock size={21} />}
              accent="blue"
            >
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50 active:scale-[0.98] lg:max-w-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Lock size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Ubah Kata Sandi
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      Perbarui password akun.
                    </p>
                  </div>
                </div>
              </button>
            </SectionCard>
          </TabsContent>
        </Tabs>

        <section className="rounded-[1.75rem] border border-red-100 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <LogOut size={21} />
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight text-red-700 sm:text-xl">
                  Keluar dari Akun
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Akhiri sesi akun pada perangkat ini.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="h-11 rounded-2xl border-red-200 bg-red-50 px-6 font-bold text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <LogOut size={17} className="mr-2" />
              Keluar
            </Button>
          </div>
        </section>

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="w-full rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profil</DialogTitle>
              <DialogDescription>Perbarui informasi pribadi Anda.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="fullName"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Nama Lengkap
                </Label>
                <Input
                  id="fullName"
                  value={editFormData.fullName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, fullName: e.target.value })
                  }
                  className="mt-1 rounded-xl"
                  placeholder="Nama lengkap Anda"
                />
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Nomor HP
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08xx xxxx xxxx"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label
                  htmlFor="address"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Alamat
                </Label>
                <textarea
                  id="address"
                  value={editFormData.address}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, address: e.target.value })
                  }
                  className="mt-1 min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Masukkan alamat"
                />
              </div>

              <div>
                <Label
                  htmlFor="dob"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Tanggal Lahir
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label
                  htmlFor="gender"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Jenis Kelamin
                </Label>
                <select
                  id="gender"
                  value={editFormData.gender}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, gender: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Batal
              </Button>
              <Button
                onClick={handleEditProfile}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
          <DialogContent className="w-full rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rekening Pencairan</DialogTitle>
              <DialogDescription>
                Data ini digunakan untuk menarik saldo vendor ke rekening bank
                Anda.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="bankName"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Nama Bank
                </Label>
                <Input
                  id="bankName"
                  value={bankFormData.bankName}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, bankName: e.target.value })
                  }
                  className="mt-1 rounded-xl"
                  placeholder="Contoh: BCA, BRI, Mandiri"
                />
              </div>

              <div>
                <Label
                  htmlFor="bankAccountNumber"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Nomor Rekening
                </Label>
                <Input
                  id="bankAccountNumber"
                  inputMode="numeric"
                  value={bankFormData.bankAccountNumber}
                  onChange={(e) =>
                    setBankFormData({
                      ...bankFormData,
                      bankAccountNumber: e.target.value,
                    })
                  }
                  className="mt-1 rounded-xl"
                  placeholder="Nomor rekening"
                />
              </div>

              <div>
                <Label
                  htmlFor="bankAccountHolder"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Nama Pemilik Rekening
                </Label>
                <Input
                  id="bankAccountHolder"
                  value={bankFormData.bankAccountHolder}
                  onChange={(e) =>
                    setBankFormData({
                      ...bankFormData,
                      bankAccountHolder: e.target.value,
                    })
                  }
                  className="mt-1 rounded-xl"
                  placeholder="Sesuai nama di rekening"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowBankModal(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSaveBankAccount}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Rekening"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="w-full rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ubah Kata Sandi</DialogTitle>
              <DialogDescription>Perbarui kata sandi akun Anda.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="currentPassword"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Kata Sandi Saat Ini
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={(e) =>
                    setPasswordFormData({
                      ...passwordFormData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label
                  htmlFor="newPassword"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Kata Sandi Baru
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={passwordFormData.newPassword}
                  onChange={(e) =>
                    setPasswordFormData({
                      ...passwordFormData,
                      newPassword: e.target.value,
                    })
                  }
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Konfirmasi Kata Sandi
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) =>
                    setPasswordFormData({
                      ...passwordFormData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
              >
                Batal
              </Button>
              <Button onClick={handleChangePassword} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengubah...
                  </>
                ) : (
                  "Ubah Kata Sandi"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showStoreModal} onOpenChange={setShowStoreModal}>
          <DialogContent className="w-full rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Informasi Toko</DialogTitle>
              <DialogDescription>
                Data toko Anda yang akan ditampilkan ke pelanggan.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto px-1">
              <div>
                <Label className="mb-2 block text-xs font-bold uppercase tracking-wide">
                  Foto Toko
                </Label>

                <div className="relative mt-1 flex w-full flex-col items-center justify-center gap-3 sm:items-start">
                  {storeFormData.storeImageUrl ? (
                    <div className="group relative h-36 w-full overflow-hidden rounded-2xl border border-slate-200 sm:w-40">
                      <img
                        src={storeFormData.storeImageUrl}
                        alt="Store preview"
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Label
                          htmlFor="storeImageUpload"
                          className="cursor-pointer text-xs font-bold text-white hover:underline"
                        >
                          Ganti Foto
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <Label
                      htmlFor="storeImageUpload"
                      className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100 sm:w-40"
                    >
                      <Upload className="h-6 w-6 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">
                        Unggah Foto
                      </span>
                    </Label>
                  )}

                  <input
                    id="storeImageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleStoreImageUpload}
                    className="hidden"
                    disabled={isUploadingStoreImage}
                  />

                  {isUploadingStoreImage && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Sedang mengunggah...
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="storeName"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Nama Toko
                </Label>
                <Input
                  id="storeName"
                  value={storeFormData.storeName}
                  onChange={(e) =>
                    setStoreFormData({
                      ...storeFormData,
                      storeName: e.target.value,
                    })
                  }
                  className="mt-1 rounded-xl"
                  placeholder="Contoh: Toko Sehat Berkah"
                />
              </div>

              <div>
                <Label
                  htmlFor="operatingHours"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Jam Operasional
                </Label>
                <Input
                  id="operatingHours"
                  value={storeFormData.operatingHours}
                  onChange={(e) =>
                    setStoreFormData({
                      ...storeFormData,
                      operatingHours: e.target.value,
                    })
                  }
                  className="mt-1 rounded-xl"
                  placeholder="Contoh: Setiap Hari: 08.00 - 20.00"
                />
              </div>

              <div>
                <Label
                  htmlFor="storeAddress"
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  Alamat Toko
                </Label>
                <textarea
                  id="storeAddress"
                  value={storeFormData.storeAddress}
                  onChange={(e) =>
                    setStoreFormData({
                      ...storeFormData,
                      storeAddress: e.target.value,
                    })
                  }
                  className="mt-1 min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  placeholder="Detail alamat toko Anda"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowStoreModal(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSaveStoreInfo}
                disabled={isSubmitting || isUploadingStoreImage}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Informasi Toko"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Profile;