
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
  ArrowUpDown
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24}/></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Pegawai</p><p className="text-2xl font-black">{users.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><FileCheck size={24}/></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Hadir ({filterDate})</p><p className="text-2xl font-black">{attendance.filter(a => a.type === 'in' && a.timestamp.startsWith(filterDate)).length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24}/></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Izin Menunggu</p><p className="text-2xl font-black">{permissions.filter(p => p.status === PermissionStatus.PENDING).length}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-gray-50 p-1 rounded-2xl w-fit overflow-x-auto">
            {['attendance', 'permissions', 'users', 'journals', 'settings'].map(tab => (
              <button 
                key={tab} onClick={() => setActiveSubTab(tab as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${activeSubTab === tab ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400'}`}
              >
                {tab === 'attendance' ? 'Log Absen' : tab === 'permissions' ? 'Izin' : tab === 'users' ? 'Manajemen User' : tab === 'journals' ? 'Jurnal' : 'Pengaturan'}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            {(activeSubTab === 'attendance' || activeSubTab === 'journals') && (
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 group-hover:scale-110 transition-transform" size={16} />
                <input 
                  type="date" 
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500 w-40"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" placeholder="Cari..."
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeSubTab === 'attendance' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5">Nama Pegawai / Guru</th>
                  <th className="px-6 py-5">Waktu & Tipe</th>
                  <th className="px-6 py-5">Keterangan</th>
                  <th className="px-6 py-5">Bukti Foto</th>
                  <th className="px-6 py-5">Aksi</th>
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
                          <img src={record.photo} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ExternalLink size={14} className="text-white"/></div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all"><MapPin size={16}/></button>
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
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Catatan Admin/Guru</p>
                        <p className="text-xs text-gray-500 italic">"{j.notes}"</p>
                      </div>
                    )}
                  </div>
               ))}
               {filteredJournals.length === 0 && (
                  <div className="col-span-2 py-20 text-center text-gray-400 font-bold bg-gray-50 rounded-[2rem]">Belum ada jurnal yang diinput pada tanggal ini.</div>
               )}
            </div>
          )}

          {activeSubTab === 'users' && (
            <table className="w-full text-left">
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
                        <div className="w-9 h-9 rounded-2xl bg-gray-100 overflow-hidden border border-white shadow-sm">
                          <img src={u.avatar} alt={u.name} />
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
                      <button onClick={() => { if(confirm('Hapus user ini?')) onDeleteUser(u.id); }} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Settings Section (Condensed) */}
          {activeSubTab === 'settings' && (
             <div className="p-8 space-y-8 animate-in fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7">
                    <div ref={settingsMapRef} className="bg-gray-100 rounded-[2rem] h-[400px] border-4 border-white shadow-xl"></div>
                  </div>
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Geofence & Jam Kerja</h4>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase">Radius (Meter)</label>
                          <input type="range" min="50" max="1000" step="50" className="w-full accent-blue-600" value={localSettings.schoolLocation.radius} onChange={e => setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, radius: parseInt(e.target.value)}})} />
                          <p className="text-right text-[10px] font-black text-blue-600">{localSettings.schoolLocation.radius} m</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Maks Masuk</label>
                              <input type="time" className="w-full p-3 bg-gray-50 rounded-xl text-xs font-black" value={localSettings.attendanceHours.endIn} onChange={e => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, endIn: e.target.value}})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Min Pulang</label>
                              <input type="time" className="w-full p-3 bg-gray-50 rounded-xl text-xs font-black" value={localSettings.attendanceHours.startOut} onChange={e => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, startOut: e.target.value}})} />
                           </div>
                        </div>
                      </div>
                      <button onClick={() => { onUpdateSettings(localSettings); alert('Disimpan!'); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100">Simpan Perubahan</button>
                    </div>
                  </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
