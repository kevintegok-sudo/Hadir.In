
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
import { LogOut, Bell } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Sync History API for Android Back Button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const changeTab = useCallback((tab: string) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    window.history.pushState({ tab }, '', `#${tab}`);
  }, [activeTab]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('edu_users');
    const savedAttendance = localStorage.getItem('edu_attendance');
    const savedJournals = localStorage.getItem('edu_journals');
    const savedPermissions = localStorage.getItem('edu_permissions');
    const savedSettings = localStorage.getItem('edu_settings');
    const savedUser = localStorage.getItem('edu_user');

    if (savedUsers) setUsers(JSON.parse(savedUsers));
    else {
      setUsers(MOCK_USERS);
      localStorage.setItem('edu_users', JSON.stringify(MOCK_USERS));
    }

    if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
    if (savedJournals) setJournals(JSON.parse(savedJournals));
    if (savedPermissions) setPermissions(JSON.parse(savedPermissions));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (nip: string, pass: string): boolean => {
    const foundUser = users.find(u => u.nip === nip && u.password === pass);
    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('edu_user', JSON.stringify(foundUser));
      // Reset history to base dashboard on login
      window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('edu_user');
  };

  const registerUser = (newUser: User) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('edu_users', JSON.stringify(updatedUsers));
  };

  const deleteUser = (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('edu_users', JSON.stringify(updatedUsers));
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('edu_settings', JSON.stringify(newSettings));
  };

  const addAttendance = (record: AttendanceRecord) => {
    const updated = [...attendance, record];
    setAttendance(updated);
    localStorage.setItem('edu_attendance', JSON.stringify(updated));
  };

  const addJournal = (entry: JournalEntry) => {
    const updated = [...journals, entry];
    setJournals(updated);
    localStorage.setItem('edu_journals', JSON.stringify(updated));
  };

  const addPermission = (req: PermissionRequest) => {
    const updated = [...permissions, req];
    setPermissions(updated);
    localStorage.setItem('edu_permissions', JSON.stringify(updated));
  };

  const updatePermissionStatus = (id: string, status: PermissionStatus) => {
    const updated = permissions.map(p => p.id === id ? { ...p, status } : p);
    setPermissions(updated);
    localStorage.setItem('edu_permissions', JSON.stringify(updated));
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
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
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="20,70 45,70 45,30 20,30" fill="#3B82F6" opacity="0.8" />
                <polygon points="40,90 85,45 40,0" fill="#2563EB" />
                <polygon points="20,40 50,40 50,15" fill="#60A5FA" />
              </svg>
           </div>
           <span className="text-xl font-black tracking-tighter text-blue-600">Hadir.In</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
            <Bell size={20} />
          </button>
          <div className="flex items-center space-x-3 pl-2 border-l border-gray-100">
            <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">{currentUser.role}</p>
               <p className="text-xs font-black text-gray-800 leading-none">{currentUser.name.split(',')[0]}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-xl transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pb-32 pt-6 px-4 md:px-8 max-w-5xl mx-auto w-full">
        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={changeTab} user={currentUser} />
    </div>
  );
};

export default App;
