
import React from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  FileText,
  TrendingUp,
  MapPin,
  AlertCircle,
  ArrowRight,
  BookMarked
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
  const timeNow = new Date().toTimeString().slice(0, 5);
  
  const userAttendanceToday = attendance.filter(a => a.userId === user.id && a.timestamp.startsWith(today));
  const hasCheckedIn = userAttendanceToday.some(a => a.type === 'in');
  const hasCheckedOut = userAttendanceToday.some(a => a.type === 'out');
  const hasJournalToday = journals.some(j => j.userId === user.id && j.date === today);

  // Reminders Logic
  const reminders = [];
  
  if (!hasCheckedIn) {
    const isLate = timeNow > settings.attendanceHours.endIn;
    reminders.push({
      id: 'absen-masuk',
      title: isLate ? 'Peringatan: Terlambat' : 'Absen Masuk Sekarang',
      desc: isLate ? `Batas absen pukul ${settings.attendanceHours.endIn}. Segera lakukan presensi!` : `Sesi masuk aktif hingga ${settings.attendanceHours.endIn} WIB.`,
      icon: <Clock className={isLate ? 'text-red-500' : 'text-blue-500'} />,
      color: isLate ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100',
      action: 'absen'
    });
  } else if (!hasJournalToday && user.role === 'guru') {
    reminders.push({
      id: 'isi-jurnal',
      title: 'Lengkapi Jurnal Harian',
      desc: 'Anda sudah hadir, jangan lupa mengisi jurnal aktivitas mengajar hari ini.',
      icon: <BookMarked className="text-indigo-500" />,
      color: 'bg-indigo-50 border-indigo-100',
      action: 'jurnal'
    });
  }

  if (hasCheckedIn && !hasCheckedOut && timeNow >= settings.attendanceHours.startOut) {
    reminders.push({
      id: 'absen-pulang',
      title: 'Waktunya Absen Pulang',
      desc: `Sesi pulang sudah dibuka sejak pukul ${settings.attendanceHours.startOut}. Hati-hati di jalan!`,
      icon: <CheckCircle2 className="text-green-500" />,
      color: 'bg-green-50 border-green-100',
      action: 'absen'
    });
  }

  const stats = [
    { label: 'Total Hadir', value: attendance.filter(a => a.type === 'in' && a.userId === user.id).length, icon: <CheckCircle2 className="text-green-500" />, color: 'bg-green-50' },
    { label: 'Jurnal Terisi', value: journals.filter(j => j.userId === user.id).length, icon: <FileText className="text-blue-500" />, color: 'bg-blue-50' },
    { label: 'Izin Disetujui', value: permissions.filter(p => p.userId === user.id && p.status === 'Approved').length, icon: <Users className="text-purple-500" />, color: 'bg-purple-50' },
    { label: 'Ketepatan Waktu', value: '94%', icon: <TrendingUp className="text-indigo-500" />, color: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter">Halo, {user.name.split(',')[0]}!</h2>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <div className="flex items-center space-x-2 mt-4 justify-center md:justify-start">
            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${hasCheckedIn ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {hasCheckedIn ? 'Hadir' : 'Belum Absen'}
            </span>
            {hasCheckedOut && (
              <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 bg-indigo-50 text-indigo-600 border-indigo-100">
                Pulang
              </span>
            )}
          </div>
        </div>
        <div className="mt-8 md:mt-0 text-center md:text-right">
          <div className="text-5xl font-black text-blue-600 tracking-tighter">
            {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em] mt-1">Waktu Server Aktif</p>
        </div>
      </section>

      {/* Smart Reminders Section */}
      {reminders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Tugas Hari Ini</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map(rem => (
              <div key={rem.id} className={`${rem.color} p-6 rounded-[2rem] border-2 flex items-start space-x-4 animate-in slide-in-from-left duration-500`}>
                 <div className="p-3 bg-white rounded-2xl shadow-sm">{rem.icon}</div>
                 <div className="flex-1">
                   <p className="font-black text-gray-800 text-sm">{rem.title}</p>
                   <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">{rem.desc}</p>
                 </div>
                 <ArrowRight size={18} className="text-gray-300 self-center" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`p-5 rounded-[2rem] border border-white shadow-sm flex flex-col space-y-2 ${stat.color}`}>
            <div className="p-2.5 bg-white rounded-xl w-fit shadow-sm">{stat.icon}</div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-black text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center text-gray-400">
            <TrendingUp size={16} className="mr-2 text-blue-600" />
            Statistik Kehadiran
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Sen', hadir: 12 }, { name: 'Sel', hadir: 15 }, { name: 'Rab', hadir: 14 }, { name: 'Kam', hadir: 13 }, { name: 'Jum', hadir: 11 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="hadir" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-gray-400">Aktivitas Terkini</h3>
          <div className="space-y-6">
            {attendance.filter(a => a.userId === user.id).slice(-3).reverse().map((record, i) => (
              <div key={i} className="flex items-start space-x-4 group">
                <div className={`w-1.5 h-12 rounded-full shrink-0 transition-all group-hover:scale-y-110 ${record.type === 'in' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`} />
                <div>
                  <p className="text-sm font-black text-gray-800">
                    Absen {record.type === 'in' ? 'Masuk' : 'Pulang'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold flex items-center mt-1 uppercase">
                    <Clock size={12} className="mr-1" />
                    {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {record.location.address.slice(0, 30)}...
                  </p>
                </div>
              </div>
            ))}
            {attendance.filter(a => a.userId === user.id).length === 0 && (
              <div className="py-10 text-center">
                 <AlertCircle size={32} className="mx-auto text-gray-100 mb-2" />
                 <p className="text-[10px] font-black text-gray-300 uppercase">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
