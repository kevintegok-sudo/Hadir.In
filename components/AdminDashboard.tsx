
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
  Info
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
  
  const [showRegForm, setShowRegForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    nip: '',
    role: 'guru' as 'guru' | 'pegawai' | 'admin',
    password: ''
  });

  // Settings Local State
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  
  // Map Refs for Settings
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

    leafletMap.current = L.map(settingsMapRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([localSettings.schoolLocation.lat, localSettings.schoolLocation.lng], 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(leafletMap.current);

    schoolMarker.current = L.marker([localSettings.schoolLocation.lat, localSettings.schoolLocation.lng], {
      draggable: true,
      icon: L.divIcon({
        className: 'admin-marker',
        html: `<div style="background-color:#2563eb; width:24px; height:24px; border-radius:50%; border:4px solid white; box-shadow:0 0 15px rgba(37,99,235,0.4);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(leafletMap.current);

    radiusCircle.current = L.circle([localSettings.schoolLocation.lat, localSettings.schoolLocation.lng], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      radius: localSettings.schoolLocation.radius
    }).addTo(leafletMap.current);

    // Event: Marker dragged
    schoolMarker.current.on('drag', (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      radiusCircle.current.setLatLng([lat, lng]);
      setLocalSettings(prev => ({
        ...prev,
        schoolLocation: { ...prev.schoolLocation, lat, lng }
      }));
    });

    // Event: Map clicked
    leafletMap.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      schoolMarker.current.setLatLng([lat, lng]);
      radiusCircle.current.setLatLng([lat, lng]);
      setLocalSettings(prev => ({
        ...prev,
        schoolLocation: { ...prev.schoolLocation, lat, lng }
      }));
    });
  };

  // Sync circle radius visually
  useEffect(() => {
    if (radiusCircle.current) {
      radiusCircle.current.setRadius(localSettings.schoolLocation.radius);
    }
  }, [localSettings.schoolLocation.radius]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocalSettings(prev => ({
          ...prev,
          schoolLocation: { ...prev.schoolLocation, lat, lng }
        }));
        if (schoolMarker.current) {
          schoolMarker.current.setLatLng([lat, lng]);
          radiusCircle.current.setLatLng([lat, lng]);
          leafletMap.current?.panTo([lat, lng]);
        }
      });
    }
  };

  const filteredAttendance = attendance.filter(a => 
    a.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingPermissions = permissions.filter(p => p.status === PermissionStatus.PENDING);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.nip === newUserData.nip)) {
      alert('NIP sudah terdaftar!');
      return;
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      avatar: `https://picsum.photos/seed/${newUserData.nip}/200`,
      ...newUserData
    };
    onRegisterUser(newUser);
    setShowRegForm(false);
    setNewUserData({ name: '', nip: '', role: 'guru', password: '' });
    setActiveSubTab('users');
  };

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    alert('Pengaturan berhasil disimpan!');
  };

  const exportData = () => {
    alert('Fungsi Export ke Excel/PDF sedang diproses ke server...');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24}/></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Pegawai</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><FileCheck size={24}/></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Hadir Hari Ini</p>
            <p className="text-2xl font-bold">{attendance.filter(a => a.type === 'in' && a.timestamp.startsWith(new Date().toISOString().split('T')[0])).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24}/></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Izin Pending</p>
            <p className="text-2xl font-bold">{pendingPermissions.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
            {[
              { id: 'attendance', label: 'Log Absensi' },
              { id: 'permissions', label: 'Persetujuan Izin' },
              { id: 'users', label: 'Manajemen User' },
              { id: 'journals', label: 'Rekap Jurnal' },
              { id: 'settings', label: 'Pengaturan' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            {activeSubTab !== 'settings' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari..."
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            {activeSubTab === 'users' && (
              <button 
                onClick={() => setShowRegForm(!showRegForm)}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 px-4 shadow-lg shadow-blue-100"
              >
                <UserPlus size={18} />
                <span className="text-sm font-bold hidden md:inline">Tambah Akun</span>
              </button>
            )}
            {activeSubTab === 'settings' && (
              <button 
                onClick={handleSaveSettings}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 px-4 shadow-lg shadow-blue-100"
              >
                <Save size={18} />
                <span className="text-sm font-bold">Simpan Pengaturan</span>
              </button>
            )}
            <button 
              onClick={exportData}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-100 flex items-center space-x-2 px-4"
            >
              <Download size={18} />
              <span className="text-sm font-bold hidden md:inline">Rekap</span>
            </button>
          </div>
        </div>

        {/* User Registration Form */}
        {showRegForm && activeSubTab === 'users' && (
          <div className="p-6 bg-blue-50/50 border-b border-gray-100 animate-in slide-in-from-top duration-300">
            <h3 className="font-bold text-blue-800 mb-4 flex items-center">
              <UserPlus size={18} className="mr-2" />
              Registrasi Akun Guru / Pegawai Baru
            </h3>
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                <input required placeholder="Nama & Gelar" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={newUserData.name} onChange={(e) => setNewUserData({...newUserData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">NIP / ID Login</label>
                <input required placeholder="Nomor Induk" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={newUserData.nip} onChange={(e) => setNewUserData({...newUserData, nip: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Peran / Role</label>
                <select className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={newUserData.role} onChange={(e) => setNewUserData({...newUserData, role: e.target.value as any})}>
                  <option value="guru">Guru</option>
                  <option value="pegawai">Pegawai</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Password</label>
                <input required type="password" placeholder="Password Awal" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})} />
              </div>
              <div className="md:col-span-4 flex justify-end space-x-2 mt-2">
                <button type="button" onClick={() => setShowRegForm(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-white rounded-lg">Batal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-blue-700">Simpan Akun</button>
              </div>
            </form>
          </div>
        )}

        {/* Settings View */}
        {activeSubTab === 'settings' && (
          <div className="p-6 md:p-8 animate-in fade-in duration-500 space-y-10">
            {/* Main Section: Map and Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center">
                    <MapPin className="mr-2 text-blue-600" size={24} />
                    Tentukan Titik Sekolah
                  </h3>
                  <button 
                    onClick={getCurrentLocation}
                    className="flex items-center space-x-2 text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all uppercase tracking-wider"
                  >
                    <Navigation size={14} />
                    <span>Gunakan Lokasi Saya</span>
                  </button>
                </div>
                
                <div className="bg-gray-100 rounded-[2rem] h-[400px] md:h-[500px] overflow-hidden border-4 border-white shadow-xl relative group">
                  <div ref={settingsMapRef} className="w-full h-full z-0"></div>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full px-8 pointer-events-none">
                     <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-white flex items-center justify-center space-x-3 pointer-events-auto">
                        <Info size={16} className="text-blue-600" />
                        <span className="text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">Klik pada peta atau geser marker untuk memindahkan lokasi sekolah</span>
                     </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-8">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Detail Lokasi & Geofence</h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Nama Lokasi Presensi</label>
                    <input 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all"
                      placeholder="Contoh: Gedung Utama SMK Negeri 1"
                      value={localSettings.schoolLocation.address}
                      onChange={(e) => setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, address: e.target.value}})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Latitude</label>
                      <input 
                        type="number" step="any"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-sm"
                        value={localSettings.schoolLocation.lat}
                        onChange={(e) => {
                           const lat = parseFloat(e.target.value);
                           setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, lat}});
                           if (schoolMarker.current) schoolMarker.current.setLatLng([lat, localSettings.schoolLocation.lng]);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Longitude</label>
                      <input 
                        type="number" step="any"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-sm"
                        value={localSettings.schoolLocation.lng}
                        onChange={(e) => {
                           const lng = parseFloat(e.target.value);
                           setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, lng}});
                           if (schoolMarker.current) schoolMarker.current.setLatLng([localSettings.schoolLocation.lat, lng]);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Radius Izin Absen</label>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-black">{localSettings.schoolLocation.radius} Meter</span>
                    </div>
                    <input 
                      type="range" min="50" max="1000" step="50"
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      value={localSettings.schoolLocation.radius}
                      onChange={(e) => setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, radius: parseInt(e.target.value)}})}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                       <span>AKURASI TINGGI (50m)</span>
                       <span>KOMPLEKS BESAR (1km)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100 space-y-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-20">
                      <Shield size={64} />
                   </div>
                   <h4 className="text-sm font-black uppercase tracking-widest opacity-70">Sistem Keamanan</h4>
                   <p className="text-sm font-medium leading-relaxed">Sistem Geofencing kami menggunakan koordinat satelit real-time. Pastikan marker peta tepat berada di tengah gedung sekolah untuk meminimalisir kesalahan absensi oleh guru.</p>
                </div>
              </div>
            </div>

            {/* Attendance Hours Section */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
               <div className="flex items-center space-x-3 text-gray-800 mb-8">
                  <Clock size={24} className="text-blue-600" />
                  <h3 className="text-xl font-black tracking-tight">Pengaturan Jadwal Kerja</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sesi Masuk (Hadir)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase">Buka Absen</label>
                        <input 
                          type="time" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                          value={localSettings.attendanceHours.startIn}
                          onChange={(e) => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, startIn: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase">Tutup Absen</label>
                        <input 
                          type="time" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                          value={localSettings.attendanceHours.endIn}
                          onChange={(e) => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, endIn: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sesi Pulang</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase">Buka Absen</label>
                        <input 
                          type="time" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                          value={localSettings.attendanceHours.startOut}
                          onChange={(e) => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, startOut: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase">Tutup Absen</label>
                        <input 
                          type="time" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                          value={localSettings.attendanceHours.endOut}
                          onChange={(e) => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, endOut: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Data Tables */}
        <div className="overflow-x-auto">
          {activeSubTab === 'attendance' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nama / Waktu</th>
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4">Foto Bukti</th>
                  <th className="px-6 py-4">Lokasi & Koordinat</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttendance.slice().reverse().map(record => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800">{record.userName}</p>
                      <p className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${record.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {record.type === 'in' ? 'Masuk' : 'Pulang'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden border border-gray-100">
                        <img src={record.photo} className="w-full h-full object-cover hover:scale-150 transition-transform cursor-pointer" alt="Selfie" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-2 max-w-xs">
                        <MapPin size={14} className="text-blue-600 mt-1 shrink-0" />
                        <span className="text-xs text-gray-600">{record.location.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-blue-600 cursor-pointer"><ExternalLink size={16}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSubTab === 'permissions' && (
            <table className="w-full text-left">
               <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Pengaju</th>
                  <th className="px-6 py-4">Jenis & Alasan</th>
                  <th className="px-6 py-4">Periode</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permissions.slice().reverse().map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 font-bold text-sm text-gray-800">{req.userName}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold">{req.type}</p>
                      <p className="text-xs text-gray-500 max-w-xs truncate italic">"{req.reason}"</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                      {new Date(req.dateStart).toLocaleDateString('id-ID')} - {new Date(req.dateEnd).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 uppercase text-[10px] font-black">{req.status}</td>
                    <td className="px-6 py-4">
                      {req.status === PermissionStatus.PENDING ? (
                        <div className="flex space-x-2">
                          <button onClick={() => onUpdatePermission(req.id, PermissionStatus.APPROVED)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={16} /></button>
                          <button onClick={() => onUpdatePermission(req.id, PermissionStatus.REJECTED)} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><X size={16} /></button>
                        </div>
                      ) : <span className="text-xs text-gray-400 italic">Selesai</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSubTab === 'users' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Pegawai</th>
                  <th className="px-6 py-4">NIP / ID</th>
                  <th className="px-6 py-4">Peran</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                          <img src={u.avatar} alt={u.name} />
                        </div>
                        <span className="text-sm font-bold text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{u.nip}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {u.role === 'admin' ? <Shield size={14} className="text-red-500" /> : u.role === 'guru' ? <GraduationCap size={14} className="text-blue-600" /> : <Briefcase size={14} className="text-gray-600" />}
                        <span className="text-xs font-bold uppercase text-gray-500">{u.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => { if(confirm('Hapus user ini?')) onDeleteUser(u.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSubTab === 'journals' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Guru</th>
                  <th className="px-6 py-4">Mapel / Kelas</th>
                  <th className="px-6 py-4">Materi</th>
                  <th className="px-6 py-4">Catatan</th>
                  <th className="px-6 py-4">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {journals.slice().reverse().map(j => (
                  <tr key={j.id}>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{users.find(u => u.id === j.userId)?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold">{j.subject}</p>
                      <p className="text-xs text-blue-600">{j.className}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{j.material}</td>
                    <td className="px-6 py-4 text-xs text-gray-400 italic">"{j.notes}"</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-400">{j.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
