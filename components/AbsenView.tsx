
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Map as MapIcon, CheckCircle2, AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { User, AttendanceRecord, AppSettings } from '../types';

declare var L: any;

interface AbsenViewProps {
  user: User;
  onComplete: (record: AttendanceRecord) => void;
  records: AttendanceRecord[];
  settings: AppSettings;
}

const AbsenView: React.FC<AbsenViewProps> = ({ user, onComplete, records, settings }) => {
  const [step, setStep] = useState<'location' | 'camera' | 'success'>('location');
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

  const attendanceType: 'in' | 'out' = hasIn ? 'out' : 'in';

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

      // MENGGANTI OSM KE CARTODB (Menghindari Blokir)
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

      L.marker([settings.schoolLocation.lat, settings.schoolLocation.lng], {
        icon: L.divIcon({
          className: 'custom-school-icon',
          html: `<div style="background-color:#1d4ed8; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(29,78,216,0.5);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(leafletMap.current);

      marker.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'user-location-icon',
          html: `<div class="relative"><div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div><div class="relative bg-blue-600 w-4 h-4 rounded-full border-2 border-white"></div></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(leafletMap.current);
    } catch (e) {
      console.error("Map error:", e);
    }
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
      setError('Fitur GPS tidak tersedia di browser/aplikasi ini.');
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
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;

        setLocation({ lat, lng, inRange: d <= settings.schoolLocation.radius });
        setAddress(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        updateMapPosition(lat, lng);

        if (d > settings.schoolLocation.radius) {
          setError(`Jarak Anda: ${Math.round(d)}m. Harus dalam radius ${settings.schoolLocation.radius}m.`);
        } else {
          setError(null);
        }
      },
      (err) => {
        let msg = 'Gagal mendapatkan lokasi.';
        if (err.code === 1) msg = 'Izin lokasi ditolak. Aktifkan GPS di pengaturan HP.';
        if (err.code === 2) msg = 'Sinyal lokasi lemah.';
        setError(msg);
      },
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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Kamera tidak didukung.');
      return;
    }
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Gagal buka kamera. Cek izin di HP.');
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
    if (!location || !photo) return;
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

  if (hasOut) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold">Absensi Selesai</h2>
        <p className="text-gray-500">Anda sudah absen masuk dan pulang hari ini.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <h2 className="text-2xl font-black mb-8 text-center text-gray-800 tracking-tight">
          Absen <span className="text-blue-600">{attendanceType === 'in' ? 'Masuk' : 'Pulang'}</span>
        </h2>

        {!isSecure && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center space-x-2 text-sm font-bold">
            <ShieldAlert size={20} />
            <span>Wajib HTTPS untuk Kamera & GPS.</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-12 px-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-50 -translate-y-1/2 -z-10" />
          {[1, 2, 3].map((num) => (
            <div key={num} className={`
              w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500
              ${(num === 1 && step === 'location') || (num === 2 && step === 'camera') || (num === 3 && step === 'success')
                ? 'bg-blue-600 text-white shadow-xl scale-110'
                : num < (step === 'location' ? 1 : step === 'camera' ? 2 : 3)
                  ? 'bg-green-500 text-white'
                  : 'bg-white border-2 border-gray-100 text-gray-300'}
            `}>
              {num}
            </div>
          ))}
        </div>

        {step === 'location' && (
          <div className="space-y-6">
            <div className="bg-gray-100 rounded-3xl h-72 relative overflow-hidden border border-gray-200">
               <div ref={mapRef} className="absolute inset-0"></div>
               <div className="absolute top-4 right-4 z-10">
                  <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 flex items-center shadow-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                    LOKASI AKTIF
                  </div>
               </div>
            </div>
            
            {error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center space-x-3 text-sm font-bold">
                <AlertTriangle size={20} className="shrink-0" />
                <span>{error}</span>
              </div>
            ) : location?.inRange ? (
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl flex items-center space-x-3 text-sm font-bold">
                <CheckCircle2 size={20} />
                <span>Lokasi Terverifikasi (Dalam Area)</span>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl flex items-center space-x-3 text-sm font-bold">
                <RefreshCw size={20} className="animate-spin" />
                <span>Menentukan Titik Lokasi...</span>
              </div>
            )}

            <button
              disabled={!location?.inRange || !isSecure}
              onClick={() => setStep('camera')}
              className={`w-full py-5 rounded-2xl font-black transition-all ${location?.inRange && isSecure ? 'bg-blue-600 text-white shadow-xl' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            >
              Lanjut ke Foto Selfie
            </button>
          </div>
        )}

        {step === 'camera' && (
          <div className="space-y-6">
            <div className="bg-black rounded-[2.5rem] aspect-square relative overflow-hidden flex items-center justify-center border-4 border-gray-50 shadow-inner">
               {!photo && !isCameraActive ? (
                 <button onClick={startCamera} className="bg-white p-8 rounded-full text-blue-600 shadow-xl">
                    <Camera size={40} />
                 </button>
               ) : photo ? (
                 <img src={photo} className="w-full h-full object-cover" alt="Selfie" />
               ) : (
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
               )}
               
               {isCameraActive && !photo && (
                 <button onClick={capturePhoto} className="absolute bottom-8 w-20 h-20 bg-white rounded-full border-8 border-blue-600 shadow-2xl" />
               )}
            </div>

            {photo && (
              <div className="flex space-x-4">
                <button onClick={() => { setPhoto(null); startCamera(); }} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold">Ulangi</button>
                <button onClick={submitAttendance} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold">Kirim Sekarang</button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={50} />
            </div>
            <h3 className="text-2xl font-black">Absen Berhasil!</h3>
            <p className="text-gray-500 mt-2">Data Anda sudah tersimpan di sistem.</p>
            <button onClick={() => window.location.reload()} className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold">Kembali</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsenView;
