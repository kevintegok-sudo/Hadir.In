
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
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
      <nav className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] shadow-2xl flex items-center justify-around p-2 pointer-events-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex flex-col items-center justify-center py-2 px-1 rounded-3xl transition-all duration-300 relative min-w-[60px]
              ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-gray-400'}
            `}
          >
            {activeTab === item.id && (
              <div className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
            )}
            <div className={`
              p-2 rounded-2xl transition-all
              ${activeTab === item.id ? 'bg-blue-50' : 'bg-transparent'}
            `}>
              {item.icon}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
