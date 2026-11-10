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
import { Loader2, Star, Upload } from "lucide-react";
import { uploadImage } from "@/services/upload";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import type { UserRole } from "@/types";
import RegionFields from "@/components/forms/RegionFields";

interface EditFormData {
  fullName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  provinceCode: string;
  regencyCode: string;
}

interface StoreFormData {
  storeName: string;
  storeAddress: string;
  storeImageUrl: string;
  operatingHours: string;
  provinceCode: string;
  regencyCode: string;
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
  className?: string;
}

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

const ROLE_LABELS: Record<UserRole | string, string> = {
  health_facility: "Fasilitas Kesehatan",
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

const shadowClass =
  "shadow-[0_1px_2px_rgba(16,32,26,0.04),0_10px_24px_-14px_rgba(16,32,26,0.16)]";
const sectionClass = `rounded-2xl bg-white p-6 ring-1 ring-black/[0.06] ${shadowClass}`;
const tileClass = "rounded-xl bg-[#F4F7F5] p-4";
const labelClass = "text-[13px] font-medium text-slate-500";
const valueClass = "mt-1 break-words text-[15px] font-semibold text-slate-900";
const primaryButtonClass = "rounded-full bg-[#0B6B4F] px-5 font-bold text-white hover:bg-[#095A43]";
const secondaryButtonClass = "rounded-full border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50";
const fieldLabelClass = "text-[13px] font-semibold text-slate-700";
const fieldClass = "mt-1.5 h-11 rounded-xl";
const textareaClass =
  "mt-1.5 min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-[#0B6B4F] focus:ring-2 focus:ring-[#0B6B4F]/15";
const selectClass =
  "mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-[#0B6B4F] focus:ring-2 focus:ring-[#0B6B4F]/15";
const tabClass =
  "rounded-full px-4 py-1.5 text-[13px] font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.12)]";

const isEmptyDisplay = (value: ReactNode) =>
  value === "Belum diatur" ||
  value === "" ||
  value === null ||
  value === undefined;

const DisplayValue = ({ value }: { value: ReactNode }) => {
  if (isEmptyDisplay(value)) {
    return <span className="font-medium text-slate-400">Belum diatur</span>;
  }

  return <>{value}</>;
};

const InfoCard = ({ label, value, className = "" }: InfoCardProps) => (
  <div className={`${tileClass} ${className}`}>
    <p className={labelClass}>{label}</p>
    <p className={valueClass}>
      <DisplayValue value={value} />
    </p>
  </div>
);

const SectionCard = ({ title, description, action, children }: SectionCardProps) => (
  <section className={sectionClass}>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>

        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
        )}
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
    error: profileError,
    isSubmitting,
    refetch,
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
    provinceCode: "",
    regencyCode: "",
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
    provinceCode: "",
    regencyCode: "",
  });

  useEffect(() => {
    if (profileData) {
      setEditFormData({
        fullName: profileData.full_name || user?.fullName || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        dateOfBirth: profileData.date_of_birth || "",
        gender: profileData.gender || "",
        provinceCode: profileData.province_code || "",
        regencyCode: profileData.regency_code || "",
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
        provinceCode: profileData.province_code || "",
        regencyCode: profileData.regency_code || "",
      });
    }
  }, [profileData, user?.fullName]);

  const resolvedRole = profileData?.role || userRole;
  const isOrganization = resolvedRole === "health_facility" || resolvedRole === "vendor";
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
      region: [profileData?.regency_name, profileData?.province_name].filter(Boolean).join(", ") || "Belum diatur",
    }),
    [profileLoading, profileData, resolvedRole]
  );

  const completedProfileFields = useMemo(() => {
    const fields = isOrganization
      ? [
          profileData?.phone,
          resolvedRole === "vendor" ? profileData?.store_address : profileData?.address,
          profileData?.province_code,
          profileData?.regency_code,
        ]
      : [profileData?.phone, profileData?.address, profileData?.date_of_birth, profileData?.gender];
    return fields.filter(Boolean).length;
  }, [profileData, isOrganization, resolvedRole]);

  const handleSignOut = () => {
    signOut();
    toast.success("Berhasil keluar");
    navigate("/");
  };

  const validateEditForm = (): boolean => {
    if (resolvedRole === "health_facility" && (!editFormData.provinceCode || !editFormData.regencyCode)) {
      toast.error("Pilih provinsi dan kota/kabupaten");
      return false;
    }
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
      ...(!isOrganization ? {
        date_of_birth: editFormData.dateOfBirth || null,
        gender: (editFormData.gender || null) as "male" | "female" | null,
      } : {}),
      ...(resolvedRole === "health_facility" ? {
        province_code: editFormData.provinceCode,
        regency_code: editFormData.regencyCode,
      } : {}),
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
    if (!storeFormData.provinceCode || !storeFormData.regencyCode) {
      toast.error("Pilih provinsi dan kota/kabupaten");
      return false;
    }
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
      store_name: storeFormData.storeName.trim(),
      store_address: storeFormData.storeAddress.trim(),
      store_image_url: storeFormData.storeImageUrl.trim() || null,
      operating_hours: storeFormData.operatingHours.trim() || null,
      province_code: storeFormData.provinceCode,
      regency_code: storeFormData.regencyCode,
    });

    if (success) {
      setShowStoreModal(false);
    }
  };

  if (profileLoading || profileError) {
    return (
      <DashboardLayout
        title="Profil Saya"
        subtitle="Kelola informasi pribadi dan pengaturan akun Anda."
      >
        <div className="flex min-h-[420px] items-center justify-center">
          <div className={`${sectionClass} px-10 text-center`}>
            {profileLoading && <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#0B6B4F]" />}
            <p className="text-sm font-semibold text-slate-700">
              {profileError || "Memuat profil..."}
            </p>
            {profileError ? (
              <Button variant="outline" onClick={() => void refetch()} className={`mt-4 ${secondaryButtonClass}`}>
                Coba lagi
              </Button>
            ) : (
              <p className="mt-1 text-[13px] text-slate-500">Mohon tunggu sebentar.</p>
            )}
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
        <section className={`rounded-2xl bg-[#E6F4EC] p-6 ${shadowClass}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0B6B4F] text-2xl font-bold text-white">
                {resolvedName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h2 className="break-words text-2xl font-bold tracking-tight text-slate-900">
                  {resolvedName}
                </h2>
                <p className="mt-0.5 break-all text-sm text-slate-600">{user?.email || "-"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border-0 bg-[#0B6B4F] px-3 py-0.5 text-xs font-semibold text-white hover:bg-[#0B6B4F]">
                    {displayValues.role}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-0 bg-white px-3 py-0.5 text-xs font-semibold text-slate-700">
                    {completedProfileFields}/4 Data Terisi
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowEditModal(true)} className={primaryButtonClass}>
                Edit Profil
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordModal(true)} className={secondaryButtonClass}>
                Keamanan
              </Button>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { label: "Kontak", value: displayValues.phone },
              { label: "Role Akun", value: displayValues.role },
              { label: "Status Profil", value: completedProfileFields === 4 ? "Lengkap" : "Perlu dilengkapi" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl bg-white p-4 ${shadowClass}`}>
                <dt className={labelClass}>{item.label}</dt>
                <dd className={`${valueClass} truncate`}>
                  <DisplayValue value={item.value} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <Tabs defaultValue="umum" className="w-full space-y-6">
          <TabsList className="flex h-auto w-fit max-w-full justify-start gap-0 overflow-x-auto rounded-full bg-[#ececef] p-1 [scrollbar-width:none]">
            <TabsTrigger value="umum" className={tabClass}>Umum</TabsTrigger>

            {resolvedRole === "vendor" && (
              <>
                <TabsTrigger value="toko" className={tabClass}>Informasi Toko</TabsTrigger>
                <TabsTrigger value="keuangan" className={tabClass}>Keuangan</TabsTrigger>
              </>
            )}

            <TabsTrigger value="keamanan" className={tabClass}>Keamanan</TabsTrigger>
          </TabsList>

          <TabsContent value="umum" className="mt-0 space-y-6">
            <SectionCard
              title="Informasi Pribadi"
              description="Data dasar akun yang digunakan untuk identitas dan kebutuhan transaksi di SeribuAsa."
              action={
                <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)} className={secondaryButtonClass}>
                  Edit
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <InfoCard label="Nomor HP" value={displayValues.phone} />
                {!isOrganization && (
                  <>
                    <InfoCard label="Tanggal Lahir" value={displayValues.dateOfBirth} />
                    <InfoCard label="Jenis Kelamin" value={displayValues.gender} />
                  </>
                )}
                {resolvedRole === "health_facility" && (
                  <InfoCard label="Wilayah" value={displayValues.region} />
                )}
              </div>
            </SectionCard>

            {resolvedRole !== "vendor" && (
              <SectionCard
                title="Alamat Terdaftar"
                description="Alamat utama yang tersimpan di akun Anda."
                action={
                  <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)} className={secondaryButtonClass}>
                    Edit
                  </Button>
                }
              >
                <div className={tileClass}>
                  <p className={labelClass}>Alamat Utama · {resolvedName}</p>
                  {displayValues.address !== "Belum diatur" ? (
                    <p className={`${valueClass} max-w-3xl leading-relaxed`}>{displayValues.address}</p>
                  ) : (
                    <p className="mt-1 text-[15px] font-medium text-slate-400">
                      Alamat belum diatur. Lengkapi agar data profil Anda lebih jelas.
                    </p>
                  )}
                </div>
              </SectionCard>
            )}
          </TabsContent>

          {resolvedRole === "vendor" && (
            <>
              <TabsContent value="toko" className="mt-0 space-y-6">
                <SectionCard
                  title="Informasi Toko"
                  description="Data toko vendor yang akan digunakan untuk pengelolaan produk dan transaksi."
                  action={
                    <Button variant="outline" size="sm" onClick={() => setShowStoreModal(true)} className={secondaryButtonClass}>
                      Edit Toko
                    </Button>
                  }
                >
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                    <div className="relative flex min-h-[256px] items-center justify-center overflow-hidden rounded-xl bg-[#F4F7F5]">
                      {displayValues.storeImageUrl ? (
                        <img
                          src={displayValues.storeImageUrl}
                          alt="Foto toko"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <p className="max-w-xs px-6 text-center text-sm text-slate-500">
                          Foto toko belum tersedia. Tambahkan foto agar profil toko terlihat lebih jelas.
                        </p>
                      )}

                      {displayValues.rating !== null && (
                        <div className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm ${shadowClass}`}>
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          <span className="font-bold text-slate-900">{displayValues.rating.toFixed(1)}</span>
                          <span className="text-slate-500">({displayValues.totalTransactions})</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <InfoCard label="Nama Toko" value={displayValues.storeName} />
                      <InfoCard label="Jam Operasional" value={displayValues.operatingHours} />
                      <InfoCard label="Alamat Toko" value={displayValues.storeAddress} />
                      <InfoCard label="Wilayah Toko" value={displayValues.region} />
                    </div>
                  </div>
                </SectionCard>
              </TabsContent>

              <TabsContent value="keuangan" className="mt-0 space-y-6">
                <SectionCard
                  title="Rekening Pencairan"
                  description="Rekening ini digunakan untuk proses pencairan saldo vendor."
                  action={
                    <Button variant="outline" size="sm" onClick={() => setShowBankModal(true)} className={secondaryButtonClass}>
                      {profileData?.bank_account_number ? "Ubah Rekening" : "Tambahkan Rekening"}
                    </Button>
                  }
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <InfoCard label="Bank" value={displayValues.bankName} />
                    <InfoCard label="Pemilik Rekening" value={displayValues.bankAccountHolder} />
                    <InfoCard label="Nomor Rekening" value={displayValues.bankAccountNumber} />
                  </div>
                </SectionCard>
              </TabsContent>
            </>
          )}

          <TabsContent value="keamanan" className="mt-0 space-y-6">
            <SectionCard
              title="Keamanan Akun"
              description="Kelola kata sandi akun Anda dari halaman ini."
              action={
                <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)} className={secondaryButtonClass}>
                  Ubah Kata Sandi
                </Button>
              }
            >
              <InfoCard label="Kata Sandi" value="••••••••" />
            </SectionCard>
          </TabsContent>
        </Tabs>

        <section className={`${sectionClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Keluar dari Akun</h3>
            <p className="mt-1 text-sm text-slate-500">Akhiri sesi akun pada perangkat ini.</p>
          </div>

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="rounded-full border-red-200 bg-white px-5 font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Keluar
          </Button>
        </section>

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profil</DialogTitle>
              <DialogDescription>Perbarui informasi pribadi Anda.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="fullName"
                  className={fieldLabelClass}
                >
                  Nama Lengkap
                </Label>
                <Input
                  id="fullName"
                  value={editFormData.fullName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, fullName: e.target.value })
                  }
                  className={fieldClass}
                  placeholder="Nama lengkap Anda"
                />
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className={fieldLabelClass}
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
                  className={fieldClass}
                />
              </div>

              <div>
                <Label
                  htmlFor="address"
                  className={fieldLabelClass}
                >
                  Alamat
                </Label>
                <textarea
                  id="address"
                  value={editFormData.address}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, address: e.target.value })
                  }
                  className={textareaClass}
                  placeholder="Masukkan alamat"
                />
              </div>
              {resolvedRole === "health_facility" && (
                <RegionFields
                  idPrefix="facility-profile-region"
                  provinceCode={editFormData.provinceCode}
                  regencyCode={editFormData.regencyCode}
                  onChange={(provinceCode, regencyCode) =>
                    setEditFormData((current) => ({ ...current, provinceCode, regencyCode }))
                  }
                  required
                  disabled={isSubmitting}
                />
              )}

              {!isOrganization && (
                <>
                  <div>
                    <Label
                      htmlFor="dob"
                      className={fieldLabelClass}
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
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="gender"
                      className={fieldLabelClass}
                    >
                      Jenis Kelamin
                    </Label>
                    <select
                      id="gender"
                      value={editFormData.gender}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, gender: e.target.value })
                      }
                      className={selectClass}
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className={secondaryButtonClass} onClick={() => setShowEditModal(false)}>
                Batal
              </Button>
              <Button
                onClick={handleEditProfile}
                disabled={isSubmitting}
                className={primaryButtonClass}
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
          <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rekening Pencairan</DialogTitle>
              <DialogDescription>
                Data ini digunakan untuk menarik saldo vendor ke rekening bank
                Anda.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="bankName"
                  className={fieldLabelClass}
                >
                  Nama Bank
                </Label>
                <Input
                  id="bankName"
                  value={bankFormData.bankName}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, bankName: e.target.value })
                  }
                  className={fieldClass}
                  placeholder="Contoh: BCA, BRI, Mandiri"
                />
              </div>

              <div>
                <Label
                  htmlFor="bankAccountNumber"
                  className={fieldLabelClass}
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
                  className={fieldClass}
                  placeholder="Nomor rekening"
                />
              </div>

              <div>
                <Label
                  htmlFor="bankAccountHolder"
                  className={fieldLabelClass}
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
                  className={fieldClass}
                  placeholder="Sesuai nama di rekening"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className={secondaryButtonClass} onClick={() => setShowBankModal(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSaveBankAccount}
                disabled={isSubmitting}
                className={primaryButtonClass}
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
          <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ubah Kata Sandi</DialogTitle>
              <DialogDescription>Perbarui kata sandi akun Anda.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="currentPassword"
                  className={fieldLabelClass}
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
                  className={fieldClass}
                />
              </div>

              <div>
                <Label
                  htmlFor="newPassword"
                  className={fieldLabelClass}
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
                  className={fieldClass}
                />
              </div>

              <div>
                <Label
                  htmlFor="confirmPassword"
                  className={fieldLabelClass}
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
                  className={fieldClass}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className={secondaryButtonClass}
                onClick={() => setShowPasswordModal(false)}
              >
                Batal
              </Button>
              <Button className={primaryButtonClass} onClick={handleChangePassword} disabled={isSubmitting}>
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
          <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Informasi Toko</DialogTitle>
              <DialogDescription>
                Data toko Anda yang akan ditampilkan ke pelanggan.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-1">
              <div>
                <Label className={fieldLabelClass}>
                  Foto Toko
                </Label>

                <div className="relative mt-1 flex w-full flex-col items-center justify-center gap-3 sm:items-start">
                  {storeFormData.storeImageUrl ? (
                    <div className="group relative h-36 w-full overflow-hidden rounded-xl sm:w-40">
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
                      className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-[#F4F7F5] transition-colors hover:bg-[#E6F4EC] sm:w-40"
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
                    <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[#0B6B4F]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Sedang mengunggah...
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="storeName"
                  className={fieldLabelClass}
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
                  className={fieldClass}
                  placeholder="Contoh: Toko Sehat Berkah"
                />
              </div>

              <div>
                <Label
                  htmlFor="operatingHours"
                  className={fieldLabelClass}
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
                  className={fieldClass}
                  placeholder="Contoh: Setiap Hari: 08.00 - 20.00"
                />
              </div>

              <div>
                <Label
                  htmlFor="storeAddress"
                  className={fieldLabelClass}
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
                  className={textareaClass}
                  placeholder="Detail alamat toko Anda"
                />
              </div>
              <RegionFields
                idPrefix="store-profile-region"
                provinceCode={storeFormData.provinceCode}
                regencyCode={storeFormData.regencyCode}
                onChange={(provinceCode, regencyCode) =>
                  setStoreFormData((current) => ({ ...current, provinceCode, regencyCode }))
                }
                required
                disabled={isSubmitting}
                accent="purple"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className={secondaryButtonClass} onClick={() => setShowStoreModal(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSaveStoreInfo}
                disabled={isSubmitting || isUploadingStoreImage}
                className={primaryButtonClass}
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
