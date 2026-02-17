
export enum AttendanceStatus {
  HADIR = 'Hadir',
  PULANG = 'Pulang',
  IZIN = 'Izin',
  ALFA = 'Alfa'
}

export enum PermissionStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'guru' | 'pegawai';
  nip: string;
  password?: string;
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  type: 'in' | 'out';
  photo: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  subject: string;
  className: string;
  material: string;
  notes: string;
}

export interface PermissionRequest {
  id: string;
  userId: string;
  userName: string;
  dateStart: string;
  dateEnd: string;
  type: 'Sakit' | 'Cuti' | 'Dinas';
  reason: string;
  status: PermissionStatus;
  attachment?: string;
}

export interface AppSettings {
  schoolLocation: {
    lat: number;
    lng: number;
    radius: number;
    address: string;
  };
  attendanceHours: {
    startIn: string;
    endIn: string;
    startOut: string;
    endOut: string;
  };
}

export interface AppState {
  currentUser: User | null;
  attendanceRecords: AttendanceRecord[];
  journals: JournalEntry[];
  permissions: PermissionRequest[];
  settings: AppSettings;
}
