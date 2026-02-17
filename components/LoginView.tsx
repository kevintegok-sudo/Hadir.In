
import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, User as UserIcon, Lock, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (nip: string, pass: string) => boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(nip, password);
    if (!success) {
      setError('NIP atau Password salah.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-10">
        <div className="text-center mb-12">
          {/* Custom Arrow Logo Matching Image */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
               {/* Arrow Icon Composition */}
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                 <polygon points="20,70 45,70 45,30 20,30" fill="#3B82F6" opacity="0.8" />
                 <polygon points="40,90 85,45 40,0" fill="#2563EB" />
                 <polygon points="20,40 50,40 50,15" fill="#60A5FA" />
               </svg>
            </div>
          </div>
          <h1 className="text-5xl font-black text-[#2563EB] tracking-tighter mb-1">Hadir.In<span className="text-[10px] align-top">TM</span></h1>
          <p className="text-[#3B82F6] text-sm font-semibold tracking-wide">Jangan Lupa Absen Hari ini</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                <UserIcon size={18} />
              </div>
              <input
                required
                type="text"
                placeholder="ID / NIP Pegawai"
                className="w-full pl-12 pr-4 py-4 bg-blue-50/50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                <Lock size={18} />
              </div>
              <input
                required
                type="password"
                placeholder="Password"
                className="w-full pl-12 pr-4 py-4 bg-blue-50/50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center space-x-2 text-lg"
          >
            <LogIn size={20} />
            <span>MASUK</span>
          </button>
        </form>

        <div className="mt-12 text-center">
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
             EduAttend Pro System v2.5
           </p>
           <div className="mt-4 inline-block px-4 py-1 bg-gray-50 rounded-full text-[9px] text-gray-400 font-mono">
             admin / admin
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
