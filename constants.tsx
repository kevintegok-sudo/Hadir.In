
import React from 'react';
import { User, AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  schoolLocation: {
    lat: -6.175392,
    lng: 106.827153,
    radius: 100,
    address: "Pusat Sekolah (Default: Monas Jakarta)"
  },
  attendanceHours: {
    startIn: "06:30",
    endIn: "08:30",
    startOut: "15:00",
    endOut: "17:30"
  }
};

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Administrator', role: 'admin', nip: 'admin', password: 'admin', avatar: 'https://picsum.photos/seed/admin/200' },
  { id: '2', name: 'Budi Santoso, M.Pd', role: 'admin', nip: '198501012010011001', password: 'password123', avatar: 'https://picsum.photos/seed/budi/200' },
  { id: '3', name: 'Siti Aminah, S.Si', role: 'guru', nip: '199002022015012002', password: 'password123', avatar: 'https://picsum.photos/seed/siti/200' },
  { id: '4', name: 'Andi Wijaya', role: 'pegawai', nip: '198803032012011003', password: 'password123', avatar: 'https://picsum.photos/seed/andi/200' },
];

export const SUBJECTS = [
  'Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'Bahasa Inggris', 'PJOK', 'Seni Budaya'
];

export const CLASSES = [
  'X-IPA-1', 'X-IPA-2', 'XI-IPA-1', 'XII-IPS-1', 'XII-IPS-2'
];
