import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, MapPin, Phone, Mail, Calendar, Edit, LogOut, Lock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_BASE_URL = 'http://localhost:8000/api/v1';

type BackendProfile = {
  full_name: string;
  role?: string | null;
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | null;
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, userRole, session, signOut } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState<BackendProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: user?.fullName || '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tryEnsureProfile = async (preferredFullName?: string) => {
    if (!user?.id) return false;

    const normalizedFullName = preferredFullName?.trim() || user.fullName || 'Pengguna';

    if (session?.access_token) {
      const syncBody = preferredFullName?.trim() ? { full_name: preferredFullName.trim() } : {};
      const syncResponse = await fetch(`${BACKEND_BASE_URL}/auth/google/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(syncBody),
      });

      if (syncResponse.ok) return true;
    }

    const fallbackRole =
      userRole === 'beneficiary' || userRole === 'vendor' || userRole === 'corporate_donor'
        ? userRole
        : 'donor';

    const signupResponse = await fetch(`${BACKEND_BASE_URL}/users/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        full_name: normalizedFullName,
        role: fallbackRole,
      }),
    });

    return signupResponse.ok || signupResponse.status === 409;
  };

  const formatDateForDisplay = (dateText?: string | null) => {
    if (!dateText) return 'Belum diatur';

    const [year, month, day] = dateText.split('-').map(Number);
    if (!year || !month || !day) return dateText;

    return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!user?.id) return;

      setProfileLoading(true);
      try {
        let response = await fetch(`${BACKEND_BASE_URL}/users/${user.id}`);

        if (!response.ok && response.status === 404) {
          const synced = await tryEnsureProfile(user.fullName || undefined);
          if (synced) {
            response = await fetch(`${BACKEND_BASE_URL}/users/${user.id}`);
          }
        }

        if (!response.ok) return;

        const data = await response.json();
        if (!isActive) return;

        const nextProfile: BackendProfile = {
          full_name: data.full_name || user.fullName || 'Pengguna',
          role: data.role || null,
          phone: data.phone || null,
          address: data.address || null,
          date_of_birth: data.date_of_birth || null,
          gender: data.gender || null,
        };

        setProfileData(nextProfile);
        setEditFormData((prev) => ({
          ...prev,
          fullName: nextProfile.full_name,
          phone: nextProfile.phone || '',
          address: nextProfile.address || '',
          dateOfBirth: nextProfile.date_of_birth || '',
          gender: nextProfile.gender || '',
        }));
      } catch (error) {
        console.warn('[PROFILE] Failed to load profile from backend', error);
      } finally {
        if (isActive) setProfileLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [user?.id, user?.fullName, userRole, session?.access_token]);

  const handleSignOut = () => {
    signOut();
    toast.success('Berhasil keluar');
    navigate('/');
  };

  const handleEditProfile = async () => {
    if (!editFormData.fullName.trim()) {
      toast.error('Nama tidak boleh kosong');
      return;
    }

    if (editFormData.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s]{8,20}$/;
      if (!phoneRegex.test(editFormData.phone.trim())) {
        toast.error('Nomor HP tidak valid');
        return;
      }
    }

    if (!user?.id) {
      toast.error('User tidak ditemukan. Silakan login ulang.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        full_name: editFormData.fullName.trim(),
        phone: editFormData.phone.trim() || null,
        address: editFormData.address.trim() || null,
        date_of_birth: editFormData.dateOfBirth || null,
        gender: (editFormData.gender || null) as 'male' | 'female' | null,
      };

      const requestBody = JSON.stringify(payload);
      const requestInit = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      };

      let response = await fetch(`${BACKEND_BASE_URL}/users/${user.id}`, requestInit);

      if (response.status === 404) {
        const synced = await tryEnsureProfile(payload.full_name);
        if (synced) {
          response = await fetch(`${BACKEND_BASE_URL}/users/${user.id}`, requestInit);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Gagal memperbarui profil' }));
        throw new Error(errorData.detail || 'Gagal memperbarui profil');
      }

      const updatedProfile = await response.json();
      const nextProfile: BackendProfile = {
        full_name: updatedProfile.full_name || payload.full_name,
        role: updatedProfile.role || profileData?.role || null,
        phone: updatedProfile.phone || null,
        address: updatedProfile.address || null,
        date_of_birth: updatedProfile.date_of_birth || null,
        gender: updatedProfile.gender || null,
      };

      setProfileData(nextProfile);
      setEditFormData((prev) => ({
        ...prev,
        fullName: nextProfile.full_name,
        phone: nextProfile.phone || '',
        address: nextProfile.address || '',
        dateOfBirth: nextProfile.date_of_birth || '',
        gender: nextProfile.gender || '',
      }));

      toast.success('Profil berhasil diperbarui');
      setShowEditModal(false);
    } catch (error: any) {
      toast.error('Gagal memperbarui profil', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword) {
      toast.error('Semua field harus diisi');
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error('Kata sandi baru tidak cocok');
      return;
    }
    if (passwordFormData.newPassword.length < 8) {
      toast.error('Kata sandi minimal 8 karakter');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // TODO: Call API to change password
      await new Promise(r => setTimeout(r, 500));
      toast.success('Kata sandi berhasil diubah');
      setShowPasswordModal(false);
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error('Gagal mengubah kata sandi', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedRole = profileData?.role || userRole;
  const resolvedName = profileData?.full_name || user?.fullName || 'Pengguna';
  const resolvedPhone = profileLoading ? 'Memuat...' : (profileData?.phone || 'Belum diatur');
  const resolvedAddress = profileLoading ? 'Memuat...' : (profileData?.address || 'Belum diatur');
  const resolvedDateOfBirth = profileLoading ? 'Memuat...' : formatDateForDisplay(profileData?.date_of_birth);
  const resolvedGender =
    profileLoading
      ? 'Memuat...'
      : profileData?.gender === 'male'
        ? 'Laki-laki'
        : profileData?.gender === 'female'
          ? 'Perempuan'
          : 'Belum diatur';
  const roleLabel =
    resolvedRole === 'donor'
      ? 'Donatur'
      : resolvedRole === 'corporate_donor'
        ? 'Donatur Korporat'
        : resolvedRole === 'beneficiary'
          ? 'Penerima Manfaat'
          : resolvedRole === 'vendor'
            ? 'Vendor'
            : resolvedRole === 'admin'
              ? 'Admin'
              : resolvedRole === 'government'
                ? 'Pemerintah'
                : '-';

  return (
    <DashboardLayout title="Profil Saya" subtitle="Kelola informasi pribadi dan pengaturan akun Anda.">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Profile Info */}
         <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4">
            <div>
              <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
              <CardDescription>Kelola data profil Anda</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" onClick={() => setShowEditModal(true)}>
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
                <div className="text-sm text-muted-foreground">{user?.email || '-'}</div>
                <Badge className="mt-1 capitalize">{roleLabel}</Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-medium text-foreground">{user?.email || '-'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Nomor HP</div>
                  <div className="text-sm font-medium text-foreground">{resolvedPhone}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Tanggal Lahir</div>
                  <div className="text-sm font-medium text-foreground">{resolvedDateOfBirth}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Jenis Kelamin</div>
                  <div className="text-sm font-medium text-foreground">{resolvedGender}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Alamat</CardTitle>
            <CardDescription>Alamat terdaftar Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{resolvedName}</span>
                    <Badge variant="secondary" className="text-[10px]">Utama</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{resolvedAddress}</p>
                  {!profileData?.address && !profileLoading && (
                    <p className="text-sm text-foreground mt-2 text-muted-foreground italic">Silakan lengkapi profil Anda untuk menambahkan alamat.</p>
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
                  <div className="text-xs text-muted-foreground capitalize">{roleLabel}</div>
                </div>
                <Badge variant="outline" className="capitalize">{resolvedRole || '-'}</Badge>
              </div>
            </div>
            <Separator />
            <Button variant="outline" className="w-full gap-2" onClick={() => setShowPasswordModal(true)}>
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
                  onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
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
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="address">Alamat</Label>
                <textarea
                  id="address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
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
                  onChange={(e) => setEditFormData({...editFormData, dateOfBirth: e.target.value})}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <select
                  id="gender"
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                  className="w-full mt-1.5 px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
              <Button onClick={handleEditProfile} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
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
                  onChange={(e) => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})}
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
                  onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>Batal</Button>
              <Button onClick={handleChangePassword} disabled={isSubmitting}>
                {isSubmitting ? 'Mengubah...' : 'Ubah Kata Sandi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
