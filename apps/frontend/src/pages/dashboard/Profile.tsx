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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, Phone, Mail, Calendar, Edit, LogOut, Lock, Loader2, Landmark, Store, Upload, Star } from "lucide-react";
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
      setStoreFormData({
        storeName: profileData.store_name || "",
        storeAddress: profileData.store_address || "",
        storeImageUrl: profileData.store_image_url || "",
        operatingHours: profileData.operating_hours || "",
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

  const handleStoreImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingStoreImage(true);
    try {
      const { url, error } = await uploadImage(file);
      if (error) {
        toast.error(error);
      } else if (url) {
        setStoreFormData(prev => ({ ...prev, storeImageUrl: url }));
        toast.success("Foto toko berhasil diunggah");
      }
    } catch (error: any) {
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
      storeName: profileLoading ? "Memuat..." : profileData?.store_name || "Belum diatur",
      storeAddress: profileLoading ? "Memuat..." : profileData?.store_address || "Belum diatur",
      storeImageUrl: profileLoading ? "" : profileData?.store_image_url || "",
      operatingHours: profileLoading ? "Memuat..." : profileData?.operating_hours || "Belum diatur",
      rating: profileData?.rating || null,
      totalTransactions: profileData?.total_transactions || null,
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
      <div className="flex flex-col lg:flex-row gap-8 w-full pb-10">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/3 xl:w-1/4 shrink-0 space-y-6">
           <div className="rounded-[2.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
             <div className="h-32 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-400 via-emerald-500 to-teal-600 relative">
               <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
             </div>
             <div className="px-8 pb-8 pt-0 relative flex flex-col items-center text-center">
               <div className="h-28 w-28 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-black/5 -mt-14 mb-4">
                 <div className="h-full w-full rounded-2xl bg-green-50 flex items-center justify-center text-green-600 overflow-hidden relative group">
                   <User size={48} />
                 </div>
               </div>
               <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{resolvedName}</h2>
               <div className="flex flex-col items-center gap-2 mt-2 w-full">
                 <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5 break-all">
                   <Mail size={16} className="shrink-0" /> {user?.email || "-"}
                 </span>
                 <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0 px-3 py-1 mt-2 font-semibold rounded-full shadow-sm">
                   {displayValues.role}
                 </Badge>
               </div>
               <Button 
                 onClick={() => setShowEditModal(true)} 
                 className="w-full mt-6 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm rounded-2xl gap-2 font-semibold h-12 transition-all active:scale-[0.98]"
               >
                 <Edit size={18} /> Edit Profil
               </Button>
             </div>
           </div>

           {/* Quick Actions / Logout */}
           <div className="rounded-[2rem] bg-white p-6 border border-red-50 shadow-sm transition-all duration-300">
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

        {/* Right Content */}
        <div className="w-full lg:w-2/3 xl:w-3/4">
          <Tabs defaultValue="umum" className="w-full">
            <TabsList className="bg-white border border-gray-100 shadow-sm rounded-2xl p-1.5 mb-8 flex flex-wrap gap-1 h-auto w-full sm:w-auto overflow-x-auto justify-start sm:justify-start">
              <TabsTrigger value="umum" className="rounded-xl px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Umum</TabsTrigger>
              {resolvedRole === "vendor" && (
                <>
                  <TabsTrigger value="toko" className="rounded-xl px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Informasi Toko</TabsTrigger>
                  <TabsTrigger value="keuangan" className="rounded-xl px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Keuangan</TabsTrigger>
                </>
              )}
              <TabsTrigger value="keamanan" className="rounded-xl px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Keamanan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="umum" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Personal Info Bento */}
              <div className="rounded-[2.5rem] bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-green-100 text-green-600">
                    <User size={20} />
                  </div>
                  Informasi Pribadi
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-green-50/50 hover:border-green-200 group">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 group-hover:text-green-600 transition-colors">Nomor HP</p>
                    <p className="text-base font-semibold text-gray-900 flex items-center gap-2.5">
                      <Phone size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" /> 
                      {displayValues.phone === "Belum diatur" ? <span className="italic text-gray-400 font-medium text-sm">Belum diatur</span> : displayValues.phone}
                    </p>
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-green-50/50 hover:border-green-200 group">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 group-hover:text-green-600 transition-colors">Tanggal Lahir</p>
                    <p className="text-base font-semibold text-gray-900 flex items-center gap-2.5">
                      <Calendar size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" /> 
                      {displayValues.dateOfBirth === "Belum diatur" ? <span className="italic text-gray-400 font-medium text-sm">Belum diatur</span> : displayValues.dateOfBirth}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-green-50/50 hover:border-green-200 group sm:col-span-2 md:col-span-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 group-hover:text-green-600 transition-colors">Jenis Kelamin</p>
                    <p className="text-base font-semibold text-gray-900 flex items-center gap-2.5">
                      <User size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" /> 
                      {displayValues.gender === "Belum diatur" ? <span className="italic text-gray-400 font-medium text-sm">Belum diatur</span> : displayValues.gender}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Bento */}
              {resolvedRole !== "vendor" && (
                <div className="rounded-[2.5rem] bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
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
              )}
            </TabsContent>

            {resolvedRole === "vendor" && (
              <>
                <TabsContent value="toko" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="rounded-[2.5rem] bg-white p-8 border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                          <Store size={20} />
                        </div>
                        Informasi Toko
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowStoreModal(true)}
                        className="h-10 rounded-xl text-sm font-semibold border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Edit size={16} className="mr-2" /> Edit Toko
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {displayValues.storeImageUrl && (
                        <div className="sm:col-span-2 rounded-3xl overflow-hidden h-56 border border-gray-100 relative group">
                          <img src={displayValues.storeImageUrl} alt="Store" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          {(displayValues.rating !== null) && (
                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2 border border-white/20">
                              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                              <span className="font-bold text-gray-900 text-base">{displayValues.rating.toFixed(1)}</span>
                              <span className="text-gray-500 text-sm ml-0.5 font-medium">({displayValues.totalTransactions})</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6 pt-16">
                             <h4 className="text-white font-bold text-2xl">{displayValues.storeName}</h4>
                          </div>
                        </div>
                      )}
                      
                      {!displayValues.storeImageUrl && (
                        <div className="p-6 rounded-3xl bg-purple-50/50 border border-purple-100 sm:col-span-2 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1.5">Nama Toko</p>
                            <p className="text-lg font-bold text-purple-950">
                              {displayValues.storeName === "Belum diatur" ? <span className="italic text-purple-400 font-medium text-base">Belum diatur</span> : displayValues.storeName}
                            </p>
                          </div>
                          {(displayValues.rating !== null) && (
                            <div className="bg-amber-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-amber-100">
                              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                              <span className="font-bold text-amber-900 text-base">{displayValues.rating.toFixed(1)}</span>
                              <span className="text-amber-700/70 text-sm ml-0.5 font-medium">({displayValues.totalTransactions})</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-purple-50/50 hover:border-purple-200 sm:col-span-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Jam Operasional</p>
                        <p className="text-base font-semibold text-gray-900">
                          {displayValues.operatingHours === "Belum diatur" ? <span className="italic text-gray-400 font-medium text-sm">Belum diatur</span> : displayValues.operatingHours}
                        </p>
                      </div>
                      
                      <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-purple-50/50 hover:border-purple-200 sm:col-span-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Alamat Toko</p>
                        <p className="text-base font-semibold text-gray-900 line-clamp-3">
                          {displayValues.storeAddress === "Belum diatur" ? <span className="italic text-gray-400 font-medium text-sm">Belum diatur</span> : displayValues.storeAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="keuangan" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="rounded-[2.5rem] bg-white p-8 border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                        <Landmark size={20} />
                      </div>
                      Rekening Pencairan
                    </h3>

                    <div className="space-y-4 rounded-3xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-100 p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                            Bank
                          </p>
                          <p className="mt-1 text-base font-bold text-emerald-950">
                            {displayValues.bankName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                            Pemilik Rekening
                          </p>
                          <p className="mt-1 text-base font-bold text-emerald-950">
                            {displayValues.bankAccountHolder}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-200/50">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                          Nomor Rekening
                        </p>
                        <p className="mt-1 text-lg font-mono font-bold text-emerald-950 tracking-wider">
                          {displayValues.bankAccountNumber}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowBankModal(true)}
                      className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2 font-semibold h-12 px-6"
                    >
                      <Landmark size={18} />
                      {profileData?.bank_account_number ? "Ubah Rekening" : "Tambahkan Rekening"}
                    </Button>
                  </div>
                </TabsContent>
              </>
            )}

            <TabsContent value="keamanan" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Security Bento */}
              <div className="rounded-[2.5rem] bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                    <Lock size={20} />
                  </div>
                  Keamanan
                </h3>
                
                <p className="text-sm font-medium text-gray-500 mb-6">Pastikan akun Anda tetap aman dengan memperbarui kata sandi secara berkala.</p>
                
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full sm:w-auto bg-gray-50 hover:bg-blue-50 active:scale-[0.98] text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-2xl flex items-center justify-between p-4 transition-all group"
                >
                  <div className="flex items-center gap-3 pr-6">
                    <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100 group-hover:border-blue-100">
                      <Lock size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="font-semibold">Ubah Kata Sandi</span>
                  </div>
                </button>
              </div>
            </TabsContent>
          </Tabs>
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

        {/* Store Info Modal */}
        <Dialog open={showStoreModal} onOpenChange={setShowStoreModal}>
          <DialogContent className="w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Informasi Toko</DialogTitle>
              <DialogDescription>
                Data toko Anda yang akan ditampilkan ke pelanggan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
              <div className="flex flex-col items-center sm:items-start">
                <Label className="text-xs font-semibold uppercase tracking-wide mb-2">
                  Foto Toko
                </Label>
                <div className="relative w-full sm:w-auto mt-1 flex flex-col items-center justify-center gap-3">
                  {storeFormData.storeImageUrl ? (
                    <div className="w-full sm:w-32 h-32 rounded-xl border border-gray-200 overflow-hidden relative group">
                      <img 
                        src={storeFormData.storeImageUrl} 
                        alt="Store preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Label htmlFor="storeImageUpload" className="cursor-pointer text-white text-xs font-semibold hover:underline">
                          Ganti Foto
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <Label 
                      htmlFor="storeImageUpload" 
                      className="w-full sm:w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 font-medium">Unggah Foto</span>
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
                    <div className="text-xs text-[#2f6f46] flex items-center gap-1.5 animate-pulse mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Sedang mengunggah...
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="storeName" className="text-xs font-semibold uppercase tracking-wide">
                  Nama Toko
                </Label>
                <Input
                  id="storeName"
                  value={storeFormData.storeName}
                  onChange={(e) => setStoreFormData({ ...storeFormData, storeName: e.target.value })}
                  className="mt-1"
                  placeholder="Contoh: Toko Sehat Berkah"
                />
              </div>
              <div>
                <Label htmlFor="operatingHours" className="text-xs font-semibold uppercase tracking-wide">
                  Jam Operasional
                </Label>
                <Input
                  id="operatingHours"
                  value={storeFormData.operatingHours}
                  onChange={(e) => setStoreFormData({ ...storeFormData, operatingHours: e.target.value })}
                  className="mt-1"
                  placeholder="Contoh: Setiap Hari: 08.00 - 20.00"
                />
              </div>
              <div>
                <Label htmlFor="storeAddress" className="text-xs font-semibold uppercase tracking-wide">
                  Alamat Toko
                </Label>
                <textarea
                  id="storeAddress"
                  value={storeFormData.storeAddress}
                  onChange={(e) => setStoreFormData({ ...storeFormData, storeAddress: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background min-h-[70px] text-sm"
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
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Informasi Toko"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </DashboardLayout>
  );
};

export default Profile;
