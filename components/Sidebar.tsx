
import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  BookOpen, 
  CalendarCheck, 
  ShieldCheck, 
  Menu,
  X
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, user }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Beranda', icon: <LayoutDashboard size={20} /> },
    { id: 'absen', label: 'Absensi', icon: <MapPin size={20} /> },
    { id: 'jurnal', label: 'Jurnal Harian', icon: <BookOpen size={20} /> },
    { id: 'izin', label: 'Permintaan Izin', icon: <CalendarCheck size={20} /> },
  ];

  if (user.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: <ShieldCheck size={20} /> });
  }

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <button 
        onClick={toggleSidebar}
        className="fixed bottom-6 right-6 z-50 md:hidden bg-blue-600 text-white p-4 rounded-2xl shadow-2xl"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 transform transition-transform duration-500 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="20,70 45,70 45,30 20,30" fill="#3B82F6" opacity="0.8" />
                  <polygon points="40,90 85,45 40,0" fill="#2563EB" />
                  <polygon points="20,40 50,40 50,15" fill="#60A5FA" />
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tighter text-[#2563EB]">Hadir.In</span>
            </div>
          </div>

          <nav className="flex-1 px-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300
                  ${activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 font-bold' 
                    : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600 font-bold'}
                `}
              >
                <span className={`${activeTab === item.id ? 'text-white' : 'text-blue-400'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6">
            <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] rounded-3xl p-6 text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white opacity-10 rounded-full blur-2xl"></div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Profil Pegawai</p>
              <p className="font-black text-lg truncate mb-1">{user.name}</p>
              <p className="text-[10px] font-bold opacity-60 truncate mb-4">{user.nip}</p>
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase">
                {user.role}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
