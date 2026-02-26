
import React, { useState } from 'react';
import { LogIn, User as UserIcon, Lock, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLogin: (nip: string, pass: string) => Promise<boolean>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await onLogin(nip, password);
      if (!success) {
        setError('Kombinasi NIP dan Password tidak terdaftar.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mencoba masuk.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 selection:bg-blue-100">
      <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-blue-100/50 border border-gray-100 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24 animate-pulse-slow">
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                 <polygon points="20,70 45,70 45,30 20,30" fill="#3B82F6" opacity="0.8" />
                 <polygon points="40,90 85,45 40,0" fill="#2563EB" />
                 <polygon points="20,40 50,40 50,15" fill="#60A5FA" />
               </svg>
            </div>
          </div>
          <h1 className="text-4xl font-black text-[#2563EB] tracking-tighter mb-1">Hadir.In</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">Sistem Presensi Pegawai Terpadu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center border border-red-100 animate-in shake duration-500">
              <AlertCircle size={16} className="mr-2 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <UserIcon size={18} />
              </div>
              <input
                required
                disabled={isLoading}
                type="text"
                placeholder="NIP Pegawai"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                required
                disabled={isLoading}
                type="password"
                placeholder="Kata Sandi"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-5 text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center space-x-2 text-lg uppercase tracking-widest
              ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
            `}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={20} />
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-12 flex flex-col items-center space-y-4">
           <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 w-full">
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 text-center">Akun Demo</p>
             <div className="flex justify-between text-[10px] font-bold text-gray-500">
               <span>Admin: 123456 / admin</span>
               <span>Guru: 654321 / guru</span>
             </div>
           </div>
           <div className="flex items-center space-x-2 text-gray-300 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>Koneksi Terenkripsi AES-256</span>
           </div>
           <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
             © 2024 HADIR.IN SOLUTIONS
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
