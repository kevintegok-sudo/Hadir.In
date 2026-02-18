
import React, { useState, useEffect, useCallback } from 'react';
import { User, AttendanceRecord, JournalEntry, PermissionRequest, PermissionStatus, AppSettings } from './types';
import { MOCK_USERS, DEFAULT_SETTINGS } from './constants';
import Dashboard from './components/Dashboard';
import AbsenView from './components/AbsenView';
import JournalView from './components/JournalView';
import PermissionView from './components/PermissionView';
import AdminDashboard from './components/AdminDashboard';
import LoginView from './components/LoginView';
import BottomNav from './components/BottomNav';
import { secureStorage } from './utils/security';
import { LogOut, Bell } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Sync History API for Hardware Back Button
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

  // Load Secure Data
  useEffect(() => {
    const savedUsers = secureStorage.getItem<User[]>('edu_users');
    const savedAttendance = secureStorage.getItem<AttendanceRecord[]>('edu_attendance');
    const savedJournals = secureStorage.getItem<JournalEntry[]>('edu_journals');
    const savedPermissions = secureStorage.getItem<PermissionRequest[]>('edu_permissions');
    const savedSettings = secureStorage.getItem<AppSettings>('edu_settings');
    const savedUser = secureStorage.getItem<User>('edu_user');

    if (savedUsers) setUsers(savedUsers);
    else {
      setUsers(MOCK_USERS);
      secureStorage.setItem('edu_users', MOCK_USERS);
    }

    if (savedAttendance) setAttendance(savedAttendance);
    if (savedJournals) setJournals(savedJournals);
    if (savedPermissions) setPermissions(savedPermissions);
    if (savedSettings) setSettings(savedSettings);
    if (savedUser) {
      setCurrentUser(savedUser);
      // Initialize history state
      window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
    }
    
    setIsInitialized(true);
  }, []);

  const handleLogin = (nip: string, pass: string): boolean => {
    const foundUser = users.find(u => u.nip === nip && u.password === pass);
    if (foundUser) {
      const userToSave = { ...foundUser };
      delete userToSave.password; // Security: don't keep password in session object
      setCurrentUser(userToSave);
      secureStorage.setItem('edu_user', userToSave);
      window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    secureStorage.removeItem('edu_user');
    window.history.replaceState(null, '', '/');
  };

  // State update wrappers with secure storage
  const registerUser = (newUser: User) => {
    const updated = [...users, newUser];
    setUsers(updated);
    secureStorage.setItem('edu_users', updated);
  };

  const deleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    secureStorage.setItem('edu_users', updated);
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    secureStorage.setItem('edu_settings', newSettings);
  };

  const addAttendance = (record: AttendanceRecord) => {
    const updated = [...attendance, record];
    setAttendance(updated);
    secureStorage.setItem('edu_attendance', updated);
  };

  const addJournal = (entry: JournalEntry) => {
    const updated = [...journals, entry];
    setJournals(updated);
    secureStorage.setItem('edu_journals', updated);
  };

  const addPermission = (req: PermissionRequest) => {
    const updated = [...permissions, req];
    setPermissions(updated);
    secureStorage.setItem('edu_permissions', updated);
  };

  const updatePermissionStatus = (id: string, status: PermissionStatus) => {
    const updated = permissions.map(p => p.id === id ? { ...p, status } : p);
    setPermissions(updated);
    secureStorage.setItem('edu_permissions', updated);
  };

  if (!isInitialized) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    return (
      <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2">
        {(() => {
          switch (activeTab) {
            case 'dashboard': return <Dashboard user={currentUser} attendance={attendance} journals={journals} permissions={permissions} settings={settings} />;
            case 'absen': return <AbsenView user={currentUser} onComplete={addAttendance} records={attendance} settings={settings} />;
            case 'jurnal': return <JournalView user={currentUser} onSave={addJournal} journals={journals} />;
            case 'izin': return <PermissionView user={currentUser} onSubmit={addPermission} requests={permissions} />;
            case 'admin': return (
              <AdminDashboard 
                users={users}
                attendance={attendance} 
                journals={journals} 
                permissions={permissions} 
                settings={settings}
                onUpdatePermission={updatePermissionStatus}
                onRegisterUser={registerUser}
                onDeleteUser={deleteUser}
                onUpdateSettings={updateSettings}
              />
            );
            default: return <Dashboard user={currentUser} attendance={attendance} journals={journals} permissions={permissions} settings={settings} />;
          }
        })()}
      </div>
    );
  };

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
        
        <div className="flex items-center space-x-2">
          <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all relative">
            <Bell size={20} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </button>
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
      
      <main className="flex-1 pb-32 pt-6 px-4 md:px-8 max-w-5xl mx-auto w-full overflow-x-hidden">
        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={changeTab} user={currentUser} />
    </div>
  );
};

export default App;
