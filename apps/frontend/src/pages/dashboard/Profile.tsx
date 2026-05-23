import { useState, useEffect, useMemo } from "react";
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
import { User, MapPin, Phone, Mail, Calendar, Edit, LogOut, Lock, Loader2, Landmark } from "lucide-react";
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

const Profile = () => {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { data: profileData, loading: profileLoading, isSubmitting, updateProfile } = useProfile();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

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

  // Update form data when profile loads
  useEffect(() => {
    if (profileData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    }
  }, [profileData, user?.fullName]);

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

    // TODO: Implement password change API
    toast.info("Fitur ubah kata sandi akan segera tersedia");
    setShowPasswordModal(false);
    setPasswordFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
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

  const resolvedRole = profileData?.role || userRole;
  const resolvedName = profileData?.full_name || user?.fullName || "Pengguna";

  const displayValues = useMemo(
    () => ({
      phone: profileLoading ? "Memuat..." : profileData?.phone || "Belum diatur",
      address: profileLoading ? "Memuat..." : profileData?.address || "Belum diatur",
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
      bankName: profileLoading ? "Memuat..." : profileData?.bank_name || "Belum diatur",
      bankAccountNumber: profileLoading
        ? "Memuat..."
        : profileData?.bank_account_number
          ? `****${profileData.bank_account_number.slice(-4)}`
          : "Belum diatur",
      bankAccountHolder: profileLoading
        ? "Memuat..."
        : profileData?.bank_account_holder || "Belum diatur",
      role: ROLE_LABELS[resolvedRole || ""] || "-",
    }),
    [profileLoading, profileData, resolvedRole]
  );

  if (profileLoading) {
    return (
      <DashboardLayout
        title="Profil Saya"
        subtitle="Kelola informasi pribadi dan pengaturan akun Anda."
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Memuat profil...</p>
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
      <div className="space-y-6 w-full pb-10">
        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="h-36 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-400"></div>
          
          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-14">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                <div className="h-28 w-28 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-black/5">
                  <div className="h-full w-full rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                    <User size={48} />
                  </div>
                </div>
                <div className="text-center sm:text-left pb-2">
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{resolvedName}</h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                      <Mail size={16} /> {user?.email || "-"}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden sm:block"></span>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0 px-3 py-1 font-semibold rounded-full shadow-sm">
                      {displayValues.role}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setShowEditModal(true)} 
                className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm rounded-xl gap-2 font-semibold h-11 px-5 transition-all active:scale-95"
              >
                <Edit size={18} /> Edit Profil
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info Bento */}
            <div className="rounded-[2rem] bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-green-100 text-green-600">
                  <User size={20} />
                </div>
                Informasi Pribadi
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-green-50 hover:border-green-200 group">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 group-hover:text-green-600 transition-colors">Nomor HP</p>
                  <p className="text-base font-semibold text-gray-900 flex items-center gap-2.5">
                    <Phone size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" /> 
                    {displayValues.phone}
                  </p>
                </div>
                
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-green-50 hover:border-green-200 group">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 group-hover:text-green-600 transition-colors">Tanggal Lahir</p>
                  <p className="text-base font-semibold text-gray-900 flex items-center gap-2.5">
                    <Calendar size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" /> 
                    {displayValues.dateOfBirth}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-green-50 hover:border-green-200 group sm:col-span-2 md:col-span-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 group-hover:text-green-600 transition-colors">Jenis Kelamin</p>
                  <p className="text-base font-semibold text-gray-900 flex items-center gap-2.5">
                    <User size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" /> 
                    {displayValues.gender}
                  </p>
                </div>
              </div>
            </div>

            {/* Address Bento */}
            <div className="rounded-[2rem] bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                  <MapPin size={20} />
                </div>
                Alamat Terdaftar
              </h3>
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-green-50/80 to-emerald-50/80 border border-green-100 relative overflow-hidden group">
                <MapPin className="absolute -right-6 -bottom-6 w-32 h-32 text-green-200/40 group-hover:scale-110 group-hover:text-green-200/60 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-bold text-green-900 text-lg">{resolvedName}</span>
                    <span className="px-3 py-1 rounded-full bg-white text-green-700 text-xs font-bold border border-green-200 shadow-sm">Utama</span>
                  </div>
                  <p className="text-green-800/90 leading-relaxed font-medium">
                    {displayValues.address && displayValues.address !== "Belum diatur" ? displayValues.address : <span className="italic text-green-600/70">Alamat belum diatur</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1 col */}
          <div className="space-y-6">
            {resolvedRole === "vendor" && (
              <div className="rounded-[2rem] bg-white p-8 border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                    <Landmark size={20} />
                  </div>
                  Rekening Pencairan
                </h3>

                <div className="space-y-3 rounded-3xl bg-emerald-50/70 border border-emerald-100 p-5">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Bank
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {displayValues.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Pemilik Rekening
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {displayValues.bankAccountHolder}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Nomor Rekening
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {displayValues.bankAccountNumber}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setShowBankModal(true)}
                  className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2 font-semibold h-11"
                >
                  <Landmark size={18} />
                  {profileData?.bank_account_number ? "Ubah Rekening" : "Tambahkan Rekening"}
                </Button>
              </div>
            )}

            {/* Security Bento */}
            <div className="rounded-[2rem] bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <Lock size={20} />
                </div>
                Keamanan
              </h3>
              
              <p className="text-sm font-medium text-gray-500 mb-6">Pastikan akun Anda tetap aman dengan memperbarui kata sandi secara berkala.</p>
              
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full bg-gray-50 hover:bg-gray-100 hover:border-gray-300 active:scale-[0.98] text-gray-700 border border-gray-200 rounded-2xl flex items-center justify-between p-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100">
                    <Lock size={18} className="text-gray-600" />
                  </div>
                  <span className="font-semibold">Ubah Kata Sandi</span>
                </div>
              </button>
            </div>

            {/* Danger Zone Bento */}
            <div className="rounded-[2rem] bg-white p-8 border border-red-50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-100 text-red-600">
                  <LogOut size={20} />
                </div>
                Sesi Akun
              </h3>
              
              <p className="text-sm font-medium text-gray-500 mb-6">Keluar dari perangkat ini untuk mengakhiri sesi Anda saat ini.</p>
              
              <button 
                onClick={handleSignOut}
                className="w-full bg-red-50 hover:bg-red-100 hover:border-red-200 active:scale-[0.98] text-red-700 border border-red-100 rounded-2xl flex items-center justify-between p-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-sm border border-red-100">
                    <LogOut size={18} className="text-red-600" />
                  </div>
                  <span className="font-semibold">Keluar dari Akun</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profil</DialogTitle>
              <DialogDescription>Perbarui informasi pribadi Anda</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide">
                  Nama Lengkap
                </Label>
                <Input
                  id="fullName"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="mt-1"
                  placeholder="Nama lengkap Anda"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide">
                  Nomor HP
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08xx xxxx xxxx"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wide">
                  Alamat
                </Label>
                <textarea
                  id="address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background min-h-[70px] text-sm"
                  placeholder="Masukkan alamat"
                />
              </div>
              <div>
                <Label htmlFor="dob" className="text-xs font-semibold uppercase tracking-wide">
                  Tanggal Lahir
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, dateOfBirth: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gender" className="text-xs font-semibold uppercase tracking-wide">
                  Jenis Kelamin
                </Label>
                <select
                  id="gender"
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
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
              <Button onClick={handleEditProfile} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bank Account Modal */}
        <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
          <DialogContent className="w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rekening Pencairan</DialogTitle>
              <DialogDescription>
                Data ini digunakan untuk menarik saldo vendor ke rekening bank Anda.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="bankName" className="text-xs font-semibold uppercase tracking-wide">
                  Nama Bank
                </Label>
                <Input
                  id="bankName"
                  value={bankFormData.bankName}
                  onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                  className="mt-1"
                  placeholder="Contoh: BCA, BRI, Mandiri"
                />
              </div>
              <div>
                <Label htmlFor="bankAccountNumber" className="text-xs font-semibold uppercase tracking-wide">
                  Nomor Rekening
                </Label>
                <Input
                  id="bankAccountNumber"
                  inputMode="numeric"
                  value={bankFormData.bankAccountNumber}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, bankAccountNumber: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Nomor rekening"
                />
              </div>
              <div>
                <Label htmlFor="bankAccountHolder" className="text-xs font-semibold uppercase tracking-wide">
                  Nama Pemilik Rekening
                </Label>
                <Input
                  id="bankAccountHolder"
                  value={bankFormData.bankAccountHolder}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, bankAccountHolder: e.target.value })
                  }
                  className="mt-1"
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Rekening"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Modal */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ubah Kata Sandi</DialogTitle>
              <DialogDescription>Perbarui kata sandi akun Anda</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="currentPassword"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  Kata Sandi Saat Ini
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={(e) =>
                    setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="newPassword"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  Kata Sandi Baru
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={passwordFormData.newPassword}
                  onChange={(e) =>
                    setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  Konfirmasi Kata Sandi
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) =>
                    setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                Batal
              </Button>
              <Button onClick={handleChangePassword} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengubah...
                  </>
                ) : (
                  "Ubah Kata Sandi"
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
