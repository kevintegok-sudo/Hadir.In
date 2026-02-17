
import React, { useState } from 'react';
import { User, JournalEntry } from '../types';
import { SUBJECTS, CLASSES } from '../constants';
import { BookOpen, CheckCircle, FileText, Plus } from 'lucide-react';

interface JournalViewProps {
  user: User;
  onSave: (entry: JournalEntry) => void;
  journals: JournalEntry[];
}

const JournalView: React.FC<JournalViewProps> = ({ user, onSave, journals }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: SUBJECTS[0],
    className: CLASSES[0],
    material: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: JournalEntry = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      ...formData
    };
    onSave(entry);
    setFormData({ subject: SUBJECTS[0], className: CLASSES[0], material: '', notes: '' });
    setShowForm(false);
  };

  const myJournals = journals.filter(j => j.userId === user.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Jurnal Mengajar</h2>
          <p className="text-sm text-gray-500">Laporkan aktivitas pembelajaran harian Anda.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            <Plus size={20} />
            <span>Isi Jurnal Baru</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-indigo-100 animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Mata Pelajaran</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Kelas</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={formData.className}
                  onChange={(e) => setFormData({...formData, className: e.target.value})}
                >
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Materi yang Diajarkan</label>
              <input 
                required
                placeholder="Contoh: Aljabar Linear - Matriks 2x2"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={formData.material}
                onChange={(e) => setFormData({...formData, material: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Catatan & Kendala (Opsional)</label>
              <textarea 
                rows={4}
                placeholder="Tuliskan kendala siswa atau catatan khusus hari ini..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 text-gray-600 font-bold hover:bg-gray-50 rounded-xl"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100"
              >
                Simpan Jurnal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-700">Riwayat Jurnal Terbaru</h3>
        {myJournals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myJournals.slice().reverse().map(j => (
              <div key={j.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <BookOpen size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    {new Date(j.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h4 className="font-bold text-gray-800">{j.subject}</h4>
                <p className="text-sm text-indigo-600 font-medium mb-3">{j.className}</p>
                <div className="space-y-2">
                   <p className="text-sm text-gray-600"><span className="font-bold">Materi:</span> {j.material}</p>
                   {j.notes && <p className="text-xs text-gray-500 italic">"{j.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p>Belum ada jurnal yang tercatat.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalView;
