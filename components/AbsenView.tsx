
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Map as MapIcon, CheckCircle2, AlertTriangle, RefreshCw, ShieldAlert, ArrowRight, LogIn, LogOut as LogOutIcon, Navigation } from 'lucide-react';
import { User, AttendanceRecord, AppSettings } from '../types';

declare var L: any;

interface AbsenViewProps {
  user: User;
  onComplete: (record: AttendanceRecord) => void;
  records: AttendanceRecord[];
  settings: AppSettings;
}

const AbsenView: React.FC<AbsenViewProps> = ({ user, onComplete, records, settings }) => {
  const [step, setStep] = useState<'type' | 'location' | 'camera' | 'success'>('type');
  const [attendanceType, setAttendanceType] = useState<'in' | 'out' | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number, inRange: boolean} | null>(null);
  const [address, setAddress] = useState('Mencari lokasi...');
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  
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

  // Check for Secure Context (HTTPS) - MANDATORY FOR ANDROID
  const isSecure = window.isSecureContext || window.location.hostname === 'localhost';

  useEffect(() => {
    if (step === 'location') {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [step]);

  const initMap = (lat: number, lng: number) => {
    if (!mapRef.current || leafletMap.current) return;
    try {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: !L.Browser.mobile, // Disable dragging on mobile for smoother feel
        touchZoom: true
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
          html: `<div class="relative"><div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div><div class="relative bg-blue-600 w-4 h-4 rounded-full border-2 border-white shadow-lg"></div></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(leafletMap.current);
    } catch (e) { console.error("Map error:", e); }
  };

  const updateMapPosition = (lat: number, lng: number) => {
    if (marker.current) {
      marker.current.setLatLng([lat, lng]);
      leafletMap.current?.panTo([lat, lng], { animate: true, duration: 0.5 });
    } else {
      initMap(lat, lng);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('GPS tidak didukung oleh perangkat ini.');
      return;
    }
    
    setIsLoadingGPS(true);
    setError(null);

    // Initial check for faster response
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePosition(pos),
      (err) => handleGPSError(err),
      { enableHighAccuracy: true, timeout: 5000 }
    );

    // Constant watching for precision
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handlePosition(pos),
      (err) => handleGPSError(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handlePosition = (pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    
    // Android accuracy check
    if (accuracy > 100) {
      setAddress(`Akurasi lemah (${Math.round(accuracy)}m). Mencari sinyal...`);
    } else {
      setAddress(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }

    const R = 6371e3; 
    const φ1 = lat * Math.PI/180;
    const φ2 = settings.schoolLocation.lat * Math.PI/180;
    const Δφ = (settings.schoolLocation.lat-lat) * Math.PI/180;
    const Δλ = (settings.schoolLocation.lng-lng) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;

    setLocation({ lat, lng, inRange: d <= settings.schoolLocation.radius });
    updateMapPosition(lat, lng);
    setIsLoadingGPS(false);

    if (d > settings.schoolLocation.radius) {
      setError(`Di luar area: ${Math.round(d)}m dari sekolah.`);
    } else {
      setError(null);
    }
  };

  const handleGPSError = (err: GeolocationPositionError) => {
    setIsLoadingGPS(false);
    let msg = 'Gagal akses lokasi.';
    if (err.code === 1) msg = 'Izin lokasi ditolak. Aktifkan GPS di setelan HP.';
    if (err.code === 2) msg = 'Sinyal GPS tidak ditemukan. Pindahlah ke area terbuka.';
    if (err.code === 3) msg = 'Waktu deteksi habis.';
    setError(msg);
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Kamera diblokir atau tidak tersedia.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
        canvasRef.current.width = size;
        canvasRef.current.height = size;
        // Center crop for better selfie
        context.drawImage(
          videoRef.current, 
          (videoRef.current.videoWidth - size) / 2, 
          (videoRef.current.videoHeight - size) / 2, 
          size, size, 
          0, 0, size, size
        );
        setPhoto(canvasRef.current.toDataURL('image/jpeg', 0.8));
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
    <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-0">
      {!isSecure && (
        <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center space-x-3 animate-pulse shadow-lg">
          <ShieldAlert size={24} />
          <p className="text-xs font-black uppercase">Mode Tidak Aman: Gunakan HTTPS agar GPS & Kamera berfungsi!</p>
        </div>
      )}

      <div className="bg-white p-5 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[550px] flex flex-col transition-all">
        
        {step !== 'success' && (
          <div className="flex items-center justify-between mb-8 px-4">
            {['Pilih', 'Lokasi', 'Selfie'].map((label, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-2">
                <div className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all
                  ${(idx === 0 && step === 'type') || (idx === 1 && step === 'location') || (idx === 2 && step === 'camera')
                    ? 'bg-blue-600 text-white shadow-xl scale-110'
                    : idx < (step === 'type' ? 0 : step === 'location' ? 1 : 2)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-300'}
                `}>
                  {idx + 1}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        )}

        {step === 'type' && (
          <div className="flex-1 flex flex-col justify-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-1 mb-4">
              <h2 className="text-2xl font-black text-gray-800">Presensi Harian</h2>
              <p className="text-sm text-gray-500 font-medium">Ketuk salah satu sesi di bawah ini</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => { setAttendanceType('in'); setStep('location'); }}
                className={`w-full group p-5 rounded-3xl border-2 transition-all flex items-center justify-between ${hasIn ? 'border-green-100 bg-green-50/20 opacity-50' : 'border-gray-100 active:bg-blue-50 active:border-blue-500'}`}
              >
                <div className="flex items-center space-x-4 text-left">
                  <div className={`p-4 rounded-2xl ${hasIn ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    <LogIn size={24} />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">Masuk Kerja</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{hasIn ? `Selesai: ${new Date(hasIn.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : 'Sesi Pagi'}</p>
                  </div>
                </div>
                {!hasIn && <ArrowRight size={20} className="text-gray-300" />}
              </button>

              <button 
                onClick={() => { setAttendanceType('out'); setStep('location'); }}
                className={`w-full group p-5 rounded-3xl border-2 transition-all flex items-center justify-between ${hasOut ? 'border-green-100 bg-green-50/20 opacity-50' : 'border-gray-100 active:bg-indigo-50 active:border-indigo-500'}`}
              >
                <div className="flex items-center space-x-4 text-left">
                  <div className={`p-4 rounded-2xl ${hasOut ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    <LogOutIcon size={24} />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">Pulang Kerja</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{hasOut ? `Selesai: ${new Date(hasOut.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : 'Sesi Sore'}</p>
                  </div>
                </div>
                {!hasOut && <ArrowRight size={20} className="text-gray-300" />}
              </button>
            </div>
          </div>
        )}

        {step === 'location' && (
          <div className="space-y-4 flex-1 flex flex-col animate-in fade-in">
             <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-gray-800 uppercase text-sm tracking-tight">Verifikasi Area</h3>
                <button 
                  onClick={() => { stopTracking(); startTracking(); }} 
                  className={`p-2 rounded-xl text-blue-600 bg-blue-50 transition-all ${isLoadingGPS ? 'animate-spin' : ''}`}
                >
                  <RefreshCw size={18} />
                </button>
             </div>
            
            <div className="bg-gray-200 rounded-[2rem] h-60 relative overflow-hidden border-4 border-white shadow-inner">
               <div ref={mapRef} className="absolute inset-0 z-0"></div>
               {isLoadingGPS && (
                 <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] font-black text-blue-800 uppercase">Mencari Sinyal...</span>
                    </div>
                 </div>
               )}
            </div>
            
            {error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center space-x-3 border border-red-100">
                <AlertTriangle size={20} className="shrink-0" />
                <span className="text-xs font-bold leading-tight">{error}</span>
              </div>
            ) : location?.inRange ? (
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl flex items-center space-x-3 border border-green-100">
                <CheckCircle2 size={20} className="shrink-0" />
                <span className="text-xs font-black uppercase tracking-tight">Terdeteksi di Area Sekolah</span>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl flex items-center space-x-3 border border-blue-100">
                <Navigation size={20} className="animate-pulse shrink-0" />
                <span className="text-xs font-bold leading-tight">{address}</span>
              </div>
            )}

            <button
              disabled={!location?.inRange || isLoadingGPS || !isSecure}
              onClick={() => { setStep('camera'); startCamera(); }}
              className={`w-full py-5 rounded-2xl font-black mt-auto transition-all ${location?.inRange && !isLoadingGPS && isSecure ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            >
              Lanjut Ambil Selfie
            </button>
          </div>
        )}

        {step === 'camera' && (
          <div className="space-y-4 flex-1 flex flex-col animate-in fade-in">
            <h3 className="font-black text-gray-800 uppercase text-sm tracking-tight text-center">Verifikasi Wajah</h3>
            <div className="bg-black rounded-[2.5rem] aspect-square relative overflow-hidden border-4 border-white shadow-2xl mx-auto w-full max-w-sm flex items-center justify-center">
               {!photo ? (
                 <>
                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                   <div className="absolute inset-0 border-[20px] border-black/20 rounded-full pointer-events-none"></div>
                 </>
               ) : (
                 <img src={photo} className="w-full h-full object-cover" alt="Selfie" />
               )}
               {isCameraActive && !photo && (
                 <button onClick={capturePhoto} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-8 border-blue-600 shadow-2xl active:scale-90 transition-transform" />
               )}
            </div>

            {photo && (
              <div className="flex space-x-3 mt-auto">
                <button onClick={() => { setPhoto(null); startCamera(); }} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black text-gray-600 text-sm uppercase">Ulangi</button>
                <button onClick={submitAttendance} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 text-sm uppercase">Kirim Data</button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner border-4 border-white">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-3xl font-black text-gray-800">Berhasil!</h3>
            <p className="text-gray-500 mt-2 font-bold px-4">Presensi Anda telah diterima server.</p>
            <button onClick={() => window.location.reload()} className="mt-10 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest text-sm">Selesai</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsenView;
