const express = require('express');
const session = require('express-session');
const url = require('url');
const errsole = console;
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const sessions = {};
const https = require('https');
const multer = require('multer');
const USE_HTTPS = process.env.HTTPS === 'true';

//lab9 - keycloak
const keycloakConfig = require('./keycloak-config');

const app = express();

//session configuration
const memoryStore = new session.MemoryStore();

app.use(
  session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  }),
);

let keycloak;
try {
  keycloak = keycloakConfig.initKeycloak(memoryStore);
  console.log('Keycloak initialized');
} catch (err) {
  console.warn('Keycloak initialization warning:', err.message);
  console.warn('Keycloak SSO will not be available');
}

const PORT = 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const tempName = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(
      file.originalname,
    )}`;
    cb(null, tempName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

app.use(
  cors({
    origin: ['http://localhost:4200', 'https://localhost:4200'],
    credentials: true,
  }),
);

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

const rateLimit = {};
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minut

setInterval(() => {
  const now = Date.now();
  for (const ip in rateLimit) {
    if (now - rateLimit[ip].start > WINDOW_MS) {
      delete rateLimit[ip];
    }
  }
}, WINDOW_MS);

// Conectare la SQLite
const db = new sqlite3.Database('./utilizatori.db', (err) => {
  if (err) console.error(err.message);
  else errsole.log('Conectat la baza de date SQLite.');
});

db.run(`
  CREATE TABLE IF NOT EXISTS utilizatori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    lastName TEXT,
    firstName TEXT,
    displayName TEXT,
    url TEXT,
    tip TEXT DEFAULT 'utilizator',
    caleImagineProfil TEXT,
    timpInregistrare DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function isRateLimited(ip) {
  const now = Date.now();
  if (!rateLimit[ip]) {
    rateLimit[ip] = { count: 1, start: now };
    return false;
  }

  if (now - rateLimit[ip].start > WINDOW_MS) {
    rateLimit[ip] = { count: 1, start: now };
    return false;
  }

  rateLimit[ip].count++;
  return rateLimit[ip].count > MAX_REQUESTS;
}

function isValidUser(u) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  //l7
  if (!u.username || !usernameRegex.test(u.username)) return false;
  if (!emailRegex.test(u.email)) return false;
  if (!u.password || u.password.length < 8 || u.password.length > 64) return false;
  if (u.firstName && u.firstName.length > 30) return false;
  if (u.lastName && u.lastName.length > 30) return false;
  if (u.displayName && u.displayName.length > 40) return false;
  if (u.url && u.url.length > 200) return false;

  return true;
}

// Salvare in fisier de loguri - ora, ip, resursa, status raspuns...
const logFile = path.join(__dirname, 'server.log');

function logRequest(req, statusCode, additionalInfo = '') {
  const now = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  const body = req.body ? JSON.stringify(req.body).substring(0, 100) : 'None';

  let logLine = `[${now}] ${req.method} ${req.originalUrl} - ${statusCode} - IP: ${ip}`;
  if (additionalInfo) {
    logLine += ` - ${additionalInfo}`;
  }
  logLine += ` - UserAgent: ${userAgent}\n`;

  fs.appendFileSync(logFile, logLine);
  console.log(logLine.trim());
}

// Middleware pentru logging tuturor cererilor
app.use((req, res, next) => {
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function (data) {
    logRequest(req, res.statusCode);
    return originalJson.call(this, data);
  };

  res.send = function (data) {
    if (!res.headersSent) {
      logRequest(req, res.statusCode);
    }
    return originalSend.call(this, data);
  };

  next();
});

//lab9
app.get('/login-sso', keycloak.middleware(), (req, res) => {
  let redirected = false;

  const timeout = setTimeout(() => {
    if (!redirected) {
      //   return res.redirect('http://localhost:4200/login?ssoError=1');
      res.json({ success: false, ssoError: true });
    }
  }, 3000); // 3s

  try {
    redirected = true;
    clearTimeout(timeout);
    res.redirect('/private');
  } catch (err) {
    // res.redirect('http://localhost:4200/login?ssoError=1');
    res.json({ success: false, ssoError: true });
  }
});

app.get('/private', keycloak.protect(), (req, res) => {
  const username = req.kauth.grant.access_token.content.preferred_username;
  const email = req.kauth.grant.access_token.content.email;

  res.send(`
    <h2>Bun venit, ${username}!</h2>
    <p>Email: ${email}</p>
    <a href="http://localhost:4200">Home</a>
  `);
});

//lab8 - login
app.post('/verificare', (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  db.get('SELECT * FROM utilizatori WHERE username = ?', [username.toLowerCase()], (err, user) => {
    if (!user || !bcrypt.compareSync(password, user.password)) {
      logRequest(req, 401, `LOGIN FAILED - Username: ${username}`);
      res.status(401).json({ success: false });
      return;
    }
    logRequest(req, 200, `LOGIN SUCCESS - Username: ${username}`);
    res.json({ success: true, username: user.username });
  });
});

app.get('/logout', (req, res) => {
  console.log('Logout requested');
  const ip = req.ip || req.connection.remoteAddress;

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        logRequest(req, 500, `LOGOUT FAILED - Error: ${err.message}`);
        res.status(500).json({ message: 'Logout failed' });
        return;
      }
      console.log('Session destroyed, redirecting to login');
      logRequest(req, 200, `LOGOUT SUCCESS`);
      res.json({ logout: true });
    });
  } else {
    logRequest(req, 200, `LOGOUT - No active session`);
    res.json({ logout: true });
  }
});

//lab7 - xss persistent
app.get('/allusers', (req, res) => {
  db.all('SELECT username FROM utilizatori', [], (err, rows) => {
    let html = '<h2>Lista utilizatori care au cont:</h2>';
    rows.forEach((u) => {
      html += `<p>${u.username}</p>`;
    });
    res.send(html);
  });
});

//lab6 - xss non-persistent - NOW SEARCH USERS
app.get('/cauta', (req, res) => {
  const searchTerm = req.query.nume || '';

  if (!searchTerm.trim()) {
    return res.json([]);
  }

  const query = `SELECT username, firstName, lastName, email FROM utilizatori WHERE username LIKE ? OR firstName LIKE ? OR lastName LIKE ? LIMIT 10`;
  const searchPattern = `%${searchTerm}%`;

  db.all(query, [searchPattern, searchPattern, searchPattern], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows || []);
  });
});

app.post(
  '/register',
  (req, res, next) => {
    console.log('Register POST received, processing multer...');
    upload.single('profileImage')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      }
      next();
    });
  },
  (req, res) => {
    try {
      console.log('Register request received');
      // Log body without sensitive data
      const safeBody = { ...req.body };
      delete safeBody.password;
      console.log('Body:', safeBody);
      console.log(
        'File:',
        req.file
          ? {
              fieldname: req.file.fieldname,
              originalname: req.file.originalname,
              size: req.file.size,
            }
          : 'None',
      );

      if (isRateLimited(req.ip)) {
        res.status(429).json({ message: 'Prea multe încercări. Așteaptă 1 minut.' });
        return;
      }

      const userData = req.body;

      if (!isValidUser(userData)) {
        // Delete uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        res.status(400).json({ message: 'Date invalide!' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: 'Profile image is required!' });
        return;
      }

      userData.password = bcrypt.hashSync(userData.password, 10);

      // Rename the file with the username
      const username = userData.username.trim().toLowerCase();
      const ext = path.extname(req.file.originalname);
      const newFilename = `${username}-profile${ext}`;
      const newPath = path.join(uploadsDir, newFilename);

      fs.renameSync(req.file.path, newPath);
      console.log('File saved to:', newPath);

      const sql = `
    INSERT INTO utilizatori
    (username, email, password, lastName, firstName, displayName, url, caleImagineProfil)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

      const values = [
        username,
        userData.email,
        userData.password,
        userData.lastName || null,
        userData.firstName || null,
        userData.displayName || null,
        userData.url || null,
        newPath,
      ];

      db.run(sql, values, function (err) {
        if (err) {
          console.error('Database error:', err);
          // Delete the uploaded file if registration fails
          try {
            fs.unlinkSync(newPath);
          } catch (e) {
            console.error('Error deleting file:', e.message);
          }
          res.status(409).json({ message: 'Username sau email deja existent!' });
          logRequest(
            req,
            409,
            `REGISTER FAILED - Username: ${username}, Email: ${userData.email}, Error: Duplicate entry`,
          );
        } else {
          console.log('User registered successfully:', username);
          res.status(201).json({ message: 'Înregistrare reușită!', id: this.lastID });
          logRequest(
            req,
            201,
            `REGISTER SUCCESS - Username: ${username}, Email: ${userData.email}, Image: ${newFilename}`,
          );
        }
      });
    } catch (error) {
      console.error('Register endpoint error:', error.message);
      console.error('Stack:', error.stack);
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error('Error deleting file after error:', e.message);
        }
      }
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },
);

app.get('/profile-image/:username', (req, res) => {
  const username = req.params.username.toLowerCase();
  const imageDir = uploadsDir;

  // Check for image files with different extensions
  const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  let imageFile = null;

  for (const ext of possibleExtensions) {
    const filePath = path.join(imageDir, `${username}-profile${ext}`);
    if (fs.existsSync(filePath)) {
      imageFile = filePath;
      break;
    }
  }

  if (!imageFile) {
    res.status(404).json({ message: 'Profile image not found' });
    return;
  }

  res.sendFile(imageFile);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Uncaught error:', err.message);
  console.error('Stack:', err.stack);

  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 2MB limit' });
    }
    return res.status(400).json({ message: 'File upload error: ' + err.message });
  }

  res.status(500).json({ message: 'Server error: ' + err.message });
});

app.use((req, res) => {
  res.status(404).send('Pagina nu a fost găsită.');
});

//lab11 - HTTPS server
// const httpsOptions = {
//   key: fs.readFileSync(path.join(__dirname, 'key.pem')),
//   cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
// };

// const server = https.createServer(httpsOptions, app);

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.error('Uncaught Exception:', err);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   console.error('Unhandled Rejection:', err);
// });

// server.listen(PORT, () => {
//   errsole.log(`Serverul rulează la https://localhost:${PORT}`);
// });

if (USE_HTTPS) {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS server running on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`HTTP server running on http://localhost:${PORT}`);
  });
}
