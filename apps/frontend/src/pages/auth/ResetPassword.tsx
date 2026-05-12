import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { Loader2, CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.svg'

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Supabase handles token exchange automatically
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-sm sm:max-w-md rounded-2xl border border-gray-100 bg-white shadow-lg p-6 sm:p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <div className="text-lg font-bold text-gray-900 mb-2">Kata Sandi Diperbarui!</div>
          <p className="text-sm text-gray-400">Anda akan diarahkan ke halaman masuk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md rounded-2xl border border-gray-100 bg-white shadow-lg p-6 sm:p-8">

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
          <div className="text-lg font-bold text-gray-900">Reset Kata Sandi</div>
          <p className="mt-1 text-sm text-gray-400">Masukkan kata sandi baru Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">Kata Sandi Baru</label>
            <input
              id="password"
              type="password"
              placeholder="Min. 6 karakter"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${loading ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:-translate-y-0.5'}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Perbarui Kata Sandi
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;