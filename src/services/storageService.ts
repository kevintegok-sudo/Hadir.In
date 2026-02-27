
import { User, AttendanceRecord, JournalEntry, PermissionRequest, AppSettings, AppNotification, PermissionStatus } from '../../types';
import { MOCK_USERS, DEFAULT_SETTINGS } from '../../constants';

const DB_KEYS = {
  USERS: 'smkn1_users',
  ATTENDANCE: 'smkn1_attendance',
  JOURNALS: 'smkn1_journals',
  PERMISSIONS: 'smkn1_permissions',
  SETTINGS: 'smkn1_settings',
  NOTIFICATIONS: 'smkn1_notifications'
};

const get = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
};

const set = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const storageService = {
  // Users
  getUsers: (): User[] => get(DB_KEYS.USERS, MOCK_USERS),
  addUser: (user: Omit<User, 'id'>): User => {
    const users = storageService.getUsers();
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
    users.push(newUser as User);
    set(DB_KEYS.USERS, users);
    return newUser as User;
  },
  deleteUser: (id: string) => {
    const users = storageService.getUsers();
    set(DB_KEYS.USERS, users.filter(u => u.id !== id));
  },
  login: (nip: string, pass: string): User | null => {
    const users = storageService.getUsers();
    const user = users.find(u => String(u.nip) === String(nip) && String(u.password) === String(pass));
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return null;
  },

  // Attendance
  getAttendance: (): AttendanceRecord[] => get(DB_KEYS.ATTENDANCE, []),
  addAttendance: (record: Omit<AttendanceRecord, 'id'>): AttendanceRecord => {
    const data = storageService.getAttendance();
    const newRecord = { ...record, id: Math.random().toString(36).substr(2, 9) };
    data.push(newRecord as AttendanceRecord);
    set(DB_KEYS.ATTENDANCE, data);
    return newRecord as AttendanceRecord;
  },

  // Journals
  getJournals: (): JournalEntry[] => get(DB_KEYS.JOURNALS, []),
  addJournal: (entry: Omit<JournalEntry, 'id'>): JournalEntry => {
    const data = storageService.getJournals();
    const newEntry = { ...entry, id: Math.random().toString(36).substr(2, 9) };
    data.push(newEntry as JournalEntry);
    set(DB_KEYS.JOURNALS, data);
    return newEntry as JournalEntry;
  },

  // Permissions
  getPermissions: (): PermissionRequest[] => get(DB_KEYS.PERMISSIONS, []),
  addPermission: (req: Omit<PermissionRequest, 'id' | 'status'>): PermissionRequest => {
    const data = storageService.getPermissions();
    const newReq: PermissionRequest = { 
      ...req, 
      id: Math.random().toString(36).substr(2, 9),
      status: PermissionStatus.PENDING
    };
    data.push(newReq);
    set(DB_KEYS.PERMISSIONS, data);
    return newReq;
  },
  updatePermissionStatus: (id: string, status: PermissionStatus): PermissionRequest | null => {
    const data = storageService.getPermissions();
    const index = data.findIndex(p => p.id === id);
    if (index !== -1) {
      data[index].status = status;
      set(DB_KEYS.PERMISSIONS, data);
      return data[index];
    }
    return null;
  },

  // Settings
  getSettings: (): AppSettings => get(DB_KEYS.SETTINGS, DEFAULT_SETTINGS),
  updateSettings: (settings: AppSettings): AppSettings => {
    set(DB_KEYS.SETTINGS, settings);
    return settings;
  },

  // Notifications
  getNotifications: (userId: string): AppNotification[] => {
    const all = get<AppNotification[]>(DB_KEYS.NOTIFICATIONS, []);
    return all.filter(n => n.userId === userId);
  },
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): AppNotification => {
    const all = get<AppNotification[]>(DB_KEYS.NOTIFICATIONS, []);
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    all.unshift(newNotif);
    if (all.length > 500) all.pop();
    set(DB_KEYS.NOTIFICATIONS, all);
    return newNotif;
  },
  markAllNotificationsRead: (userId: string) => {
    const all = get<AppNotification[]>(DB_KEYS.NOTIFICATIONS, []);
    const updated = all.map(n => n.userId === userId ? { ...n, isRead: true } : n);
    set(DB_KEYS.NOTIFICATIONS, updated);
  }
};
