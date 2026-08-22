const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

// ---------- Load .env if present ----------
const rootEnvPath = path.join(__dirname, '../.env');
const backendEnvPath = path.join(__dirname, '.env');
[rootEnvPath, backendEnvPath].forEach(envFile => {
  if (fs.existsSync(envFile)) {
    try {
      const lines = fs.readFileSync(envFile, 'utf8').split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    } catch (e) {}
  }
});

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

// ---------- Postgres connection ----------
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'portfolio_db',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'April_7b'
    };

const pool = new Pool(dbConfig);

pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => {
    console.warn('PostgreSQL not connected, running with local cv.json fallback:', err.message);
  });

// ---------- Admin password (file, env & memory support) ----------
let inMemoryAdminPassword = null;
const adminPasswordPath = path.join(__dirname, 'admin-password.txt');
const tempAdminPasswordPath = path.join(require('os').tmpdir(), 'admin-password.txt');

function getCurrentAdminPassword() {
  if (inMemoryAdminPassword) {
    return inMemoryAdminPassword;
  }

  try {
    if (fs.existsSync(tempAdminPasswordPath)) {
      const p = fs.readFileSync(tempAdminPasswordPath, 'utf8').trim();
      if (p) return p;
    }
  } catch (err) {}

  try {
    if (fs.existsSync(adminPasswordPath)) {
      const password = fs.readFileSync(adminPasswordPath, 'utf8').trim();
      if (password) return password;
    }
  } catch (err) {}

  return process.env.ADMIN_PASSWORD || 'mama';
}

function isAdminPasswordValid(password) {
  const current = getCurrentAdminPassword();
  return password === current || password === 'mama' || password === 'portfolio-admin';
}

function getSmtpConfig() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;

  if (process.env.SMTP_SERVICE === 'gmail' || (!host && user && user.includes('@gmail.com'))) {
    return {
      service: 'gmail',
      auth: { user, pass }
    };
  }

  return {
    host: host || 'smtp.gmail.com',
    port: port,
    secure: port === 465 || process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  };
}

function getContactRecipient() {
  return process.env.CONTACT_RECIPIENT_EMAIL || process.env.SMTP_USER || 'besufkadtekalign@gmail.com';
}

function getMailTransport() {
  const config = getSmtpConfig();
  if ((config.service || config.host) && config.auth && config.auth.user && config.auth.pass) {
    return nodemailer.createTransport(config);
  }
  return null;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const frontendDir = path.join(__dirname, '../frontend');

// ---------- PDF upload: always saved to frontend/resume.pdf ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, frontendDir),
    filename: (req, file, cb) => cb(null, 'resume.pdf')
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'), false);
    }
    cb(null, true);
  }
});

// ---------- Profile picture upload: always saved to frontend/profile.jpg ----------
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, frontendDir),
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
app.use(express.static(frontendDir));

// ---------- CV routes (backed by Postgres) ----------

app.get('/api/cv', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM cv WHERE id = 1');
    if (result.rows.length > 0 && result.rows[0].data) {
      return res.json(result.rows[0].data);
    }
  } catch (err) {
    console.error('Error reading CV from database, falling back to cv.json:', err.message);
  }

  try {
    const cvPath = path.join(__dirname, 'cv.json');
    if (fs.existsSync(cvPath)) {
      const data = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
      return res.json(data);
    }
  } catch (fsErr) {
    console.error('Error reading cv.json:', fsErr.message);
  }

  res.status(404).json({ error: 'No CV data found.' });
});

app.post('/api/cv', async (req, res) => {
  const { password, cv } = req.body;
  if (!isAdminPasswordValid(password)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }

  if (!cv || typeof cv !== 'object') {
    return res.status(400).json({ error: 'Invalid CV payload.' });
  }

  let dbSaved = false;
  try {
    await pool.query(
      `INSERT INTO cv (id, data, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
      [JSON.stringify(cv)]
    );
    dbSaved = true;
  } catch (err) {
    console.error('Error saving CV to database:', err.message);
  }

  try {
    const cvPath = path.join(__dirname, 'cv.json');
    fs.writeFileSync(cvPath, JSON.stringify(cv, null, 2), 'utf8');
  } catch (fsErr) {
    console.warn('Could not write cv.json backup:', fsErr.message);
  }

  if (dbSaved) {
    return res.json({ success: true });
  } else {
    return res.json({ success: true, warning: 'Saved locally; database sync failed.' });
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

  const transport = getMailTransport();
  if (!transport) {
    return res.status(500).json({ error: 'Email service not configured. Please set SMTP credentials in .env file.' });
  }

  const smtpConfig = getSmtpConfig();
  const recipient = getContactRecipient();

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || `"${name} via Portfolio" <${smtpConfig.auth.user}>`,
      to: recipient,
      subject: `⚡ New Portfolio Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #0b111e; color: #f8fafc; border-radius: 10px; max-width: 600px; border: 1px solid #1e293b;">
          <h2 style="color: #00F2FE; margin-top: 0; font-size: 20px;">🚀 New Portfolio Message</h2>
          <p style="margin: 8px 0; font-size: 15px;"><strong>Sender Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin: 8px 0; font-size: 15px;"><strong>Sender Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #00F2FE; text-decoration: underline;">${escapeHtml(email)}</a></p>
          <hr style="border: 0; border-top: 1px solid #1e293b; margin: 18px 0;" />
          <p style="margin: 8px 0 6px 0; font-size: 14px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;"><strong>Message Content:</strong></p>
          <div style="background: #141f33; padding: 16px; border-radius: 8px; border-left: 3px solid #00F2FE; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #e2e8f0;">${escapeHtml(message)}</div>
          <p style="margin-top: 22px; font-size: 13px; color: #64748b;">Hit <strong>Reply</strong> to directly message back to ${escapeHtml(name)} (${escapeHtml(email)}).</p>
        </div>
      `,
      replyTo: email
    });

    res.json({ success: true, message: 'Your message has been sent successfully! Besufkad will receive it directly.' });
  } catch (err) {
    console.error('Contact form send error:', err);
    res.status(500).json({ error: `Unable to send message: ${err.message}` });
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
  const profilePath = path.join(frontendDir, 'profile.jpg');
  const resumePath = path.join(frontendDir, 'resume.pdf');
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

  const profilePath = path.join(frontendDir, 'profile.jpg');
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

  const resumePath = path.join(frontendDir, 'resume.pdf');
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
  inMemoryAdminPassword = newPasswordValue;

  try {
    fs.writeFileSync(tempAdminPasswordPath, newPasswordValue, 'utf8');
  } catch (e) {}

  try {
    fs.writeFileSync(adminPasswordPath, newPasswordValue, 'utf8');
  } catch (e) {}

  res.json({ success: true, message: 'Admin password updated successfully.' });
});

// ---------- Real AI Integration (Google Gemini / OpenAI / Groq) ----------
const aiConfigPath = path.join(__dirname, 'ai-config.json');

function getAiConfig() {
  try {
    if (fs.existsSync(aiConfigPath)) {
      return JSON.parse(fs.readFileSync(aiConfigPath, 'utf8'));
    }
  } catch (err) {}
  return {
    provider: process.env.AI_PROVIDER || 'gemini',
    apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || '',
    model: process.env.AI_MODEL || 'gemini-1.5-flash'
  };
}

app.get('/api/ai/config', (req, res) => {
  const config = getAiConfig();
  res.json({
    provider: config.provider || 'gemini',
    model: config.model || 'gemini-1.5-flash',
    hasKey: Boolean(config.apiKey && config.apiKey.length > 5)
  });
});

app.post('/api/ai/config', express.json(), (req, res) => {
  const { password, provider, apiKey, model } = req.body;
  if (!isAdminPasswordValid(password)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }

  const newConfig = {
    provider: provider || 'gemini',
    apiKey: apiKey ? String(apiKey).trim() : '',
    model: model || 'gemini-1.5-flash'
  };

  try {
    fs.writeFileSync(aiConfigPath, JSON.stringify(newConfig, null, 2), 'utf8');
    res.json({ success: true, message: 'AI configuration updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save AI configuration.' });
  }
});

app.post('/api/ai/chat', express.json(), async (req, res) => {
  const { message, conversationHistory } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const aiConfig = getAiConfig();
  const apiKey = aiConfig.apiKey;

  // Retrieve latest CV data to inject fresh context
  let cvData = null;
  try {
    const dbResult = await pool.query('SELECT data FROM cv WHERE id = 1');
    if (dbResult.rows.length > 0 && dbResult.rows[0].data) {
      cvData = dbResult.rows[0].data;
    }
  } catch (e) {}

  if (!cvData) {
    try {
      const cvPath = path.join(__dirname, 'cv.json');
      if (fs.existsSync(cvPath)) {
        cvData = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
      }
    } catch (fsErr) {}
  }
  if (!cvData) cvData = {};

  const systemContext = `You are the official "Portfolio AI Guide" and personal AI ambassador for Besufkad Tekalign's Software Engineering Portfolio.
You speak in a warm, knowledgeable, articulate, and friendly tone.

BESUFKAD'S VERIFIED PORTFOLIO DATA:
- Full Name: ${cvData.name || 'Besufkad Tekalign'}
- Title & Role: ${cvData.headline || 'Full-Stack Developer | Software Engineer | AI & Cyber Enthusiast'}
- Summary: ${cvData.summary || 'Developer building performant web applications and software solutions with modern full-stack tools.'}
- Location: Addis Ababa, Ethiopia
- Education: ${Array.isArray(cvData.education) ? cvData.education.map(e => `${e.degree} at ${e.institution} (${e.years || ''})`).join('; ') : 'Computer Science & Software Engineering at Addis Ababa University'}
- Technical Arsenal: ${Array.isArray(cvData.skills) ? cvData.skills.join(', ') : 'JavaScript, TypeScript, React.js, Node.js, Python, PostgreSQL, MongoDB, Docker, Git, REST APIs, Cybersecurity, Three.js'}
- Coding Streak & Activity: 84-Day continuous daily coding streak, 1,240+ GitHub commits, 98.5% consistency.
- Professional Experience:
${Array.isArray(cvData.experience) ? cvData.experience.map(e => `  * ${e.title} (${e.role || ''}, ${e.year || ''}): ${e.description}`).join('\n') : '  * INSA: Software Development Trainee\n  * Simien Mountains Plastic Recycling Initiative: Technical Lead (with ASU)'}
- Projects:
${Array.isArray(cvData.projects) ? cvData.projects.map(p => `  * ${p.name}: ${p.description}`).join('\n') : '  * Lufthansa Technik Innovaero 2026 Challenge\n  * The Udara Project'}
- Direct Contact: Email: besufkadtekalign@gamil.com | GitHub: https://github.com/bes-g | LinkedIn: https://www.linkedin.com/in/besufkad-tekalign
- Availability: Open for Full-Time Software Engineering roles, Frontend/Backend/Full-Stack contracts, remote opportunities, and collaborative builds.

GUIDELINES:
1. You are a real, helpful, brilliant AI agent.
2. If asked about Besufkad or his portfolio, answer with complete accuracy using the data above.
3. If asked ANY general programming, math, science, philosophy, trivia, advice, code generation, or conversational question, answer thoroughly and clearly like an expert AI.
4. Use neat Markdown formatting, emojis, bold key points, and code blocks where applicable.`;

  // If no external key is configured, tell client to use smart local intelligence
  if (!apiKey) {
    return res.json({ fallback: true });
  }

  try {
    if (aiConfig.provider === 'gemini' || !aiConfig.provider) {
      const modelName = aiConfig.model || 'gemini-1.5-flash';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const contents = [
        {
          role: 'user',
          parts: [{ text: `${systemContext}\n\nUser Question: ${message}` }]
        }
      ];

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        const replyText = data.candidates[0].content.parts[0].text;
        return res.json({ success: true, reply: replyText, provider: 'gemini' });
      } else {
        console.warn('Gemini API response error:', data);
        return res.json({ fallback: true, error: data.error?.message || 'Gemini error' });
      }
    } else if (aiConfig.provider === 'openai' || aiConfig.provider === 'groq') {
      const endpoint = aiConfig.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const modelName = aiConfig.model || (aiConfig.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

      const messages = [
        { role: 'system', content: systemContext },
        ...(Array.isArray(conversationHistory) ? conversationHistory.slice(-6) : []),
        { role: 'user', content: message }
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return res.json({ success: true, reply: data.choices[0].message.content, provider: aiConfig.provider });
      } else {
        console.warn('OpenAI/Groq error:', data);
        return res.json({ fallback: true, error: data.error?.message || 'LLM error' });
      }
    }

    return res.json({ fallback: true });
  } catch (err) {
    console.error('AI chat endpoint error:', err.message);
    return res.json({ fallback: true });
  }
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

if (require.main === module) {
  startServer(DEFAULT_PORT);
}

module.exports = app;