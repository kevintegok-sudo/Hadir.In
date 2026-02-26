
import React, { useState, useRef } from 'react';
import { User, JournalEntry } from '../types';
import { SUBJECTS, CLASSES } from '../constants';
import { BookOpen, CheckCircle, FileText, Plus, MapPin, Camera, X } from 'lucide-react';

interface JournalViewProps {
  user: User;
  onSave: (entry: JournalEntry) => void;
  journals: JournalEntry[];
}

const JournalView: React.FC<JournalViewProps> = ({ user, onSave, journals }) => {
  const [showForm, setShowForm] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    subject: SUBJECTS[0],
    className: CLASSES[0],
    material: '',
    notes: '',
    photo: '',
    location: null as null | { lat: number; lng: number; address: string }
  });

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: "Lokasi saat ini"
            }
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
          setLocationLoading(false);
        }
      );
    } else {
      alert("Geolocation tidak didukung oleh browser ini.");
      setLocationLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: JournalEntry = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      ...formData
    };
    onSave(entry);
    setFormData({ 
      subject: SUBJECTS[0], 
      className: CLASSES[0], 
      material: '', 
      notes: '', 
      photo: '', 
      location: null 
    });
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Foto Kegiatan</label>
                <div className="flex items-center space-x-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleCapturePhoto}
                  />
                  {formData.photo ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, photo: ''})}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-400"
                    >
                      <Camera size={32} className="mb-2" />
                      <span className="text-xs font-medium">Ambil Foto</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tag Lokasi</label>
                <div className="h-40 flex flex-col items-center justify-center border border-gray-200 rounded-xl bg-gray-50 px-4 text-center">
                  {formData.location ? (
                    <div className="space-y-1">
                      <MapPin size={24} className="mx-auto text-indigo-600 mb-1" />
                      <p className="text-xs font-bold text-gray-800">Lokasi Tersemat</p>
                      <p className="text-[10px] text-gray-500">{formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}</p>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, location: null})}
                        className="text-[10px] text-red-500 font-bold hover:underline mt-1"
                      >
                        Hapus Lokasi
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      disabled={locationLoading}
                      onClick={handleGetLocation}
                      className="flex flex-col items-center space-y-2 text-gray-400 hover:text-indigo-600 transition-all"
                    >
                      <MapPin size={32} className={locationLoading ? "animate-bounce" : ""} />
                      <span className="text-xs font-medium">{locationLoading ? "Mengambil..." : "Sematkan Lokasi"}</span>
                    </button>
                  )}
                </div>
              </div>
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
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      {new Date(j.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                    {j.location && (
                      <div className="flex items-center text-[10px] text-indigo-500 mt-1 font-bold">
                        <MapPin size={10} className="mr-1" />
                        <span>Lokasi Tersemat</span>
                      </div>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-gray-800">{j.subject}</h4>
                <p className="text-sm text-indigo-600 font-medium mb-3">{j.className}</p>
                
                {j.photo && (
                  <div className="w-full h-32 rounded-xl overflow-hidden mb-3 border border-gray-100">
                    <img src={j.photo} alt="Kegiatan" className="w-full h-full object-cover" />
                  </div>
                )}

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
