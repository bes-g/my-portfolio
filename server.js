const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

// ---------- Postgres connection ----------
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'portfolio_db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'April_7b'
});

pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL (portfolio_db)');
    client.release();
  })
  .catch(err => {
    console.error('Failed to connect to PostgreSQL:', err.message);
  });

// ---------- Admin password (still file-based, unchanged) ----------
const adminPasswordPath = path.join(__dirname, 'admin-password.txt');
const legacyAdminPasswordPath = path.join(__dirname, 'n-password.txt');

function getCurrentAdminPassword() {
  try {
    if (fs.existsSync(adminPasswordPath)) {
      const password = fs.readFileSync(adminPasswordPath, 'utf8').trim();
      if (password) return password;
    }
  } catch (err) {}

  try {
    if (fs.existsSync(legacyAdminPasswordPath)) {
      const legacyPassword = fs.readFileSync(legacyAdminPasswordPath, 'utf8').trim();
      if (legacyPassword) {
        try {
          fs.writeFileSync(adminPasswordPath, legacyPassword, 'utf8');
        } catch (writeErr) {
          console.warn('Could not rename legacy password file:', writeErr.message);
        }
        return legacyPassword;
      }
    }
  } catch (err) {}

  return process.env.ADMIN_PASSWORD || 'portfolio-admin';
}

function isAdminPasswordValid(password) {
  return password === getCurrentAdminPassword();
}

const contactRecipient = process.env.CONTACT_RECIPIENT_EMAIL || 'besufkadtekalign@gamil.com';
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

function hasSmtpConfig() {
  return Boolean(smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass);
}

const mailTransport = hasSmtpConfig() ? nodemailer.createTransport(smtpConfig) : null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------- PDF upload: always saved as resume.pdf (no apostrophes/spaces to avoid mismatches) ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, __dirname),
    filename: (req, file, cb) => cb(null, 'resume.pdf')
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'), false);
    }
    cb(null, true);
  }
});

// ---------- Profile picture upload: always saved as profile.jpg ----------
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, __dirname),
    filename: (req, file, cb) => cb(null, 'profile.jpg')
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG or WEBP images are allowed.'), false);
    }
    cb(null, true);
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// ---------- CV routes (backed by Postgres) ----------

app.get('/api/cv', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM cv WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No CV data found.' });
    }
    res.json(result.rows[0].data);
  } catch (err) {
    console.error('Error reading CV from database:', err);
    res.status(500).json({ error: 'Unable to read CV data.' });
  }
});

app.post('/api/cv', async (req, res) => {
  const { password, cv } = req.body;
  if (!isAdminPasswordValid(password)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }

  if (!cv || typeof cv !== 'object') {
    return res.status(400).json({ error: 'Invalid CV payload.' });
  }

  try {
    await pool.query(
      `INSERT INTO cv (id, data, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
      [JSON.stringify(cv)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving CV to database:', err);
    res.status(500).json({ error: 'Unable to save CV data.' });
  }
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (isAdminPasswordValid(password)) {
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  if (!hasSmtpConfig() || !mailTransport) {
    return res.status(500).json({ error: 'Email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.' });
  }

  try {
    await mailTransport.sendMail({
      from: process.env.SMTP_FROM || smtpConfig.auth.user,
      to: contactRecipient,
      subject: `Portfolio contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      replyTo: email
    });

    res.json({ success: true, message: 'Your message has been sent successfully.' });
  } catch (err) {
    console.error('Contact form send error:', err);
    res.status(500).json({ error: 'Unable to send message. Please try again later.' });
  }
});

app.post('/api/upload-pdf', upload.single('cvPdf'), (req, res) => {
  const password = req.body.password;
  if (!isAdminPasswordValid(password)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a PDF file.' });
  }

  res.json({ success: true, message: 'CV uploaded successfully.' });
});

app.get('/api/uploads/status', (req, res) => {
  const profilePath = path.join(__dirname, 'profile.jpg');
  const resumePath = path.join(__dirname, 'resume.pdf');
  res.json({
    profileUploaded: fs.existsSync(profilePath),
    cvUploaded: fs.existsSync(resumePath)
  });
});

app.post('/api/upload-photo', imageUpload.single('profilePic'), (req, res) => {
  const password = req.body.password;
  if (!isAdminPasswordValid(password)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Please upload an image file.' });
  }

  res.json({ success: true, message: 'Profile photo uploaded successfully.' });
});

app.delete('/api/upload-photo', express.json(), (req, res) => {
  const password = req.body.password;
  if (!isAdminPasswordValid(password)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }

  const profilePath = path.join(__dirname, 'profile.jpg');
  if (!fs.existsSync(profilePath)) {
    return res.json({ success: true, message: 'Profile photo already removed.' });
  }

  fs.unlink(profilePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to delete profile photo.' });
    }
    res.json({ success: true, message: 'Profile photo deleted successfully.' });
  });
});

app.delete('/api/upload-pdf', express.json(), (req, res) => {
  const password = req.body.password;
  if (!isAdminPasswordValid(password)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }

  const resumePath = path.join(__dirname, 'resume.pdf');
  if (!fs.existsSync(resumePath)) {
    return res.json({ success: true, message: 'CV already removed.' });
  }

  fs.unlink(resumePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to delete CV.' });
    }
    res.json({ success: true, message: 'CV deleted successfully.' });
  });
});

app.post('/api/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!isAdminPasswordValid(currentPassword)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid current password.' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters.' });
  }

  const newPasswordValue = newPassword.trim();
  fs.writeFile(adminPasswordPath, newPasswordValue, 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to update admin password.' });
    }
    res.json({ success: true, message: 'Admin password updated successfully.' });
  });
});

function startServer(port, retryCount = 0) {
  const server = app.listen(port, () => {
    console.log(`Portfolio server running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      if (retryCount < 5) {
        console.warn(`Port ${port} is in use. Trying port ${nextPort}...`);
        server.close(() => startServer(nextPort, retryCount + 1));
        return;
      }
    }
    console.error('Server failed to start:', err);
    process.exit(1);
  });
}

startServer(DEFAULT_PORT);