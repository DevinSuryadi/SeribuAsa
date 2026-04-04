import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Phone, Mail, Edit, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    toast.success('Berhasil keluar');
    navigate('/');
  };

  const roleLabel = userRole === 'donor' ? 'Donatur' : userRole === 'beneficiary' ? 'Penerima Manfaat' : userRole === 'vendor' ? 'Vendor' : userRole;

  return (
    <DashboardLayout title="Profil Saya" subtitle="Kelola informasi pribadi dan pengaturan akun Anda.">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Profile Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
              <CardDescription>Kelola data profil Anda</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info('Fitur edit profil segera hadir!')}>
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">{user?.fullName || 'Pengguna'}</div>
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
                  <div className="text-sm font-medium text-foreground">Belum diatur</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Tanggal Lahir</div>
                  <div className="text-sm font-medium text-foreground">Belum diatur</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Jenis Kelamin</div>
                  <div className="text-sm font-medium text-foreground">Belum diatur</div>
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
                    <span className="font-medium text-foreground">{user?.fullName || 'Pengguna'}</span>
                    <Badge variant="secondary" className="text-[10px]">Utama</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Belum diatur</p>
                  <p className="text-sm text-foreground mt-2 text-muted-foreground italic">Silakan lengkapi profil Anda untuk menambahkan alamat.</p>
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
                <Badge variant="outline" className="capitalize">{userRole}</Badge>
              </div>
            </div>
            <Separator />
            <Button variant="destructive" className="w-full gap-2" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Keluar dari Akun
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
