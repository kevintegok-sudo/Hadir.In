
import React, { useState } from 'react';
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
  Target
} from 'lucide-react';
import { User, AttendanceRecord, JournalEntry, PermissionRequest, PermissionStatus, AppSettings } from '../types';

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
                className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2 px-4 shadow-lg shadow-green-100"
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
          <div className="p-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Location Configuration */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 text-blue-700">
                  <MapPin size={24} />
                  <h3 className="text-lg font-bold">Konfigurasi Geofence Sekolah</h3>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl space-y-4 border border-gray-100">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Label Lokasi</label>
                    <input 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={localSettings.schoolLocation.address}
                      onChange={(e) => setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, address: e.target.value}})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Latitude</label>
                      <input 
                        type="number" step="any"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none"
                        value={localSettings.schoolLocation.lat}
                        onChange={(e) => setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, lat: parseFloat(e.target.value)}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Longitude</label>
                      <input 
                        type="number" step="any"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none"
                        value={localSettings.schoolLocation.lng}
                        onChange={(e) => setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, lng: parseFloat(e.target.value)}})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-500 uppercase">Radius Presensi (Meter)</label>
                      <span className="text-blue-600 font-bold">{localSettings.schoolLocation.radius}m</span>
                    </div>
                    <input 
                      type="range" min="50" max="1000" step="50"
                      className="w-full accent-blue-600"
                      value={localSettings.schoolLocation.radius}
                      onChange={(e) => setLocalSettings({...localSettings, schoolLocation: {...localSettings.schoolLocation, radius: parseInt(e.target.value)}})}
                    />
                    <p className="text-[10px] text-gray-400 italic leading-relaxed">Peringatan: Radius kecil membutuhkan GPS dengan akurasi tinggi. Rekomendasi: 100-200m.</p>
                  </div>
                </div>
              </div>

              {/* Attendance Hours */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 text-blue-700">
                  <Clock size={24} />
                  <h3 className="text-lg font-bold">Jadwal Presensi Harian</h3>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl space-y-6 border border-gray-100">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-blue-600 uppercase flex items-center">
                      <Target size={14} className="mr-2"/> Jam Masuk (Hadir)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 uppercase">Mulai</label>
                        <input 
                          type="time" className="w-full p-3 rounded-xl border border-gray-200"
                          value={localSettings.attendanceHours.startIn}
                          onChange={(e) => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, startIn: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 uppercase">Batas Akhir</label>
                        <input 
                          type="time" className="w-full p-3 rounded-xl border border-gray-200"
                          value={localSettings.attendanceHours.endIn}
                          onChange={(e) => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, endIn: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-bold text-indigo-600 uppercase flex items-center">
                      <Target size={14} className="mr-2"/> Jam Keluar (Pulang)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 uppercase">Mulai</label>
                        <input 
                          type="time" className="w-full p-3 rounded-xl border border-gray-200"
                          value={localSettings.attendanceHours.startOut}
                          onChange={(e) => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, startOut: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 uppercase">Batas Akhir</label>
                        <input 
                          type="time" className="w-full p-3 rounded-xl border border-gray-200"
                          value={localSettings.attendanceHours.endOut}
                          onChange={(e) => setLocalSettings({...localSettings, attendanceHours: {...localSettings.attendanceHours, endOut: e.target.value}})}
                        />
                      </div>
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
