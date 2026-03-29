import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Shield } from "lucide-react";

export default function Masuk() {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
            <Shield className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold mt-2">SeribuAsa</h1>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-center mb-1">
          Masuk ke Akun
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Masukkan email dan kata sandi Anda
        </p>

        {/* Form */}
        <form className="space-y-4">

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="email@contoh.com"
              className="w-full mt-1 border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-green-300"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium">Kata Sandi</label>

            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                className="w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring focus:ring-green-300"
              />

              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <p className="text-right">
            <Link to="/lupa-sandi" className="text-sm text-green-600 hover:underline">
              Lupa kata sandi?
            </Link>
          </p>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            Masuk
          </button>

        </form>

        {/* Register */}
        <p className="text-sm text-center text-gray-500 mt-6">
          Belum punya akun?{" "}
          <Link to="/register" className="text-green-600 font-medium">
            Daftar sekarang
          </Link>
        </p>

      </div>
    </div>
  );
}