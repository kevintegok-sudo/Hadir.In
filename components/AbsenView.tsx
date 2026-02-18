
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Map as MapIcon, CheckCircle2, AlertTriangle, RefreshCw, ShieldAlert, ArrowRight, LogIn, LogOut as LogOutIcon } from 'lucide-react';
import { User, AttendanceRecord, AppSettings } from '../types';

declare var L: any;

interface AbsenViewProps {
  user: User;
  onComplete: (record: AttendanceRecord) => void;
  records: AttendanceRecord[];
  settings: AppSettings;
}

const AbsenView: React.FC<AbsenViewProps> = ({ user, onComplete, records, settings }) => {
  // Ditambahkan step 'type' untuk pemilihan manual
  const [step, setStep] = useState<'type' | 'location' | 'camera' | 'success'>('type');
  const [attendanceType, setAttendanceType] = useState<'in' | 'out' | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number, inRange: boolean} | null>(null);
  const [address, setAddress] = useState('Mencari lokasi real-time...');
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const marker = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const userRecordsToday = records.filter(r => r.userId === user.id && r.timestamp.startsWith(today));
  const hasIn = userRecordsToday.find(r => r.type === 'in');
  const hasOut = userRecordsToday.find(r => r.type === 'out');

  useEffect(() => {
    if (!window.isSecureContext) {
      setIsSecure(false);
      setError("Aplikasi harus dijalankan di protokol HTTPS untuk mengakses Kamera & GPS.");
    }

    if (step === 'location' && window.isSecureContext) {
      startTracking();
    } else {
      stopTracking();
    }
    
    return () => {
      stopTracking();
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [step]);

  const initMap = (lat: number, lng: number) => {
    if (!mapRef.current || leafletMap.current) return;
    try {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lng], 17);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(leafletMap.current);

      L.circle([settings.schoolLocation.lat, settings.schoolLocation.lng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        radius: settings.schoolLocation.radius
      }).addTo(leafletMap.current);

      marker.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'user-location-icon',
          html: `<div class="relative"><div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div><div class="relative bg-blue-600 w-4 h-4 rounded-full border-2 border-white"></div></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(leafletMap.current);
    } catch (e) { console.error("Map error:", e); }
  };

  const updateMapPosition = (lat: number, lng: number) => {
    if (marker.current) {
      marker.current.setLatLng([lat, lng]);
      leafletMap.current?.panTo([lat, lng], { animate: true });
    } else {
      initMap(lat, lng);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Fitur GPS tidak tersedia.');
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const R = 6371e3; 
        const φ1 = lat * Math.PI/180;
        const φ2 = settings.schoolLocation.lat * Math.PI/180;
        const Δφ = (settings.schoolLocation.lat-lat) * Math.PI/180;
        const Δλ = (settings.schoolLocation.lng-lng) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;

        setLocation({ lat, lng, inRange: d <= settings.schoolLocation.radius });
        setAddress(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        updateMapPosition(lat, lng);

        if (d > settings.schoolLocation.radius) {
          setError(`Anda berada di luar area (${Math.round(d)}m). Jarak maks: ${settings.schoolLocation.radius}m.`);
        } else {
          setError(null);
        }
      },
      (err) => setError('Gagal mendapatkan lokasi. Aktifkan GPS.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Gagal buka kamera.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setPhoto(canvasRef.current.toDataURL('image/png'));
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach(t => t.stop());
        setIsCameraActive(false);
      }
    }
  };

  const submitAttendance = () => {
    if (!location || !photo || !attendanceType) return;
    onComplete({
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
      type: attendanceType,
      photo: photo,
      location: { lat: location.lat, lng: location.lng, address: address }
    });
    setStep('success');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
        
        {step !== 'success' && (
          <div className="flex items-center justify-between mb-10 px-4 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-50 -translate-y-1/2 -z-10" />
            {['Pilih', 'Lokasi', 'Selfie'].map((label, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-2">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all duration-500
                  ${(idx === 0 && step === 'type') || (idx === 1 && step === 'location') || (idx === 2 && step === 'camera')
                    ? 'bg-blue-600 text-white shadow-xl scale-110'
                    : idx < (step === 'type' ? 0 : step === 'location' ? 1 : 2)
                      ? 'bg-green-500 text-white'
                      : 'bg-white border-2 border-gray-100 text-gray-300'}
                `}>
                  {idx + 1}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        )}

        {step === 'type' && (
          <div className="flex-1 flex flex-col justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-2xl font-black text-gray-800">Pilih Jenis Absensi</h2>
              <p className="text-sm text-gray-500">Pastikan Anda memilih sesi yang benar hari ini</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => { setAttendanceType('in'); setStep('location'); }}
                className={`group relative overflow-hidden p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${hasIn ? 'border-green-100 bg-green-50/30 grayscale opacity-60' : 'border-gray-100 hover:border-blue-500 hover:bg-blue-50/50'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-4 rounded-2xl ${hasIn ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                    <LogIn size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-800 group-hover:text-blue-700">Absen Datang</p>
                    <p className="text-xs text-gray-500">{hasIn ? `Sudah absen: ${new Date(hasIn.timestamp).toLocaleTimeString()}` : 'Klik untuk masuk kerja'}</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => { setAttendanceType('out'); setStep('location'); }}
                className={`group relative overflow-hidden p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${hasOut ? 'border-green-100 bg-green-50/30 grayscale opacity-60' : 'border-gray-100 hover:border-indigo-500 hover:bg-indigo-50/50'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-4 rounded-2xl ${hasOut ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                    <LogOutIcon size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-800 group-hover:text-indigo-700">Absen Pulang</p>
                    <p className="text-xs text-gray-500">{hasOut ? `Sudah absen: ${new Date(hasOut.timestamp).toLocaleTimeString()}` : 'Klik untuk mengakhiri kerja'}</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
            {hasOut && (
              <p className="text-center text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 py-2 rounded-xl">Absensi hari ini telah lengkap</p>
            )}
          </div>
        )}

        {step === 'location' && (
          <div className="space-y-6 flex-1 flex flex-col animate-in fade-in">
             <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-800">Verifikasi Lokasi</h3>
                <button onClick={() => setStep('type')} className="text-xs font-bold text-gray-400 hover:text-blue-600">Ganti Jenis Absen</button>
             </div>
            <div className="bg-gray-100 rounded-3xl h-64 relative overflow-hidden border border-gray-200 shadow-inner">
               <div ref={mapRef} className="absolute inset-0"></div>
            </div>
            
            {error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center space-x-3 text-xs font-bold border border-red-100">
                <AlertTriangle size={20} className="shrink-0" />
                <span>{error}</span>
              </div>
            ) : location?.inRange ? (
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl flex items-center space-x-3 text-xs font-bold border border-green-100">
                <CheckCircle2 size={20} />
                <span>Lokasi Terverifikasi (Di Dalam Area Sekolah)</span>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl flex items-center space-x-3 text-xs font-bold border border-blue-100">
                <RefreshCw size={20} className="animate-spin" />
                <span>Mendeteksi Lokasi Presisi Anda...</span>
              </div>
            )}

            <button
              disabled={!location?.inRange || !isSecure}
              onClick={() => { setStep('camera'); startCamera(); }}
              className={`w-full py-5 rounded-2xl font-black mt-auto transition-all ${location?.inRange && isSecure ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            >
              Lanjut Ambil Foto Selfie
            </button>
          </div>
        )}

        {step === 'camera' && (
          <div className="space-y-6 flex-1 flex flex-col animate-in fade-in">
            <h3 className="font-black text-gray-800">Verifikasi Wajah</h3>
            <div className="bg-black rounded-[2.5rem] aspect-square relative overflow-hidden border-4 border-gray-50 shadow-2xl mx-auto w-full max-w-sm">
               {!photo ? (
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
               ) : (
                 <img src={photo} className="w-full h-full object-cover" alt="Selfie" />
               )}
               {isCameraActive && !photo && (
                 <button onClick={capturePhoto} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-8 border-blue-600 shadow-2xl active:scale-90 transition-transform" />
               )}
            </div>

            {photo && (
              <div className="flex space-x-4 mt-auto">
                <button onClick={() => { setPhoto(null); startCamera(); }} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black text-gray-600">Ulangi</button>
                <button onClick={submitAttendance} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100">Kirim Absen Sekarang</button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 size={50} />
            </div>
            <h3 className="text-3xl font-black text-gray-800">Presensi Berhasil!</h3>
            <p className="text-gray-500 mt-2 max-w-xs">Data absen <span className="font-bold text-blue-600">{attendanceType === 'in' ? 'MASUK' : 'PULANG'}</span> Anda telah tercatat pada sistem.</p>
            <button onClick={() => window.location.reload()} className="mt-10 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100">Kembali ke Beranda</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsenView;
