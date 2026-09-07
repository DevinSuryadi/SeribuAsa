import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.svg'

export default function LupaSandi() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error('Gagal mengirim', { description: error.message });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-white shadow-lg p-6 sm:p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email Terkirim!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Silakan cek inbox email <strong className="text-gray-700">{email}</strong> untuk tautan reset kata sandi.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-semibold">
            <ArrowLeft size={14} /> Kembali ke Masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-white shadow-lg p-6 sm:p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={logo}
            alt="Logo SeribuAsa"
            className="w-20 h-20 object-contain"
          />
          <h1 className="text-xl font-bold -mt-4" style={{ color: '#346A43' }}>SeribuAsa</h1>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Lupa Kata Sandi</h2>
          <p className="text-sm text-gray-500">Masukkan email Anda untuk menerima tautan reset</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
            <input
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-500 transition bg-gray-50 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 shadow-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Kirim Tautan Reset
          </button>

          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition">
            <ArrowLeft size={13} /> Kembali ke Masuk
          </Link>
        </form>
      </div>
    </div>
  );
}
