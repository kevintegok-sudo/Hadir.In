import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "db.json");

// Initial data structure
const INITIAL_DATA = {
  users: [
    { id: '1', name: 'Administrator', role: 'admin', nip: 'admin', password: 'admin', avatar: 'https://picsum.photos/seed/admin/200' },
    { id: '2', name: 'Budi Santoso, M.Pd', role: 'admin', nip: '198501012010011001', password: 'password123', avatar: 'https://picsum.photos/seed/budi/200' },
    { id: '3', name: 'Siti Aminah, S.Si', role: 'guru', nip: '199002022015012002', password: 'password123', avatar: 'https://picsum.photos/seed/siti/200' },
    { id: '4', name: 'Andi Wijaya', role: 'pegawai', nip: '198803032012011003', password: 'password123', avatar: 'https://picsum.photos/seed/andi/200' },
  ],
  attendance: [],
  journals: [],
  permissions: [],
  settings: {
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
  },
  notifications: []
};

// Database helper
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    return INITIAL_DATA;
  }
  const data = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(data);
};

const writeDB = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/login", (req, res) => {
    const { nip, password } = req.body;
    const db = readDB();
    const user = db.users.find((u: any) => u.nip === nip && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.get("/api/users", (req, res) => {
    const db = readDB();
    res.json(db.users.map(({ password, ...u }: any) => u));
  });

  app.post("/api/users", (req, res) => {
    const db = readDB();
    const newUser = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9)
    };
    db.users.push(newUser);
    writeDB(db);
    const { password, ...userWithoutPassword } = newUser;
    res.json(userWithoutPassword);
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.users = db.users.filter((u: any) => u.id !== id);
    writeDB(db);
    res.json({ success: true });
  });

  app.get("/api/attendance", (req, res) => {
    const db = readDB();
    res.json(db.attendance);
  });

  app.post("/api/attendance", (req, res) => {
    const db = readDB();
    const newRecord = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9)
    };
    db.attendance.push(newRecord);
    writeDB(db);
    res.json(newRecord);
  });

  app.get("/api/journals", (req, res) => {
    const db = readDB();
    res.json(db.journals);
  });

  app.post("/api/journals", (req, res) => {
    const db = readDB();
    const newEntry = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9)
    };
    db.journals.push(newEntry);
    writeDB(db);
    res.json(newEntry);
  });

  app.get("/api/permissions", (req, res) => {
    const db = readDB();
    res.json(db.permissions);
  });

  app.post("/api/permissions", (req, res) => {
    const db = readDB();
    const newRequest = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Pending'
    };
    db.permissions.push(newRequest);
    writeDB(db);
    res.json(newRequest);
  });

  app.patch("/api/permissions/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDB();
    const index = db.permissions.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      db.permissions[index].status = status;
      writeDB(db);
      res.json(db.permissions[index]);
    } else {
      res.status(404).json({ message: "Permission not found" });
    }
  });

  app.get("/api/settings", (req, res) => {
    const db = readDB();
    res.json(db.settings);
  });

  app.put("/api/settings", (req, res) => {
    const db = readDB();
    db.settings = req.body;
    writeDB(db);
    res.json(db.settings);
  });

  app.get("/api/notifications/:userId", (req, res) => {
    const { userId } = req.params;
    const db = readDB();
    res.json(db.notifications.filter((n: any) => n.userId === userId));
  });

  app.post("/api/notifications", (req, res) => {
    const db = readDB();
    const newNotif = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    db.notifications.unshift(newNotif);
    if (db.notifications.length > 500) db.notifications.pop();
    writeDB(db);
    res.json(newNotif);
  });

  app.patch("/api/notifications/read-all/:userId", (req, res) => {
    const { userId } = req.params;
    const db = readDB();
    db.notifications = db.notifications.map((n: any) => 
      n.userId === userId ? { ...n, isRead: true } : n
    );
    writeDB(db);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
