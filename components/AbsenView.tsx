
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Map as MapIcon, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
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
    if (step === 'location') {
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

    leafletMap.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([lat, lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap.current);

    // Circle Geofence
    L.circle([settings.schoolLocation.lat, settings.schoolLocation.lng], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      radius: settings.schoolLocation.radius
    }).addTo(leafletMap.current);

    // School Marker
    L.marker([settings.schoolLocation.lat, settings.schoolLocation.lng], {
      icon: L.divIcon({
        className: 'custom-school-icon',
        html: `<div style="background-color:#1d4ed8; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(29,78,216,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    }).addTo(leafletMap.current);

    // User Marker
    marker.current = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'user-location-icon',
        html: `<div class="relative"><div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div><div class="relative bg-blue-600 w-4 h-4 rounded-full border-2 border-white"></div></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    }).addTo(leafletMap.current);
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
      setError('Geolokasi tidak didukung.');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        
        // Calculate Distance
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
        setAddress(`Lokasi Real-time: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        updateMapPosition(lat, lng);

        if (d > settings.schoolLocation.radius) {
          setError(`Anda berada ${Math.round(d)}m dari sekolah. Harus dalam radius ${settings.schoolLocation.radius}m.`);
        } else {
          setError(null);
        }
      },
      (err) => {
        setError('Gagal mendapatkan lokasi. Pastikan izin GPS diberikan.');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Kamera tidak dapat diakses.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setPhoto(dataUrl);
        
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setIsCameraActive(false);
      }
    }
  };

  const submitAttendance = () => {
    if (!location || !photo) return;
    
    const record: AttendanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
      type: attendanceType,
      photo: photo,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: address
      }
    };

    onComplete(record);
    setStep('success');
  };

  if (hasOut) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold">Absensi Hari Ini Selesai</h2>
        <p className="text-gray-500">Terima kasih atas dedikasinya hari ini. Sampai jumpa besok!</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <h2 className="text-2xl font-black mb-8 text-center text-gray-800 tracking-tight">
          Sesi Absensi <span className="text-blue-600">{attendanceType === 'in' ? 'Masuk' : 'Pulang'}</span>
        </h2>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 px-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-50 -translate-y-1/2 -z-10" />
          {[1, 2, 3].map((num) => (
            <div key={num} className={`
              w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500
              ${(num === 1 && step === 'location') || (num === 2 && step === 'camera') || (num === 3 && step === 'success')
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110'
                : num < (step === 'location' ? 1 : step === 'camera' ? 2 : 3)
                  ? 'bg-green-500 text-white'
                  : 'bg-white border-2 border-gray-100 text-gray-300'}
            `}>
              {num}
            </div>
          ))}
        </div>

        {step === 'location' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-50 rounded-3xl h-72 relative overflow-hidden shadow-inner border border-gray-100">
               <div ref={mapRef} className="absolute inset-0 z-0"></div>
               <div className="absolute top-4 right-4 z-10">
                  <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 shadow-sm flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                    GPS AKTIF
                  </div>
               </div>
            </div>
            
            {error ? (
              <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600 animate-pulse">
                <AlertTriangle size={24} className="shrink-0" />
                <span className="text-sm font-bold leading-tight">{error}</span>
              </div>
            ) : location?.inRange ? (
              <div className="p-5 bg-green-50 border border-green-100 rounded-2xl flex items-center space-x-3 text-green-600">
                <CheckCircle2 size={24} className="shrink-0" />
                <span className="text-sm font-bold">Posisi Valid! Anda berada dalam area sekolah.</span>
              </div>
            ) : (
              <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center space-x-3 text-blue-600">
                <RefreshCw size={24} className="animate-spin shrink-0" />
                <span className="text-sm font-bold">Menghitung jarak ke titik geofence...</span>
              </div>
            )}

            <button
              disabled={!location?.inRange}
              onClick={() => setStep('camera')}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all transform active:scale-95 ${location?.inRange ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            >
              Konfirmasi Lokasi & Foto
            </button>
          </div>
        )}

        {step === 'camera' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-black rounded-[2.5rem] aspect-square relative overflow-hidden flex items-center justify-center border-8 border-gray-50 shadow-2xl">
               {!photo && !isCameraActive ? (
                 <button onClick={startCamera} className="bg-white p-8 rounded-full text-blue-600 shadow-2xl hover:scale-110 transition-transform">
                    <Camera size={40} />
                 </button>
               ) : photo ? (
                 <img src={photo} className="w-full h-full object-cover" alt="Selfie" />
               ) : (
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
               )}
               
               {isCameraActive && !photo && (
                 <div className="absolute bottom-8 inset-x-0 flex justify-center">
                    <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-blue-600 shadow-2xl active:scale-90 transition-transform" />
                 </div>
               )}
            </div>

            {photo && (
              <div className="flex space-x-4">
                <button 
                  onClick={() => { setPhoto(null); startCamera(); }}
                  className="flex-1 py-5 bg-gray-100 rounded-2xl font-black text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Ulangi
                </button>
                <button 
                  onClick={submitAttendance}
                  className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100"
                >
                  Kirim Absen
                </button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-12 animate-in zoom-in-90 duration-500">
            <div className="w-28 h-28 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 size={60} />
            </div>
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">Berhasil!</h3>
            <p className="text-gray-500 mt-4 text-lg font-medium">Data kehadiran Anda telah tercatat aman.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-10 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-lg"
            >
              Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsenView;
