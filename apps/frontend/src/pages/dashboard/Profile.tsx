import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { User, MapPin, Phone, Mail, Calendar, Edit, LogOut, Lock, Loader2 } from "lucide-react";
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
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Profile Info */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4">
            <div>
              <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
              <CardDescription>Kelola data profil Anda</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full sm:w-auto"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">{resolvedName}</div>
                <div className="text-sm text-muted-foreground">{user?.email || "-"}</div>
                <Badge className="mt-1 capitalize">{displayValues.role}</Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-medium text-foreground">{user?.email || "-"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Nomor HP</div>
                  <div className="text-sm font-medium text-foreground">{displayValues.phone}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Tanggal Lahir</div>
                  <div className="text-sm font-medium text-foreground">
                    {displayValues.dateOfBirth}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Jenis Kelamin</div>
                  <div className="text-sm font-medium text-foreground">{displayValues.gender}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Alamat
            </CardTitle>
            <CardDescription>Alamat terdaftar Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{resolvedName}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      Utama
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{displayValues.address}</p>
                  {!profileData?.address && !profileLoading && (
                    <p className="text-sm text-foreground mt-2 text-muted-foreground italic">
                      Silakan lengkapi profil Anda untuk menambahkan alamat.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Akun</CardTitle>
            <CardDescription>Kelola pengaturan akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-foreground">Role Akun</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {displayValues.role}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {resolvedRole || "-"}
                </Badge>
              </div>
            </div>
            <Separator />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowPasswordModal(true)}
            >
              <Lock className="h-4 w-4" /> Ubah Kata Sandi
            </Button>
            <Button variant="destructive" className="w-full gap-2" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Keluar dari Akun
            </Button>
          </CardContent>
        </Card>

        {/* Edit Profile Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profil</DialogTitle>
              <DialogDescription>Perbarui informasi pribadi Anda</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Nomor HP</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08xx xxxx xxxx"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="address">Alamat</Label>
                <textarea
                  id="address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 border border-input rounded-md bg-background min-h-[80px]"
                  placeholder="Masukkan alamat"
                />
              </div>
              <div>
                <Label htmlFor="dob">Tanggal Lahir</Label>
                <Input
                  id="dob"
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, dateOfBirth: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <select
                  id="gender"
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Batal
              </Button>
              <Button onClick={handleEditProfile} disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={(e) =>
                    setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={passwordFormData.newPassword}
                  onChange={(e) =>
                    setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) =>
                    setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                Batal
              </Button>
              <Button onClick={handleChangePassword} disabled={isSubmitting}>
                {isSubmitting ? "Mengubah..." : "Ubah Kata Sandi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
