
import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  FileCheck, 
  Download, 
  Search,
  Check,
  X,
  ExternalLink,
  Clock,
  UserPlus,
  Trash2,
  Shield,
  GraduationCap,
  Briefcase,
  Settings,
  Save,
  Target,
  Navigation,
  Info,
  Calendar,
  Filter,
  ArrowUpDown,
  ChevronRight
} from 'lucide-react';
import { User, AttendanceRecord, JournalEntry, PermissionRequest, PermissionStatus, AppSettings } from '../types';

declare var L: any;

interface AdminDashboardProps {
  users: User[];
  attendance: AttendanceRecord[];
  journals: JournalEntry[];
  permissions: PermissionRequest[];
  settings: AppSettings;
  onUpdatePermission: (id: string, status: PermissionStatus) => void;
  onRegisterUser: (newUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  users, 
  attendance, 
  journals, 
  permissions, 
  settings,
  onUpdatePermission,
  onRegisterUser,
  onDeleteUser,
  onUpdateSettings
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'permissions' | 'users' | 'journals' | 'settings'>('attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [showRegForm, setShowRegForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '', nip: '', role: 'guru' as 'guru' | 'pegawai' | 'admin', password: ''
  });

  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const settingsMapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const radiusCircle = useRef<any>(null);
  const schoolMarker = useRef<any>(null);

  useEffect(() => {
    if (activeSubTab === 'settings' && settingsMapRef.current) {
      setTimeout(initSettingsMap, 100);
    }
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [activeSubTab]);

  const initSettingsMap = () => {
    if (!settingsMapRef.current || leafletMap.current) return;
    leafletMap.current = L.map(settingsMapRef.current, { zoomControl: true, attributionControl: false }).setView([localSettings.schoolLocation.lat, localSettings.schoolLocation.lng], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 }).addTo(leafletMap.current);
    schoolMarker.current = L.marker([localSettings.schoolLocation.lat, localSettings.schoolLocation.lng], { draggable: true, icon: L.divIcon({ className: 'admin-marker', html: `<div style="background-color:#2563eb; width:24px; height:24px; border-radius:50%; border:4px solid white; box-shadow:0 0 15px rgba(37,99,235,0.4);"></div>`, iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(leafletMap.current);
    radiusCircle.current = L.circle([localSettings.schoolLocation.lat, localSettings.schoolLocation.lng], { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, radius: localSettings.schoolLocation.radius }).addTo(leafletMap.current);
    schoolMarker.current.on('drag', (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      radiusCircle.current.setLatLng([lat, lng]);
      setLocalSettings(prev => ({ ...prev, schoolLocation: { ...prev.schoolLocation, lat, lng } }));
    });
  };

  const checkPunctuality = (timestamp: string, type: 'in' | 'out') => {
    const time = new Date(timestamp).toTimeString().slice(0, 5);
    if (type === 'in') {
      return time <= settings.attendanceHours.endIn ? 'Tepat Waktu' : 'Terlambat';
    } else {
      return time >= settings.attendanceHours.startOut ? 'Tepat Waktu' : 'Pulang Awal';
    }
  };

  const filteredAttendance = attendance.filter(a => {
    const matchesSearch = a.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = a.timestamp.startsWith(filterDate);
    return matchesSearch && matchesDate;
  });

  const filteredJournals = journals.filter(j => {
    const userName = users.find(u => u.id === j.userId)?.name || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) || j.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = j.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.nip.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    onRegisterUser({ id: Math.random().toString(36).substr(2, 9), avatar: `https://picsum.photos/seed/${newUserData.nip}/200`, ...newUserData });
    setShowRegForm(false);
    setNewUserData({ name: '', nip: '', role: 'guru', password: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24}/></div>
          <div><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Pegawai</p><p className="text-2xl font-black">{users.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><FileCheck size={24}/></div>
          <div><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hadir ({filterDate})</p><p className="text-2xl font-black">{attendance.filter(a => a.type === 'in' && a.timestamp.startsWith(filterDate)).length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24}/></div>
          <div><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Izin Menunggu</p><p className="text-2xl font-black">{permissions.filter(p => p.status === PermissionStatus.PENDING).length}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Navigation Bar - Fixed for better scrolling */}
        <div className="p-4 border-b border-gray-100 space-y-4">
          <div className="relative group">
            {/* Horizontal Scroll Menu with gradient indicator */}
            <div className="overflow-x-auto no-scrollbar scroll-smooth flex space-x-2 pb-2 px-2 -mx-2">
              {[
                { id: 'attendance', label: 'Log Absen' },
                { id: 'permissions', label: 'Izin' },
                { id: 'users', label: 'Manajemen User' },
                { id: 'journals', label: 'Jurnal' },
                { id: 'settings', label: 'Pengaturan' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`
                    px-6 py-3 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-[0.15em] flex-shrink-0 border-2
                    ${activeSubTab === tab.id 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                      : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Scroll Indicator Icon */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-white via-white/80 to-transparent pl-8 pointer-events-none md:hidden h-full flex items-center pr-2">
               <ChevronRight size={16} className="text-blue-300 animate-pulse" />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {(activeSubTab === 'attendance' || activeSubTab === 'journals') && (
              <div className="relative w-full sm:w-auto flex-shrink-0">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                <input 
                  type="date" 
                  className="w-full sm:w-auto pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            )}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" placeholder="Cari nama atau NIP..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content Section with easy horizontal scroll for tables */}
        <div className="relative">
          <div className="overflow-x-auto no-scrollbar scroll-smooth">
            {activeSubTab === 'attendance' && (
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5">Nama Pegawai / Guru</th>
                    <th className="px-6 py-5">Waktu & Tipe</th>
                    <th className="px-6 py-5">Keterangan</th>
                    <th className="px-6 py-5">Bukti Foto</th>
                    <th className="px-6 py-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAttendance.slice().reverse().map(record => {
                    const status = checkPunctuality(record.timestamp, record.type);
                    return (
                      <tr key={record.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-sm font-black text-gray-800">{record.userName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{users.find(u => u.id === record.userId)?.nip}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${record.type === 'in' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                              {record.type === 'in' ? 'Masuk' : 'Pulang'}
                            </span>
                            <p className="text-xs font-bold text-gray-600">{new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} WIB</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${status === 'Tepat Waktu' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                             {status}
                           </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-white shadow-sm hover:scale-150 transition-transform cursor-pointer relative group">
                            <img src={record.photo} className="w-full h-full object-cover" alt="Absensi" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ExternalLink size={14} className="text-white"/></div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-white rounded-2xl border border-transparent hover:border-gray-100 transition-all"><MapPin size={18}/></button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAttendance.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold">Tidak ada data absensi untuk filter ini.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeSubTab === 'journals' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJournals.slice().reverse().map(j => (
                    <div key={j.id} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-4 hover:border-blue-200 transition-all group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm"><FileCheck size={20}/></div>
                            <div>
                              <p className="text-sm font-black text-gray-800">{users.find(u => u.id === j.userId)?.name}</p>
                              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{j.subject} • {j.className}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black bg-white border border-gray-100 px-3 py-1 rounded-full text-gray-400">{j.date}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Materi Diajarkan</p>
                        <p className="text-sm font-bold text-gray-700 leading-relaxed bg-white p-3 rounded-2xl border border-gray-100">{j.material}</p>
                      </div>
                      {j.notes && (
                        <div className="pt-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Catatan</p>
                          <p className="text-xs text-gray-500 italic">"{j.notes}"</p>
                        </div>
                      )}
                    </div>
                ))}
                {filteredJournals.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 font-bold bg-gray-50 rounded-[2rem]">Belum ada jurnal yang diinput pada tanggal ini.</div>
                )}
              </div>
            )}

            {activeSubTab === 'users' && (
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5">Pegawai</th>
                    <th className="px-6 py-5">NIP / ID</th>
                    <th className="px-6 py-5">Peran</th>
                    <th className="px-6 py-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-gray-100 overflow-hidden border border-white shadow-sm">
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-sm font-black text-gray-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-mono font-bold text-gray-500">{u.nip}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          {u.role === 'admin' ? <Shield size={14} className="text-red-500" /> : u.role === 'guru' ? <GraduationCap size={14} className="text-blue-600" /> : <Briefcase size={14} className="text-gray-600" />}
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{u.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => { if(confirm('Hapus user ini?')) onDeleteUser(u.id); }} className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeSubTab === 'permissions' && (
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5">Pemohon</th>
                    <th className="px-6 py-5">Jenis & Durasi</th>
                    <th className="px-6 py-5">Alasan</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {permissions.slice().reverse().map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-gray-800">{p.userName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{p.type}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-600">{new Date(p.dateStart).toLocaleDateString('id-ID')} - {new Date(p.dateEnd).toLocaleDateString('id-ID')}</p>
                          <p className="text-[9px] text-blue-500 font-black uppercase">Aktif</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs text-gray-500 max-w-xs truncate italic">"{p.reason}"</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border-2
                          ${p.status === PermissionStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            p.status === PermissionStatus.APPROVED ? 'bg-green-50 text-green-600 border-green-100' : 
                            'bg-red-50 text-red-600 border-red-100'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {p.status === PermissionStatus.PENDING ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => onUpdatePermission(p.id, PermissionStatus.APPROVED)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all border border-transparent hover:border-green-100"><Check size={18}/></button>
                            <button onClick={() => onUpdatePermission(p.id, PermissionStatus.REJECTED)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"><X size={18}/></button>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-gray-300 uppercase">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {permissions.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold">Belum ada pengajuan izin.</td></tr>
                  )}
                </tbody>
              </table>
            )}
            
            {activeSubTab === 'settings' && (
              <div className="p-6 md:p-8 space-y-8 animate-in fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7">
                      <div ref={settingsMapRef} className="bg-gray-100 rounded-[2.5rem] h-[350px] border-4 border-white shadow-xl z-10"></div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3">
                        <Info size={20} className="text-blue-500 mt-0.5" />
                        <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed tracking-wider">
                          Geser marker biru pada peta untuk memindahkan titik koordinat utama sekolah.
                        </p>
                      </div>
                    </div>
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center space-x-3 text-blue-600">
                          <Settings size={20} />
                          <h4 className="text-xs font-black uppercase tracking-widest">Konfigurasi Sistem</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Radius Geofence</label>
                              <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg">{localSettings.schoolLocation.radius} Meter</span>
                            </div>
                            <input 
                              type="range" min="50" max="1000" step="50" 
                              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                              value={localSettings.schoolLocation.radius} 
                              onChange={e => setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, radius: parseInt(e.target.value)}})} 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Batas Masuk</label>
                                <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black border border-transparent focus:border-blue-500 outline-none" value={localSettings.attendanceHours.endIn} onChange={e => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, endIn: e.target.value}})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Awal Pulang</label>
                                <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black border border-transparent focus:border-blue-500 outline-none" value={localSettings.attendanceHours.startOut} onChange={e => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, startOut: e.target.value}})} />
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => { onUpdateSettings(localSettings); alert('Konfigurasi berhasil disimpan!'); }} 
                          className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all"
                        >
                          Simpan Konfigurasi
                        </button>
                      </div>
                    </div>
                  </div>
              </div>
            )}
          </div>
          
          {/* Visual indicators for scrollable tables */}
          {(activeSubTab === 'attendance' || activeSubTab === 'users' || activeSubTab === 'permissions') && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/50 to-transparent pointer-events-none md:hidden" />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
