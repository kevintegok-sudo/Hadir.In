
import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord, JournalEntry, PermissionRequest, PermissionStatus, AppSettings } from './types';
import { MOCK_USERS, DEFAULT_SETTINGS } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AbsenView from './components/AbsenView';
import JournalView from './components/JournalView';
import PermissionView from './components/PermissionView';
import AdminDashboard from './components/AdminDashboard';
import LoginView from './components/LoginView';
import { LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

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
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={currentUser} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-auto bg-gray-50/50">
        <header className="bg-white px-8 py-6 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-2xl font-black text-gray-800 tracking-tight capitalize">
            {activeTab === 'admin' ? 'Pusat Kendali Admin' : activeTab === 'dashboard' ? 'Beranda' : activeTab}
          </h1>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-black text-gray-800 tracking-tight">{currentUser.name}</span>
              <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{currentUser.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300"
              title="Logout"
            >
              <LogOut size={22} />
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
