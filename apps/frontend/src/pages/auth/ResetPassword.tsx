import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Check, X } from "lucide-react";
import logo from "@/assets/logo.svg";

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const validatePassword = (password: string): PasswordValidation => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const passwordsMatch = password === confirmPassword;
  const passwordValidation = validatePassword(password);
  const meetsStrengthRequirements =
    passwordValidation.minLength &&
    passwordValidation.hasUppercase &&
    passwordValidation.hasNumber &&
    passwordValidation.hasSpecialChar;
  const isFormValid =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    passwordsMatch &&
    meetsStrengthRequirements;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setTokenValid(true);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    });

    timeoutId = setTimeout(() => {
      setTokenValid((current) => {
        if (current === null) return false;
        return current;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
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

  if (tokenValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-sm sm:max-w-md rounded-2xl border border-gray-100 bg-white shadow-lg p-6 sm:p-8 text-center">
          <Loader2 className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
          <div className="text-lg font-bold text-gray-900 mb-2">Memverifikasi tautan...</div>
          <p className="text-sm text-gray-400">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-sm sm:max-w-md rounded-2xl border border-gray-100 bg-white shadow-lg p-6 sm:p-8 text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-lg font-bold text-gray-900 mb-2">Tautan Tidak Valid</div>
          <p className="text-sm text-gray-400 mb-4">
            Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.
          </p>
          <a href="/lupa-sandi" className="text-green-600 hover:text-green-700 font-medium text-sm">
            Minta tautan baru
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md rounded-2xl border border-gray-100 bg-white shadow-lg p-6 sm:p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo SeribuAsa" className="w-20 h-20 object-contain" />
          <h1 className="text-xl font-bold -mt-4" style={{ color: "#346A43" }}>
            SeribuAsa
          </h1>
        </div>

        <div className="text-center mb-6">
          <div className="text-lg font-bold text-gray-900">Reset Kata Sandi</div>
          <p className="mt-1 text-sm text-gray-400">Masukkan kata sandi baru Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">
              Kata Sandi Baru
            </label>
            <input
              id="password"
              type="password"
              placeholder="Min. 8 karakter"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>

          {/* Password strength checklist */}
          {password.length > 0 && (
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-1.5">
                {passwordValidation.minLength ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={passwordValidation.minLength ? "text-green-600" : "text-gray-400"}>
                  Minimal 8 karakter
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                {passwordValidation.hasUppercase ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span
                  className={passwordValidation.hasUppercase ? "text-green-600" : "text-gray-400"}
                >
                  Huruf besar (A-Z)
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                {passwordValidation.hasNumber ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={passwordValidation.hasNumber ? "text-green-600" : "text-gray-400"}>
                  Angka (0-9)
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                {passwordValidation.hasSpecialChar ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span
                  className={passwordValidation.hasSpecialChar ? "text-green-600" : "text-gray-400"}
                >
                  Karakter khusus (!@#$%^&*...)
                </span>
              </li>
            </ul>
          )}

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Masukkan ulang kata sandi"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>

          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-sm text-red-500">Kata sandi tidak cocok</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${loading || !isFormValid ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:-translate-y-0.5"}`}
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
