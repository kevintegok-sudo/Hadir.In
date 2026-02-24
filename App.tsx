
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, AttendanceRecord, JournalEntry, PermissionRequest, PermissionStatus, AppSettings, AppNotification } from './types';
import { MOCK_USERS, DEFAULT_SETTINGS } from './constants';
import Dashboard from './components/Dashboard';
import AbsenView from './components/AbsenView';
import JournalView from './components/JournalView';
import PermissionView from './components/PermissionView';
import AdminDashboard from './components/AdminDashboard';
import LoginView from './components/LoginView';
import BottomNav from './components/BottomNav';
import { secureStorage } from './utils/security';
import { LogOut, Bell, X, Check } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Sync History API
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else if (currentUser) {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  const changeTab = useCallback((tab: string) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    window.history.pushState({ tab }, '', `#${tab}`);
  }, [activeTab]);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, attendanceRes, journalsRes, permissionsRes, settingsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/attendance'),
          fetch('/api/journals'),
          fetch('/api/permissions'),
          fetch('/api/settings')
        ]);

        const [usersData, attendanceData, journalsData, permissionsData, settingsData] = await Promise.all([
          usersRes.json(),
          attendanceRes.json(),
          journalsRes.json(),
          permissionsRes.json(),
          settingsRes.json()
        ]);

        setUsers(usersData);
        setAttendance(attendanceData);
        setJournals(journalsData);
        setPermissions(permissionsData);
        setSettings(settingsData);

        const savedUser = secureStorage.getItem<User>('edu_user');
        if (savedUser) {
          setCurrentUser(savedUser);
          // Fetch notifications for the user
          const notifRes = await fetch(`/api/notifications/${savedUser.id}`);
          const notifData = await notifRes.json();
          setNotifications(notifData);
          window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    fetchData();
  }, []);

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif)
      });
      const newNotif = await res.json();
      setNotifications(prev => [newNotif, ...prev]);
    } catch (error) {
      console.error("Failed to add notification:", error);
    }
  };

  const markAllRead = async () => {
    if (!currentUser) return;
    try {
      await fetch(`/api/notifications/read-all/${currentUser.id}`, {
        method: 'PATCH'
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all read:", error);
    }
  };

  const handleLogin = async (nip: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, password: pass })
      });
      
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        secureStorage.setItem('edu_user', user);
        
        // Fetch notifications for the logged in user
        const notifRes = await fetch(`/api/notifications/${user.id}`);
        const notifData = await notifRes.json();
        setNotifications(notifData);
        
        window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setNotifications([]);
    secureStorage.removeItem('edu_user');
    window.history.replaceState(null, '', '/');
  };

  const addAttendance = async (record: AttendanceRecord) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const newRecord = await res.json();
      setAttendance(prev => [...prev, newRecord]);

      // Notif Keterlambatan
      const timeStr = new Date(record.timestamp).toTimeString().slice(0, 5);
      if (record.type === 'in' && timeStr > settings.attendanceHours.endIn) {
        addNotification({
          userId: record.userId,
          title: 'Status: Terlambat',
          message: `Anda absen masuk pukul ${timeStr}. Batas akhir adalah ${settings.attendanceHours.endIn}.`,
          type: 'warning'
        });
      } else {
        addNotification({
          userId: record.userId,
          title: 'Absensi Berhasil',
          message: `Presensi ${record.type === 'in' ? 'Masuk' : 'Pulang'} telah tercatat.`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error("Failed to add attendance:", error);
    }
  };

  const addJournal = async (entry: JournalEntry) => {
    try {
      const res = await fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const newEntry = await res.json();
      setJournals(prev => [...prev, newEntry]);
      addNotification({
        userId: entry.userId,
        title: 'Jurnal Tersimpan',
        message: `Jurnal untuk kelas ${entry.className} telah berhasil dikirim.`,
        type: 'info'
      });
    } catch (error) {
      console.error("Failed to add journal:", error);
    }
  };

  const updatePermissionStatus = async (id: string, status: PermissionStatus) => {
    try {
      const res = await fetch(`/api/permissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const updatedPermission = await res.json();
      
      setPermissions(prev => prev.map(p => p.id === id ? updatedPermission : p));

      addNotification({
        userId: updatedPermission.userId,
        title: `Izin ${status === PermissionStatus.APPROVED ? 'Disetujui' : 'Ditolak'}`,
        message: `Permohonan izin ${updatedPermission.type} Anda telah ${status === PermissionStatus.APPROVED ? 'diterima' : 'ditolak'} oleh Admin.`,
        type: status === PermissionStatus.APPROVED ? 'success' : 'error'
      });
    } catch (error) {
      console.error("Failed to update permission:", error);
    }
  };

  const addPermission = async (req: PermissionRequest) => {
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      const newRequest = await res.json();
      setPermissions(prev => [...prev, newRequest]);
    } catch (error) {
      console.error("Failed to add permission:", error);
    }
  };

  const registerUser = async (user: User) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      const newUser = await res.json();
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error("Failed to register user:", error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const updateSettings = async (newSettings: AppSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const updatedSettings = await res.json();
      setSettings(updatedSettings);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead && (currentUser ? n.userId === currentUser.id : false)).length,
  [notifications, currentUser]);

  if (!isInitialized) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) return <LoginView onLogin={handleLogin} />;

  const userNotifs = notifications.filter(n => n.userId === currentUser.id);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30 selection:bg-blue-100">
      <header className="bg-white/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-center space-x-2 group cursor-pointer" onClick={() => changeTab('dashboard')}>
           <div className="w-9 h-9 transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                <polygon points="20,70 45,70 45,30 20,30" fill="#3B82F6" opacity="0.8" />
                <polygon points="40,90 85,45 40,0" fill="#2563EB" />
                <polygon points="20,40 50,40 50,15" fill="#60A5FA" />
              </svg>
           </div>
           <span className="text-xl font-black tracking-tighter text-blue-600">Hadir.In</span>
        </div>
        
        <div className="flex items-center space-x-2 relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) markAllRead(); }}
            className={`p-2.5 rounded-2xl transition-all relative ${showNotifications ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount}
              </div>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-14 right-0 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 z-50">
              <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-800">Pemberitahuan</h3>
                <button onClick={() => setShowNotifications(false)} className="text-gray-300 hover:text-red-500"><X size={16}/></button>
              </div>
              <div className="max-h-96 overflow-y-auto no-scrollbar">
                {userNotifs.length > 0 ? userNotifs.map(n => (
                  <div key={n.id} className={`p-4 border-b border-gray-50 flex items-start space-x-3 hover:bg-gray-50 transition-colors`}>
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.type === 'warning' ? 'bg-amber-500' : n.type === 'success' ? 'bg-green-500' : n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-gray-800">{n.title}</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-bold">{n.message}</p>
                      <p className="text-[8px] text-gray-300 font-bold uppercase">{new Date(n.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center space-y-2">
                    <Bell size={32} className="mx-auto text-gray-100" />
                    <p className="text-[10px] font-black text-gray-300 uppercase">Belum ada notifikasi</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 pl-2 border-l border-gray-100 ml-2">
            <button 
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all flex items-center space-x-2 group"
            >
              <LogOut size={18} />
              <span className="text-xs font-black uppercase tracking-widest hidden sm:inline-block">Keluar</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pb-32 pt-6 px-4 md:px-8 max-w-5xl mx-auto w-full">
        {(() => {
          switch (activeTab) {
            case 'dashboard': return <Dashboard user={currentUser} attendance={attendance} journals={journals} permissions={permissions} settings={settings} />;
            case 'absen': return <AbsenView user={currentUser} onComplete={addAttendance} records={attendance} settings={settings} />;
            case 'jurnal': return <JournalView user={currentUser} onSave={addJournal} journals={journals} />;
            case 'izin': return <PermissionView user={currentUser} onSubmit={addPermission} requests={permissions} />;
            case 'admin': return <AdminDashboard users={users} attendance={attendance} journals={journals} permissions={permissions} settings={settings} onUpdatePermission={updatePermissionStatus} onRegisterUser={registerUser} onDeleteUser={deleteUser} onUpdateSettings={updateSettings} />;
            default: return <Dashboard user={currentUser} attendance={attendance} journals={journals} permissions={permissions} settings={settings} />;
          }
        })()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={changeTab} user={currentUser} />
    </div>
  );
};

export default App;
