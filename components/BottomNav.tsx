
import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  BookOpen, 
  CalendarCheck, 
  ShieldCheck
} from 'lucide-react';
import { User } from '../types';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, user }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Beranda', icon: <LayoutDashboard size={22} /> },
    { id: 'absen', label: 'Absensi', icon: <MapPin size={22} /> },
    { id: 'jurnal', label: 'Jurnal', icon: <BookOpen size={22} /> },
    { id: 'izin', label: 'Izin', icon: <CalendarCheck size={22} /> },
  ];

  if (user.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin', icon: <ShieldCheck size={22} /> });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-2 pointer-events-none safe-area-bottom">
      <nav className="max-w-md mx-auto bg-white/90 backdrop-blur-2xl border border-gray-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(37,99,235,0.15)] flex items-center justify-around p-2 pointer-events-auto ring-1 ring-black/5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex flex-col items-center justify-center py-2 px-1 rounded-3xl transition-all duration-300 relative min-w-[64px]
              ${activeTab === item.id ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}
            `}
          >
            <div className={`
              p-2.5 rounded-2xl transition-all duration-300
              ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-transparent'}
            `}>
              {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
            </div>
            <span className={`
              text-[9px] font-black uppercase tracking-tighter mt-1.5 transition-all duration-300
              ${activeTab === item.id ? 'opacity-100 transform translate-y-0' : 'opacity-40 transform translate-y-0.5'}
            `}>
              {item.label}
            </span>
            {activeTab === item.id && (
              <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
