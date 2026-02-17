
import React, { useState } from 'react';
import { User, PermissionRequest, PermissionStatus } from '../types';
import { Calendar, FileText, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface PermissionViewProps {
  user: User;
  onSubmit: (req: PermissionRequest) => void;
  requests: PermissionRequest[];
}

const PermissionView: React.FC<PermissionViewProps> = ({ user, onSubmit, requests }) => {
  const [formData, setFormData] = useState({
    type: 'Sakit' as 'Sakit' | 'Cuti' | 'Dinas',
    dateStart: '',
    dateEnd: '',
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req: PermissionRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      status: PermissionStatus.PENDING,
      ...formData
    };
    onSubmit(req);
    setFormData({ type: 'Sakit', dateStart: '', dateEnd: '', reason: '' });
  };

  const myRequests = requests.filter(r => r.userId === user.id);

  const getStatusBadge = (status: PermissionStatus) => {
    switch (status) {
      case PermissionStatus.PENDING: return <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-full text-xs font-bold border border-amber-100 flex items-center"><Clock size={12} className="mr-1"/> Menunggu</span>;
      case PermissionStatus.APPROVED: return <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs font-bold border border-green-100 flex items-center"><CheckCircle2 size={12} className="mr-1"/> Disetujui</span>;
      case PermissionStatus.REJECTED: return <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-bold border border-red-100 flex items-center"><XCircle size={12} className="mr-1"/> Ditolak</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 flex items-center">
             <Send size={18} className="mr-2 text-indigo-600" />
             Ajukan Izin Baru
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Jenis Izin</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="Sakit">Sakit</option>
                <option value="Cuti">Cuti Tahunan</option>
                <option value="Dinas">Dinas Luar</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Mulai</label>
                <input 
                  type="date"
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={formData.dateStart}
                  onChange={(e) => setFormData({...formData, dateStart: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Selesai</label>
                <input 
                  type="date"
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={formData.dateEnd}
                  onChange={(e) => setFormData({...formData, dateEnd: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Alasan / Keterangan</label>
              <textarea 
                rows={4}
                required
                placeholder="Tuliskan detail alasan pengajuan..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
            >
              <span>Kirim Pengajuan</span>
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold text-gray-700 flex items-center">
          <Calendar size={18} className="mr-2 text-indigo-600" />
          Riwayat Pengajuan Izin
        </h3>
        {myRequests.length > 0 ? (
          <div className="space-y-4">
            {myRequests.slice().reverse().map(r => (
              <div key={r.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.type === 'Sakit' ? 'bg-red-50 text-red-600' : r.type === 'Cuti' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{r.type}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(r.dateStart).toLocaleDateString('id-ID')} s/d {new Date(r.dateEnd).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="md:text-right flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center">
                   <div className="mb-2">{getStatusBadge(r.status)}</div>
                   <p className="text-xs text-gray-400 max-w-xs truncate italic">"{r.reason}"</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p>Belum ada riwayat pengajuan izin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionView;
