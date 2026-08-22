# Besufkad Tekalign — Portfolio & CV Admin

A modern personal portfolio and interactive resume management system featuring an interactive 3D robot scene, dynamic CV administration panel, an AI resume guide, and a Node.js/PostgreSQL backend.

---

## Features

- **Interactive 3D Graphics**: Built with Three.js featuring a 3D robot model with head/eye tracking that follows your cursor in real time.
- **Dynamic Admin Dashboard (`/admin.html`)**:
  - Live editing of Bio, Headline, Summary, and Skills.
  - Dynamic **Contact & Social Links** manager (add Telegram, GitHub, LinkedIn, Email, Phone, X/Twitter, etc.).
  - Removable and customizable cards for Education, Training, Experience, and Projects.
  - PDF CV upload and profile photo management.
  - Password change management.
- **AI Guide Chatbot**: Built-in interactive assistant on the homepage capable of answering questions about skills, background, projects, experience, and contact methods.
- **Dual Persistence**: Powered by **PostgreSQL** database with automatic synchronization to `cv.json` as a reliable local fallback.
- **Theme Switcher**: Dark mode and Light mode with persistent user preference storage.
- **Fully Responsive**: Mobile-first responsive layout with clean hamburger navigation and optimized layout for all devices.

---

## Tech Stack

- **Frontend**: HTML5, CSS3 (Custom properties & Glassmorphism), Vanilla JavaScript, Three.js UMD.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (`pg`), JSON fallback (`cv.json`).
- **File Uploads**: Multer (Resume PDF & Profile image).

---

## Project Structure

```text
├── index.html               # Main portfolio homepage
├── admin.html               # CV Admin editor panel
├── admin-login.html         # Admin authentication screen
├── script.js                # Frontend portfolio & Three.js client logic
├── admin.js                 # Admin panel client logic
├── style.css                # Global theme & styles
├── server.js                # Express server & REST API
├── cv.json                  # CV data store & fallback
├── migrate-cv-json-to-db.js # Initial migration script for Postgres
├── package.json             # Node dependencies and scripts
└── .gitignore               # Ignored files (node_modules, .env, secrets)
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v16 or higher)
- **PostgreSQL** (Optional, falls back to `cv.json` if not configured)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables (Optional)
Create a `.env` file in the root directory to customize database credentials or email notifications:
```env
PORT=3000
PGHOST=localhost
PGPORT=5432
PGDATABASE=portfolio_db
PGUSER=postgres
PGPASSWORD=your_postgres_password
ADMIN_PASSWORD=your_admin_password
```

### 4. Migrate Data to Database (Optional)
If using PostgreSQL, initialize the table and populate it from `cv.json`:
```bash
node migrate-cv-json-to-db.js
```

### 5. Start the Server
```bash
node server.js
```
or on Windows:
```cmd
run-server.bat
```

The application will be running at **`http://localhost:3000`**.

---

## Admin Access

- **Admin URL**: `http://localhost:3000/admin.html`
- **Default Password**: `portfolio-admin` (or configured in `admin-password.txt` / environment variable)
- Once logged in, you can update any section of your portfolio, add your Telegram or social accounts, and click **Save CV** to update the site instantly.

---

## License

This project is open-source and available under the [MIT License](LICENSE).
