
import React from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  FileText,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { User, AttendanceRecord, JournalEntry, PermissionRequest, AppSettings } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface DashboardProps {
  user: User;
  attendance: AttendanceRecord[];
  journals: JournalEntry[];
  permissions: PermissionRequest[];
  settings: AppSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ user, attendance, journals, permissions, settings }) => {
  const today = new Date().toISOString().split('T')[0];
  const userAttendanceToday = attendance.filter(a => a.userId === user.id && a.timestamp.startsWith(today));
  const hasCheckedIn = userAttendanceToday.some(a => a.type === 'in');
  const hasCheckedOut = userAttendanceToday.some(a => a.type === 'out');

  const stats = [
    { label: 'Total Hadir', value: attendance.filter(a => a.type === 'in').length, icon: <CheckCircle2 className="text-green-500" />, color: 'bg-green-50' },
    { label: 'Jurnal Terisi', value: journals.filter(j => j.userId === user.id).length, icon: <FileText className="text-blue-500" />, color: 'bg-blue-50' },
    { label: 'Izin Disetujui', value: permissions.filter(p => p.userId === user.id && p.status === 'Approved').length, icon: <Users className="text-purple-500" />, color: 'bg-purple-50' },
    { label: 'Ketepatan Waktu', value: '92%', icon: <TrendingUp className="text-indigo-500" />, color: 'bg-indigo-50' },
  ];

  const chartData = [
    { name: 'Sen', hadir: 12, izin: 2 },
    { name: 'Sel', hadir: 15, izin: 0 },
    { name: 'Rab', hadir: 14, izin: 1 },
    { name: 'Kam', hadir: 13, izin: 2 },
    { name: 'Jum', hadir: 11, izin: 4 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Selamat Datang, {user.name.split(',')[0]}!</h2>
          <p className="text-gray-500">Hari ini adalah {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div className="flex items-center space-x-2 mt-4 justify-center md:justify-start">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${hasCheckedIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {hasCheckedIn ? 'Sudah Absen Masuk' : 'Belum Absen Masuk'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${hasCheckedOut ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
              {hasCheckedOut ? 'Sudah Absen Pulang' : 'Belum Absen Pulang'}
            </span>
          </div>
        </div>
        <div className="mt-6 md:mt-0 flex flex-col items-center">
          <div className="text-4xl font-black text-blue-600 mb-1">
            {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">Waktu Server Aktif</div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-100 flex items-center justify-between">
           <div className="space-y-1">
             <p className="text-[10px] font-bold uppercase opacity-70">Jadwal Presensi Masuk</p>
             <p className="text-xl font-black">{settings.attendanceHours.startIn} - {settings.attendanceHours.endIn} WIB</p>
           </div>
           <Clock size={32} className="opacity-30" />
        </div>
        <div className="bg-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-100 flex items-center justify-between">
           <div className="space-y-1">
             <p className="text-[10px] font-bold uppercase opacity-70">Titik Geofence Sekolah</p>
             <p className="text-lg font-bold truncate max-w-[200px]">{settings.schoolLocation.address}</p>
           </div>
           <MapPin size={32} className="opacity-30" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={`p-4 rounded-2xl border border-white shadow-sm flex flex-col space-y-2 ${stat.color}`}>
            <div className="p-2 bg-white rounded-xl w-fit">{stat.icon}</div>
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <TrendingUp size={18} className="mr-2 text-blue-600" />
            Statistik Kehadiran Sekolah
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="hadir" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="izin" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6">Aktivitas Terbaru</h3>
          <div className="space-y-6">
            {attendance.slice(-3).reverse().map((record, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className={`w-2 h-12 rounded-full ${record.type === 'in' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {record.userName} melakukan Absen {record.type === 'in' ? 'Masuk' : 'Pulang'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock size={12} className="mr-1" />
                    {new Date(record.timestamp).toLocaleTimeString('id-ID')} - {record.location.address}
                  </p>
                </div>
              </div>
            ))}
            {attendance.length === 0 && (
              <p className="text-center text-gray-400 py-8">Belum ada aktivitas hari ini.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
