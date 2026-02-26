
/**
 * Utility keamanan sederhana untuk mengaburkan data di LocalStorage.
 * Dalam produksi nyata, gunakan pustaka enkripsi seperti CryptoJS dengan kunci dari server.
 */

const SECRET_SALT = 'smkn1_pocoranak_secure_v1';

export const secureStorage = {
  setItem: (key: string, value: any) => {
    try {
      const jsonValue = JSON.stringify(value);
      // Sederhana: Base64 obfuscation + salt (untuk demo keamanan dasar)
      const encoded = btoa(encodeURIComponent(jsonValue + SECRET_SALT));
      localStorage.setItem(key, encoded);
    } catch (e) {
      console.error('Error saving to secure storage', e);
    }
  },

  getItem: <T>(key: string): T | null => {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      const decoded = decodeURIComponent(atob(encoded));
      if (decoded.endsWith(SECRET_SALT)) {
        const jsonValue = decoded.slice(0, -SECRET_SALT.length);
        return JSON.parse(jsonValue) as T;
      }
      return null;
    } catch (e) {
      console.error('Error reading from secure storage', e);
      return null;
    }
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  }
};
