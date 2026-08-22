/* Portfolio behavior and Three.js 3D robot that tracks cursor.
   Uses a placeholder GLB path: 'models/robot.glb' — replace with real file path when available.
*/

(() => {
  // Basic UI initialization
  document.getElementById('year').textContent = new Date().getFullYear();

  const themeToggle = document.getElementById('theme-toggle');
  const cvDownloadLink = document.getElementById('cv-download-link');
  const profilePic = document.querySelector('.profile-pic');
  const profilePlaceholder = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="#0b0c10"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8da2b8" font-family="Inter,Arial,sans-serif" font-size="18">No Photo</text></svg>'
  );

  if (cvDownloadLink) {
    cvDownloadLink.href = `resume.pdf?v=${Date.now()}`;
  }

  const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin;

  const themePaletteBtn = document.getElementById('theme-palette-btn');
  const themeDropdown = document.getElementById('theme-dropdown');
  const currentThemeLabel = document.getElementById('current-theme-label');
  const themeOptionButtons = document.querySelectorAll('.theme-option-btn');

  const themeNameMap = {
    'cyber-cyan': 'Cyber Cyan',
    'github-dark': 'GitHub Dark',
    'github-light': 'GitHub Light',
    'navy-dark': 'Midnight Navy',
    'forest-dark': 'Emerald Forest',
    'steel-dark': 'Steel Slate',
    'cherry-dark': 'Cherry Velvet',
    'lavender-dark': 'Lavender Dark',
    'matcha-dark': 'Matcha Dark',
    'lavender-light': 'Lavender Light'
  };

  const themePaletteDotsMap = {
    'cyber-cyan': ['#07090e', '#00f2fe', '#4facfe', '#00f5a0'],
    'github-dark': ['#161B22', '#006D32', '#26A641', '#39D353'],
    'github-light': ['#FFFFFF', '#AAF2C0', '#2DA44E', '#116329'],
    'navy-dark': ['#11182D', '#3D5A99', '#60A5FA', '#93C5FD'],
    'forest-dark': ['#17231B', '#4A7A3D', '#10B981', '#34D399'],
    'steel-dark': ['#1E242A', '#54687A', '#94A3B8', '#CBD5E1'],
    'cherry-dark': ['#2B1414', '#AA5A5A', '#E8484B', '#FF9999'],
    'lavender-dark': ['#231E30', '#8E78B8', '#A855F7', '#C4B0EA'],
    'matcha-dark': ['#262B22', '#7BA05B', '#84CC16', '#A3E635'],
    'lavender-light': ['#F8F6FC', '#C084FC', '#9333EA', '#7E22CE']
  };

  function applyTheme(themeId) {
    const validTheme = themeNameMap[themeId] ? themeId : 'cyber-cyan';
    document.documentElement.dataset.theme = validTheme;
    localStorage.setItem('portfolio_theme', validTheme);

    if (currentThemeLabel) {
      currentThemeLabel.textContent = themeNameMap[validTheme] || 'Theme';
    }

    // Update navbar dots preview
    const dots = themePaletteDotsMap[validTheme] || themePaletteDotsMap['cyber-cyan'];
    for (let i = 1; i <= 4; i++) {
      const dotEl = document.getElementById(`p-dot-${i}`);
      if (dotEl && dots[i - 1]) {
        dotEl.style.backgroundColor = dots[i - 1];
      }
    }

    // Update active highlight on floating cards
    if (window.updateCyberThemeColor) {
      window.updateCyberThemeColor(validTheme);
    }

    // Update active state on dropdown buttons
    themeOptionButtons.forEach(btn => {
      const match = btn.getAttribute('data-theme-id') === validTheme;
      btn.classList.toggle('active', match);
    });
  }

  function getInitialTheme() {
    const saved = localStorage.getItem('portfolio_theme') || localStorage.getItem('theme');
    if (saved && themeNameMap[saved]) return saved;
    if (saved === 'dark') return 'cyber-cyan';
    if (saved === 'light') return 'github-light';
    return 'cyber-cyan';
  }

  if (themePaletteBtn && themeDropdown) {
    themePaletteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = themeDropdown.hasAttribute('hidden');
      if (isHidden) {
        themeDropdown.removeAttribute('hidden');
        themePaletteBtn.setAttribute('aria-expanded', 'true');
      } else {
        themeDropdown.setAttribute('hidden', '');
        themePaletteBtn.setAttribute('aria-expanded', 'false');
      }
    });

    themeOptionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeId = btn.getAttribute('data-theme-id');
        applyTheme(themeId);
        themeDropdown.setAttribute('hidden', '');
        themePaletteBtn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!themeDropdown.contains(e.target) && !themePaletteBtn.contains(e.target)) {
        themeDropdown.setAttribute('hidden', '');
        themePaletteBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  applyTheme(getInitialTheme());

  // DUAL-DOMAIN BENTO HUB (TABS & INTERACTIVE HEATMAP)
  const bentoTabBtns = document.querySelectorAll('.bento-tab-btn');
  const bentoTabPanes = document.querySelectorAll('.bento-tab-pane');
  const bentoHeatmapGrid = document.getElementById('bento-heatmap-grid');

  // Tab switching
  if (bentoTabBtns && bentoTabPanes) {
    bentoTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;
        bentoTabBtns.forEach(b => b.classList.remove('active'));
        bentoTabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  // Generate 84 heatmap contribution cells with realistic activity pattern
  if (bentoHeatmapGrid) {
    bentoHeatmapGrid.innerHTML = '';
    const levels = [
      0, 1, 2, 3, 4, 3, 2,
      1, 2, 4, 4, 3, 2, 1,
      0, 3, 4, 2, 1, 3, 4,
      2, 4, 3, 4, 2, 1, 0,
      1, 3, 4, 4, 3, 2, 4,
      3, 2, 1, 4, 4, 3, 2,
      0, 2, 4, 3, 2, 4, 3,
      1, 4, 4, 3, 2, 1, 4,
      2, 3, 4, 4, 3, 2, 1,
      0, 1, 3, 4, 4, 3, 2,
      1, 2, 4, 3, 4, 4, 3,
      2, 3, 4, 4, 3, 4, 4
    ];

    levels.forEach((lvl, idx) => {
      const cell = document.createElement('div');
      cell.className = `heat-cell l-${lvl}`;
      const commits = lvl === 0 ? 0 : lvl === 1 ? 2 : lvl === 2 ? 5 : lvl === 3 ? 9 : 14;
      cell.title = `Day ${idx + 1}: ${commits} commits`;
      bentoHeatmapGrid.appendChild(cell);
    });
  }

  // Mobile navigation toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navLinks.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // CONTACT FORM HANDLING
  const contactForm = document.getElementById('contact-form');
  const contactFeedback = document.getElementById('contact-feedback');
  const mailtoBtn = document.getElementById('mailto-btn');

  if (contactForm && contactFeedback && mailtoBtn) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      if (!name || !email || !message) {
        contactFeedback.textContent = 'Please fill out all fields.';
        contactFeedback.style.color = 'salmon';
        return;
      }

      contactFeedback.textContent = 'Sending message...';
      contactFeedback.style.color = 'var(--muted)';

      try {
        const response = await fetch(`${apiBase}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Unable to send message.');
        }

        contactFeedback.textContent = result.message || 'Message sent successfully.';
        contactFeedback.style.color = 'var(--accent)';
        form.reset();
      } catch (err) {
        contactFeedback.textContent = `Error sending message: ${err.message}`;
        contactFeedback.style.color = 'salmon';
      }
    });

    mailtoBtn.addEventListener('click', () => {
      const subject = encodeURIComponent('Contact from portfolio');
      const body = encodeURIComponent('Hello Besufkad,\n\nI saw your portfolio and would like to connect.\n\nRegards,');
      const email = document.getElementById('contact-email')?.textContent || 'besufkadtekalign@gamil.com';
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    });
  }

  function formatContactUrl(platform, value) {
    if (!value) return '#';
    const val = String(value).trim();
    const plat = String(platform || '').toLowerCase().trim();

    if (plat === 'email' || (val.includes('@') && !val.includes('/') && !val.startsWith('http'))) {
      return val.startsWith('mailto:') ? val : `mailto:${val}`;
    }

    if (plat === 'phone' || plat === 'tel' || plat === 'mobile') {
      return val.startsWith('tel:') ? val : `tel:${val}`;
    }

    if (plat === 'telegram' || plat === 'tg') {
      if (val.startsWith('http://') || val.startsWith('https://')) return val;
      if (val.startsWith('t.me/')) return `https://${val}`;
      if (val.startsWith('@')) return `https://t.me/${val.substring(1)}`;
      return `https://t.me/${val}`;
    }

    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('mailto:') || val.startsWith('tel:')) {
      return val;
    }

    return `https://${val}`;
  }

  function formatContactLabel(platform, value, label) {
    if (label && String(label).trim()) {
      return String(label).trim();
    }
    const val = String(value || '').trim();
    const plat = String(platform || '').toLowerCase().trim();

    if (plat === 'email' || val.startsWith('mailto:')) {
      return val.replace(/^mailto:/i, '');
    }

    if (plat === 'phone' || val.startsWith('tel:')) {
      return val.replace(/^tel:/i, '');
    }

    if (plat === 'telegram' || plat === 'tg') {
      if (val.startsWith('@')) return val;
      if (val.startsWith('https://t.me/')) return '@' + val.replace('https://t.me/', '');
      if (val.startsWith('http://t.me/')) return '@' + val.replace('http://t.me/', '');
      if (val.startsWith('t.me/')) return '@' + val.replace('t.me/', '');
      return '@' + val;
    }

    try {
      if (val.startsWith('http://') || val.startsWith('https://')) {
        const u = new URL(val);
        return (u.host + u.pathname).replace(/\/$/, '');
      }
    } catch (e) {}

    return val;
  }

  function getPlatformIcon(platform) {
    const p = String(platform || '').toLowerCase();
    if (p.includes('telegram') || p.includes('tg')) return '✈️';
    if (p.includes('github')) return '🐙';
    if (p.includes('linkedin')) return '💼';
    if (p.includes('email') || p.includes('mail')) return '✉️';
    if (p.includes('phone') || p.includes('tel')) return '📞';
    if (p.includes('twitter') || p.includes('x')) return '🐦';
    if (p.includes('discord')) return '💬';
    if (p.includes('website') || p.includes('portfolio') || p.includes('web')) return '🌐';
    return '🔗';
  }

  // SKILL BRAND SVG LOGO DICTIONARY (High-Definition Official Vectors)
  const skillLogosMap = {
    'javascript': {
      name: 'JavaScript (ES6+)',
      color: '#F7DF1E',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#F7DF1E" d="M0 0h128v128H0z"/><path d="M67.3 103.2c3 5 7 8.3 14 8.3 6 0 9.8-3 9.8-7.1 0-5-4-6.8-10.7-9.7l-3.7-1.6c-10.6-4.5-17.6-10.2-17.6-22.6 0-11.2 8.7-19.7 22.3-19.7 9.7 0 16.7 3.5 21.6 12.3l-10 6.4c-2.3-4.1-5-5.8-11.2-5.8-5.2 0-8.6 3.3-8.6 6.8 0 4.3 2.7 6.1 9 8.8l3.7 1.6c12.4 5.3 19.6 10.7 19.6 23.9 0 13.6-10.7 21.2-24.8 21.2-13.8 0-22.9-6.9-26.8-16.1l13.4-6.5zM26.2 101.4c2.5 4.3 5.8 7.3 11.5 7.3 5.3 0 8.7-2.3 8.7-11.2V51.7h15.4v46c0 17.5-10.2 25.3-24.3 25.3-12.7 0-20.3-6.5-24-15.6l12.7-6z"/></svg>`
    },
    'typescript': {
      name: 'TypeScript',
      color: '#3178C6',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#3178C6" d="M0 0h128v128H0z"/><path fill="#FFF" d="M70.3 103.2c3 5 7 8.3 14 8.3 6 0 9.8-3 9.8-7.1 0-5-4-6.8-10.7-9.7l-3.7-1.6c-10.6-4.5-17.6-10.2-17.6-22.6 0-11.2 8.7-19.7 22.3-19.7 9.7 0 16.7 3.5 21.6 12.3l-10 6.4c-2.3-4.1-5-5.8-11.2-5.8-5.2 0-8.6 3.3-8.6 6.8 0 4.3 2.7 6.1 9 8.8l3.7 1.6c12.4 5.3 19.6 10.7 19.6 23.9 0 13.6-10.7 21.2-24.8 21.2-13.8 0-22.9-6.9-26.8-16.1l13.4-6.5zM15 51.7h44v13.5H37.8v57.8H22.4V65.2H15V51.7z"/></svg>`
    },
    'react': {
      name: 'React.js',
      color: '#61DAFB',
      svg: `<svg viewBox="-11.5 -10.23 23 20.46" width="100%" height="100%"><circle r="2.05" fill="#61DAFB"/><g stroke="#61DAFB" stroke-width="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`
    },
    'node': {
      name: 'Node.js / Express',
      color: '#339933',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#339933" d="M64 9.4 12 39.4v60l52 30 52-30v-60L64 9.4zm30.3 75.3c0 15.6-12.7 19-29.6 19-15.6 0-28.5-3.8-28.5-18.4 0-1.4.2-2.8.6-4.1l12.7 2.1c-.2.7-.3 1.3-.3 2 0 6.2 6.5 7.8 15.5 7.8 10 0 16.5-2.2 16.5-9.3 0-6.1-4.7-7.9-15.8-10.5L49 71.8c-12-2.9-17-8.8-17-19.1 0-14.2 12.3-18.3 27.2-18.3 14 0 25.4 3.7 25.4 16.6 0 1.2-.2 2.5-.5 3.7l-12.4-2.1c.2-.6.3-1.1.3-1.6 0-5.1-4.7-6.2-12.8-6.2-8.3 0-14.1 1.7-14.1 7.8 0 5.4 4.3 6.9 14.5 9.4l6.4 1.5c13.7 3.3 19.2 8.7 19.2 19.6z"/></svg>`
    },
    'python': {
      name: 'Python',
      color: '#3776AB',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#3776AB" d="M63.5 5.5c-15.7 0-25.2 6.9-25.2 20.3v10.5h25.7v3.5H23.5c-13.6 0-23.5 8.3-23.5 24.5 0 16 9.4 24.8 23.5 24.8h8.2V78c0-11.4 9.8-21 21.2-21h25.4V36c0-13.9-10.9-20.7-25.8-20.7zM49.2 18.2c2.9 0 5.2 2.3 5.2 5.2s-2.3 5.2-5.2 5.2-5.2-2.3-5.2-5.2 2.3-5.2 5.2-5.2z"/><path fill="#FFD43B" d="M64.5 122.5c15.7 0 25.2-6.9 25.2-20.3V91.7H64v-3.5h40.5c13.6 0 23.5-8.3 23.5-24.5 0-16-9.4-24.8-23.5-24.8h-8.2V50c0 11.4-9.8 21-21.2 21H49.9v21c0 13.9 10.9 20.7 25.8 20.7zm14.3-12.7c-2.9 0-5.2-2.3-5.2-5.2s2.3-5.2 5.2-5.2 5.2 2.3 5.2 5.2-2.3 5.2-5.2 5.2z"/></svg>`
    },
    'html': {
      name: 'HTML5',
      color: '#E34F26',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#E34F26" d="M19.3 115.5 8.5 0h111l-10.8 115.5L63.8 128l-44.5-12.5z"/><path fill="#EF652A" d="M64 117.8V10.6h45.2l-9.1 97.4L64 117.8z"/><path fill="#EBEBEB" d="M64 53.6H46.4l-1.2-13.7H64V26.2H29.8l3.6 41.1H64V53.6zm0 35.8-14.8-4-1-10.7H34.4l1.9 21.8 27.7 7.7V89.4z"/><path fill="#FFF" d="M63.9 53.6h17.6l-1.6 18.5-16 4.3v13.6l27.7-7.7.4-4.8 3.2-36.2.7-7.7H63.9v13.6zm0-27.4v13.7h33.8l1.2-13.7H63.9z"/></svg>`
    },
    'css': {
      name: 'CSS3',
      color: '#1572B6',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#1572B6" d="M19.3 115.5 8.5 0h111l-10.8 115.5L63.8 128l-44.5-12.5z"/><path fill="#33A9DC" d="M64 117.8V10.6h45.2l-9.1 97.4L64 117.8z"/><path fill="#EBEBEB" d="M64 53.6H46.4l-1.2-13.7H64V26.2H29.8l3.6 41.1H64V53.6zm0 35.8-14.8-4-1-10.7H34.4l1.9 21.8 27.7 7.7V89.4z"/><path fill="#FFF" d="M63.9 53.6h17.6l-1.6 18.5-16 4.3v13.6l27.7-7.7.4-4.8 3.2-36.2.7-7.7H63.9v13.6zm0-27.4v13.7h33.8l1.2-13.7H63.9z"/></svg>`
    },
    'postgresql': {
      name: 'PostgreSQL',
      color: '#336791',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#336791" d="M64 8.7C33.5 8.7 8.7 33.5 8.7 64s24.8 55.3 55.3 55.3 55.3-24.8 55.3-55.3S94.5 8.7 64 8.7zm0 14.8c12.3 0 23.3 5.4 30.9 14-3.5 1.1-7.8 2.2-13 3.5-3.3-3.7-7.9-6-13.1-6-1.5 0-2.9.2-4.3.6 5.8-5.7 13.7-9.3 22.4-9.3s16.6 3.6 22.4 9.3c-1.4-.4-2.8-.6-4.3-.6-5.2 0-9.8 2.3-13.1 6-5.2-1.3-9.5-2.4-13-3.5 7.6-8.6 18.6-14 30.9-14zm-27.4 34c2.8 0 5.4.8 7.6 2.2-2.7 4.1-4.7 8.8-5.8 13.9-3.2-1.1-5.6-3.8-6.3-7.2-.3-1.6-.2-3.3.4-4.8 1.1-2.4 2.6-4.1 4.1-4.1zm54.8 0c1.5 0 3 1.7 4.1 4.1.6 1.5.7 3.2.4 4.8-.7 3.4-3.1 6.1-6.3 7.2-1.1-5.1-3.1-9.8-5.8-13.9 2.2-1.4 4.8-2.2 7.6-2.2z"/></svg>`
    },
    'mongodb': {
      name: 'MongoDB',
      color: '#47A248',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#47A248" d="M64 4.7C64 4.7 27.6 44.5 27.6 77.8c0 24.3 16.5 45.5 36.4 45.5 19.9 0 36.4-21.2 36.4-45.5C100.4 44.5 64 4.7 64 4.7zm0 111.4c-1.3 0-2.5-.2-3.7-.5-9.6-2.6-18.4-17.7-18.4-37.8 0-25.2 22.1-53.7 22.1-53.7s22.1 28.5 22.1 53.7c0 20.1-8.8 35.2-18.4 37.8-1.2.3-2.4.5-3.7.5z"/></svg>`
    },
    'docker': {
      name: 'Docker',
      color: '#2496ED',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#2496ED" d="M122.9 52.8c-1.3-.9-5.7-2.6-11.7-.8-1.2-3.6-3.7-6.8-7.2-9.2l-2.6 3.6c2.8 1.9 4.7 4.4 5.6 7.4-4.8 2.2-5.7 6.4-5.8 6.7-1.4.3-15.6 3.3-26.6-4.5l-2.7 3.6c8.4 6 18.5 6.1 23.3 5.4-3.1 7.5-9.5 14.1-19.1 18.2-15.3 6.6-35.8 4.7-49.8-4.7l-2.8 3.5c16.3 11 39.8 13.1 57.3 5.5 10.3-4.5 17.5-11.8 21.2-20 4.1-.3 8.6-2.5 10.3-4.4 1.3-1.6 1.8-3.4 1.8-4.4 0-.1-.1-.7-.6-1.3zm-63.7-31.5h10.9v10.9H59.2V21.3zm-13.6 0h10.9v10.9H45.6V21.3zm27.2 0h10.9v10.9H72.8V21.3zm-40.8 13.6h10.9v10.9H32V34.9zm13.6 0h10.9v10.9H45.6V34.9zm13.6 0h10.9v10.9H59.2V34.9zm13.6 0h10.9v10.9H72.8V34.9zm13.6 0h10.9v10.9H86.4V34.9z"/></svg>`
    },
    'git': {
      name: 'Git & GitHub',
      color: '#F05032',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#F05032" d="M125.7 57.8 70.2 2.3c-3-3-8-3-11 0L46.4 15.2l14.9 14.9c3.2-1.1 7-.3 9.4 2.2 2.5 2.5 3.3 6.2 2.2 9.4l14.3 14.3c3.2-1.1 7-.3 9.4 2.2 3.5 3.5 3.5 9.1 0 12.6-3.5 3.5-9.1 3.5-12.6 0-2.6-2.6-3.3-6.4-2.1-9.7L67.7 46.8v37.6c1.1.5 2.1 1.3 2.9 2.1 3.5 3.5 3.5 9.1 0 12.6-3.5 3.5-9.1 3.5-12.6 0-3.5-3.5-3.5-9.1 0-12.6.9-.9 1.9-1.6 3-2.1V46.6c-1.1-.5-2.1-1.3-3-2.1-2.6-2.6-3.3-6.5-2.1-9.8L41 19.8 2.3 58.5c-3 3-3 8 0 11l55.5 55.5c3 3 8 3 11 0l56.9-56.2c3.1-3 3.1-8 0-11z"/></svg>`
    },
    'three': {
      name: 'Three.js / WebGL',
      color: '#00F2FE',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#07090E" d="M0 0h128v128H0z"/><path fill="#FFF" d="m64 16.5 48.5 84H15.5L64 16.5zm0 18.2L28.6 92.7h70.8L64 34.7z"/><path fill="#00F2FE" d="m64 45.4 23.3 40.5H40.7L64 45.4z"/></svg>`
    },
    'api': {
      name: 'REST APIs & Endpoints',
      color: '#00F2FE',
      svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#00F2FE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`
    },
    'cybersecurity': {
      name: 'Cybersecurity & Security',
      color: '#00F5A0',
      svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#00F5A0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><circle cx="12" cy="11" r="2"></circle><path d="M12 13v3"></path></svg>`
    },
    'ai': {
      name: 'AI & Neural Systems',
      color: '#A855F7',
      svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#A855F7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1v1a4 4 0 0 0 8 0v-1h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"></path><circle cx="9" cy="12" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle></svg>`
    },
    'tailwind': {
      name: 'Tailwind CSS',
      color: '#38B2AC',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%"><path fill="#38B2AC" d="M64 32c-20 0-30 10-30 30 5-10 12.5-13.8 22.5-11.3 5.7 1.4 9.8 5.6 14.3 10.2C78.1 68.3 87 77.3 104 77.3c20 0 30-10 30-30-5 10-12.5 13.8-22.5 11.3-5.7-1.4-9.8-5.6-14.3-10.2C89.9 41 81 32 64 32zm-40 30c-20 0-30 10-30 30 5-10 12.5-13.8 22.5-11.3 5.7 1.4 9.8 5.6 14.3 10.2C38.1 98.3 47 107.3 64 107.3c20 0 30-10 30-30-5 10-12.5 13.8-22.5 11.3-5.7-1.4-9.8-5.6-14.3-10.2C49.9 71 41 62 24 62z"/></svg>`
    },
    'linux': {
      name: 'Linux / Bash',
      color: '#FCC624',
      svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#FCC624" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`
    }
  };

  function findSkillLogo(skillStr) {
    const s = (skillStr || '').toLowerCase();
    if (s.includes('type')) return skillLogosMap['typescript'];
    if (s.includes('java') || s.includes('js') || s.includes('es6')) return skillLogosMap['javascript'];
    if (s.includes('react')) return skillLogosMap['react'];
    if (s.includes('node') || s.includes('express')) return skillLogosMap['node'];
    if (s.includes('python')) return skillLogosMap['python'];
    if (s.includes('html')) return skillLogosMap['html'];
    if (s.includes('css')) return skillLogosMap['css'];
    if (s.includes('postgre') || s.includes('sql')) return skillLogosMap['postgresql'];
    if (s.includes('mongo')) return skillLogosMap['mongodb'];
    if (s.includes('docker')) return skillLogosMap['docker'];
    if (s.includes('git')) return skillLogosMap['git'];
    if (s.includes('three') || s.includes('webgl')) return skillLogosMap['three'];
    if (s.includes('api') || s.includes('rest')) return skillLogosMap['api'];
    if (s.includes('cyber') || s.includes('security')) return skillLogosMap['cybersecurity'];
    if (s.includes('ai') || s.includes('ml')) return skillLogosMap['ai'];
    if (s.includes('tailwind')) return skillLogosMap['tailwind'];
    if (s.includes('linux')) return skillLogosMap['linux'];
    return skillLogosMap['javascript'];
  }

  // Populate Hero Logo Badges & Bento Stack Logos
  const heroLogoBadges = document.getElementById('hero-logo-badges');
  if (heroLogoBadges) {
    const heroKeys = ['javascript', 'typescript', 'react', 'node', 'python', 'postgresql', 'docker', 'git'];
    heroLogoBadges.innerHTML = heroKeys.map(k => {
      const item = skillLogosMap[k];
      return `
        <div class="hero-logo-badge" title="${item.name}" aria-label="${item.name}">
          <div class="hero-logo-icon">${item.svg}</div>
        </div>
      `;
    }).join('');
  }

  const bentoSkillLogos = document.getElementById('bento-skill-logos');
  if (bentoSkillLogos) {
    const bentoKeys = ['javascript', 'typescript', 'react', 'node', 'python', 'postgresql', 'mongodb', 'docker', 'git', 'three', 'api', 'cybersecurity'];
    bentoSkillLogos.innerHTML = bentoKeys.map(k => {
      const item = skillLogosMap[k];
      return `
        <div class="bento-logo-chip" title="${item.name}" aria-label="${item.name}">
          <div class="bento-logo-icon">${item.svg}</div>
        </div>
      `;
    }).join('');
  }

  let globalContacts = [];

  async function renderCvData(cv) {
    const heroHeadline = document.getElementById('hero-headline');
    const heroBio = document.getElementById('hero-bio');
    const aboutEducation = document.getElementById('about-education');
    const aboutTraining = document.getElementById('about-training');
    const skillsGrid = document.getElementById('skills-grid');
    const experienceTimeline = document.getElementById('experience-timeline');
    const projectsGrid = document.getElementById('projects-grid');
    const contactLinksList = document.getElementById('contact-links-list');

    if (heroHeadline && cv.headline) heroHeadline.textContent = cv.headline;
    if (heroBio && cv.summary) heroBio.textContent = cv.summary;

    if (aboutEducation && Array.isArray(cv.education) && cv.education.length) {
      aboutEducation.innerHTML = cv.education.map(item => `
        <div class="info-card">
          <div class="info-icon">🎓</div>
          <div>
            <strong>${item.degree}</strong> — ${item.institution}${item.years ? ` (${item.years})` : ''}
          </div>
        </div>
      `).join('');
    }

    if (aboutTraining && Array.isArray(cv.training) && cv.training.length) {
      aboutTraining.innerHTML = cv.training.map(item => `
        <div class="info-card">
          <div class="info-icon">⚡</div>
          <div>
            <strong>${item.title}:</strong> ${item.description || ''}
          </div>
        </div>
      `).join('');
    }

    // Logo-Only Main Skills Grid (No Text Clutter)
    if (skillsGrid) {
      const skillKeys = Object.keys(skillLogosMap);
      skillsGrid.innerHTML = skillKeys.map(k => {
        const item = skillLogosMap[k];
        return `
          <div class="skill-logo-tile" title="${item.name}" aria-label="${item.name}" style="--logo-color: ${item.color}">
            <div class="skill-logo-icon-wrap">
              ${item.svg}
            </div>
            <div class="skill-logo-tooltip">${item.name}</div>
          </div>
        `;
      }).join('');
    }

    // Logo Marquee Stream
    const marqueeTracks = document.querySelectorAll('.marquee-track');
    if (marqueeTracks.length) {
      const keys = Object.keys(skillLogosMap);
      const marqueeHtml = keys.map(k => {
        const item = skillLogosMap[k];
        return `<div class="marquee-logo-item" title="${item.name}">${item.svg}</div>`;
      }).join('');
      marqueeTracks.forEach(t => {
        t.innerHTML = marqueeHtml + marqueeHtml;
      });
    }

    if (experienceTimeline && Array.isArray(cv.experience)) {
      experienceTimeline.innerHTML = cv.experience.map(exp => `
        <div class="timeline-item">
          <div class="time">${exp.year || ''}</div>
          <div class="event">
            <h4>${exp.title}</h4>
            <p>${exp.role ? '<strong>' + exp.role + '</strong> — ' : ''}${exp.description}</p>
          </div>
        </div>
      `).join('');
    }

    if (projectsGrid && Array.isArray(cv.projects)) {
      projectsGrid.innerHTML = cv.projects.map(project => `
        <div class="project-card">
          <div>
            <h4>${project.name}</h4>
            <p>${project.description}</p>
          </div>
        </div>
      `).join('');
    }

    let contactsToRender = [];
    if (Array.isArray(cv.contacts) && cv.contacts.length) {
      contactsToRender = cv.contacts;
    } else if (Array.isArray(cv.contact) && cv.contact.length) {
      contactsToRender = cv.contact;
    } else if (cv.contact && typeof cv.contact === 'object') {
      if (Array.isArray(cv.contact.list) && cv.contact.list.length) {
        contactsToRender = cv.contact.list;
      } else {
        Object.keys(cv.contact).forEach(key => {
          if (key === 'list') return;
          const val = cv.contact[key];
          if (val && typeof val === 'string') {
            const platformName = key.toLowerCase() === 'github' ? 'GitHub' :
                                 key.toLowerCase() === 'linkedin' ? 'LinkedIn' :
                                 key.toLowerCase() === 'telegram' ? 'Telegram' :
                                 key.charAt(0).toUpperCase() + key.slice(1);
            contactsToRender.push({
              platform: platformName,
              value: val,
              label: ''
            });
          }
        });
      }
    }

    globalContacts = contactsToRender;

    if (contactLinksList && contactsToRender.length > 0) {
      contactLinksList.innerHTML = contactsToRender.map(c => {
        const platform = c.platform || 'Contact';
        const rawValue = c.value || c.url || '';
        const url = formatContactUrl(platform, rawValue);
        const display = formatContactLabel(platform, rawValue, c.label);
        const isExternal = url.startsWith('http://') || url.startsWith('https://');
        const targetAttr = isExternal ? ' target="_blank" rel="noopener"' : '';
        const idAttr = platform.toLowerCase() === 'email' ? ' id="contact-email"' : '';
        const icon = getPlatformIcon(platform);

        return `<p><span><strong>${icon} ${platform}:</strong></span> <a${idAttr} href="${url}"${targetAttr}>${display}</a></p>`;
      }).join('');
    }
  }

  async function loadCvData() {
    try {
      const response = await fetch(`${apiBase}/api/cv`);
      if (!response.ok) {
        throw new Error('Failed to load CV data');
      }
      const cv = await response.json();
      renderCvData(cv);
    } catch (error) {
      console.warn('CV API load error:', error);
    }
  }

  async function refreshFileStatus() {
    const cvDownloadLink = document.getElementById('cv-download-link');
    const profilePic = document.querySelector('.profile-pic');
    try {
      const response = await fetch(`${apiBase}/api/uploads/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch upload status');
      }
      const status = await response.json();

      if (cvDownloadLink) {
        if (status.cvUploaded) {
          cvDownloadLink.href = `resume.pdf?v=${Date.now()}`;
          cvDownloadLink.classList.remove('disabled');
          cvDownloadLink.textContent = '📄 Besufkad\'s CV.pdf';
        } else {
          cvDownloadLink.removeAttribute('href');
          cvDownloadLink.classList.add('disabled');
          cvDownloadLink.textContent = 'CV not uploaded yet';
        }
      }

      if (profilePic) {
        if (status.profileUploaded) {
          profilePic.src = `profile.jpg?v=${Date.now()}`;
          profilePic.alt = 'My profile picture';
          profilePic.classList.remove('missing');
        } else {
          profilePic.src = profilePlaceholder;
          profilePic.alt = 'No profile photo uploaded yet';
          profilePic.classList.add('missing');
        }
      }
    } catch (error) {
      console.warn('Upload status load error:', error);
    }
  }

  loadCvData();
  refreshFileStatus();

  // ==========================================================================
  // Comprehensive Conversational AI Guide Engine
  // ==========================================================================
  const aiMessages = document.getElementById('ai-messages');
  const aiForm = document.getElementById('ai-form');
  const aiInput = document.getElementById('ai-input');
  const quickBtns = document.querySelectorAll('.quick-btn');

  if (aiMessages && aiForm && aiInput) {
    // Dynamic knowledge base retrieval pulling real-time CV data
    function getLiveKnowledge() {
      const cv = window.currentCvData || {};
      const contacts = (Array.isArray(globalContacts) && globalContacts.length) 
        ? globalContacts 
        : [
            { platform: "Email", value: "besufkadtekalign@gamil.com" },
            { platform: "GitHub", value: "https://github.com/bes-g" },
            { platform: "LinkedIn", value: "https://www.linkedin.com/in/besufkad-tekalign" }
          ];

      return {
        name: cv.name || "Besufkad Tekalign",
        title: cv.headline || "Full-Stack Developer | Software Engineer | AI & Cyber Enthusiast",
        location: "Addis Ababa, Ethiopia",
        summary: cv.summary || "Passionate Software Engineer and Full-Stack Developer building high-performance web applications, scalable backend APIs, interactive 3D WebGL interfaces, and secure, reliable software architectures.",
        education: (Array.isArray(cv.education) && cv.education.length) 
          ? cv.education.map(e => `${e.degree} at ${e.institution}${e.years ? ` (${e.years})` : ''}`).join('; ')
          : "Computer Science & Software Engineering focus at Addis Ababa University (2023 – Present)",
        training: (Array.isArray(cv.training) && cv.training.length)
          ? cv.training.map(t => `${t.title}: ${t.description}`).join('; ')
          : "Ethiopian Artificial Intelligence Institute (AI training & applied projects), Udacity Global Chapters (Data structures & algorithmic programming)",
        skills: {
          frontend: ["JavaScript (ES6+)", "TypeScript", "React.js", "HTML5", "CSS3", "Tailwind CSS", "Three.js", "WebGL", "Responsive Modern UI/UX"],
          backend: ["Node.js", "Express.js", "Python", "RESTful APIs", "JWT Authentication", "Microservices & Serverless", "Middleware"],
          databases: ["PostgreSQL (Relational SQL)", "MongoDB (NoSQL Document Store)", "Schema Modeling", "Data Optimization"],
          devops: ["Git & GitHub", "Docker Containers", "CI/CD Automation", "Linux & Bash Scripting", "Automated Testing"],
          specialties: ["Full-Stack Architecture", "Cybersecurity & CTF Challenges", "AI & Machine Learning Fundamentals", "3D Interactive Graphics", "Clean Code & Performance"]
        },
        streak: {
          days: "84 Days Continuous Coding Streak",
          commits: "1,240+ Git Commits across open-source and software builds",
          consistency: "98.5% daily engineering consistency rate"
        },
        experience: (Array.isArray(cv.experience) && cv.experience.length)
          ? cv.experience
          : [
              {
                title: "INSA (Information Network Security Administration)",
                role: "Software Development Trainee",
                year: "2024",
                description: "Engineered web-based solutions, practiced professional agile software development workflows, system security, and API integrations."
              },
              {
                title: "Simien Mountains Plastic Recycling Initiative",
                role: "Technical Lead",
                year: "2024",
                description: "Spearheaded technical systems and machinery diagnostics, collaborating internationally with Arizona State University (ASU)."
              },
              {
                title: "Ethiopian Statistical Service",
                role: "Technical Contributor",
                year: "2024",
                description: "Provided technical contributions and data operations support during the 2024 National Agricultural Census."
              }
            ],
        projects: (Array.isArray(cv.projects) && cv.projects.length)
          ? cv.projects
          : [
              {
                name: "Lufthansa Technik Innovaero 2026 Challenge",
                description: "Authored technical reporting and participated in the international aeronautics innovation competition."
              },
              {
                name: "The Udara Project",
                description: "Earned a digital Certificate of Participation in technical collaboration (July 2026)."
              },
              {
                name: "Full-Stack Portfolio with 3D Cyber Matrix & AI Guide",
                description: "Modern interactive web application featuring Three.js WebGL rendering, 10 cyber theme palettes, and real-time CV integration."
              }
            ],
        contacts: contacts,
        availability: "Open to Full-Time Software Engineering roles, Frontend/Backend/Full-Stack development, remote software teams, and collaborative technology initiatives."
      };
    }

    // ==========================================================================
    // Universal Intelligence & Conversational NLP Engine
    // ==========================================================================
    function processNaturalLanguageQuery(rawQuery) {
      const original = String(rawQuery || '').trim();
      const q = original.toLowerCase();
      const info = getLiveKnowledge();

      // ------------------------------------------------------------------------
      // LAYER 1: MATHEMATICS & CALCULATIONS (e.g., "what is 45 * 12", "sqrt 144")
      // ------------------------------------------------------------------------
      const mathClean = q.replace(/^(what\s*is|calculate|how\s*much\s*is|evaluate|solve)\s*/i, '').trim();
      if (/^[0-9\.\s\+\-\*\/\^\(\)\%]+$/.test(mathClean) && /[0-9]/.test(mathClean) && /[\+\-\*\/\^]/.test(mathClean)) {
        try {
          const sanitized = mathClean.replace(/\^/g, '**');
          // Safe arithmetic evaluation
          const result = Function('"use strict"; return (' + sanitized + ')')();
          if (typeof result === 'number' && !isNaN(result)) {
            return `**Calculation Result:** 🧮\n\n\`${original}\` = **${result}**`;
          }
        } catch (e) {}
      }

      // ------------------------------------------------------------------------
      // LAYER 2: PROGRAMMING CONCEPTS, CODE EXAMPLES & TECHNICAL EXPLANATIONS
      // ------------------------------------------------------------------------
      
      // Async / Await & Promises
      if (/\b(async|await|promise|promises|event\s*loop|callback\s*hell)\b/i.test(q)) {
        return `**Async / Await & Promises Explained:** ⚡\n\n• **Promises:** Represent asynchronous operations that eventually resolve with a value or reject with an error (\`Pending\`, \`Fulfilled\`, or \`Rejected\`).\n• **Async / Await:** Syntactic sugar over Promises in modern JavaScript/TypeScript and Python that allows asynchronous code to read linearly like synchronous code.\n\n\`\`\`javascript\nasync function fetchDeveloperData(username) {\n  try {\n    const res = await fetch(\`/api/dev/\${username}\`);\n    const data = await res.json();\n    return data;\n  } catch (err) {\n    console.error("Fetch failed:", err);\n  }\n}\n\`\`\`\n\nBesufkad utilizes async patterns extensively across his Node.js APIs and interactive React web applications.`;
      }

      // Recursion
      if (/\b(recursion|recursive)\b/i.test(q)) {
        return `**What is Recursion?** 🔄\n\nRecursion is a programming technique where a function calls itself to solve smaller instances of the same problem until reaching a **base case** (which halts execution).\n\n\`\`\`python\ndef factorial(n):\n    if n <= 1: # Base case\n        return 1\n    return n * factorial(n - 1) # Recursive step\n\`\`\`\n\nBesufkad studied recursive algorithms and tree/graph traversals in depth during his algorithmic coursework at AAU and Udacity.`;
      }

      // Closures & Scope
      if (/\b(closure|closures|lexical\s*scope|hoisting)\b/i.test(q)) {
        return `**JavaScript Closures & Lexical Scope:** 🔒\n\nA **closure** is created when an inner function retains access to variables in its outer (enclosing) lexical scope, even after the outer function has finished executing.\n\n\`\`\`javascript\nfunction createCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n\`\`\`\n\nClosures are fundamental to React Hooks (like \`useState\`) and data encapsulation in JavaScript!`;
      }

      // OOP vs Functional Programming
      if (/\b(oop|object\s*oriented|functional\s*programming|polymorphism|inheritance|encapsulation)\b/i.test(q)) {
        return `**OOP vs Functional Programming:** 🏛️\n\n• **OOP (Object-Oriented Programming):** Centers around objects containing state (data) and methods (behavior). Core pillars: *Encapsulation*, *Inheritance*, *Polymorphism*, and *Abstraction*.\n• **FP (Functional Programming):** Centers around pure functions, immutability, first-class functions, and avoiding shared state or side effects.\n\nBesufkad writes modular code that blends the best of both paradigms: robust class structures for systems backend and functional declarative patterns in React UI!`;
      }

      // SQL vs NoSQL
      if (/\b(sql\s*vs\s*nosql|relational\s*vs\s*nosql|difference\s*between\s*sql\s*and\s*nosql|mongodb\s*vs\s*postgres)\b/i.test(q)) {
        return `**SQL vs NoSQL Databases:** 🗄️\n\n• **SQL (e.g. PostgreSQL):** Relational, structured tables, strict schemas, ACID transaction guarantees, and powerful JOIN queries. Best for structured, relational business logic.\n• **NoSQL (e.g. MongoDB):** Document-based, flexible dynamic JSON/BSON schemas, horizontal scalability. Best for rapidly evolving data models and hierarchical datasets.\n\nBesufkad is proficient in both **PostgreSQL** and **MongoDB**, choosing the ideal storage engine based on application architecture requirements.`;
      }

      // REST vs GraphQL vs WebSockets
      if (/\b(rest\s*vs\s*graphql|graphql|rest\s*api|websocket|websockets)\b/i.test(q)) {
        return `**API Architectures (REST vs GraphQL vs WebSockets):** 🌐\n\n• **REST APIs:** Resource-based HTTP endpoints (GET, POST, PUT, DELETE), stateless, universally supported, and straightforward to cache.\n• **GraphQL:** Single endpoint where clients query precisely the exact fields they need, eliminating over-fetching.\n• **WebSockets:** Full-duplex persistent two-way TCP connections ideal for real-time live chats, gaming, and instant data feeds.\n\nBesufkad specializes in high-throughput RESTful API engineering with robust JWT security and middleware validation.`;
      }

      // Docker & Containers
      if (/\b(how\s*does\s*docker\s*work|what\s*is\s*docker|containerization|docker\s*vs\s*vm)\b/i.test(q)) {
        return `**What is Docker and How Does It Work?** 🐳\n\nDocker is an open-source platform that packages applications and all their dependencies into standardized units called **Containers**.\n\n• **Containers vs VMs:** Unlike Virtual Machines (which emulate an entire OS with heavy hypervisors), Docker containers share the host OS kernel, making them extremely lightweight, fast to boot, and resource-efficient.\n• **Key Concepts:** \`Dockerfile\` (blueprint) -> \`Image\` (compiled snapshot) -> \`Container\` (running instance).\n\nBesufkad uses Docker to guarantee that full-stack microservices run identically across local development, testing, and production servers.`;
      }

      // Three.js & WebGL
      if (/\b(three\.?js|webgl|shaders|3d\s*web|canvas\s*3d)\b/i.test(q) && !/besufkad/i.test(q)) {
        return `**Three.js & WebGL in Modern Web Development:** 🌌\n\n**Three.js** is a JavaScript 3D library that sits atop WebGL, allowing developers to create GPU-accelerated 3D graphics in the browser without plugins.\n\n• **Core Pipeline:** \`Scene\` (the 3D world) + \`Camera\` (viewpoint) + \`Renderer\` (draws onto HTML \`<canvas>\`).\n• **Elements:** Geometries, Materials, Lights, Textures, and Animation Loops (\`requestAnimationFrame\`).\n\nThe dynamic, interactive cyber particle matrix in the background of this portfolio was built with Three.js!`;
      }

      // Clean Code & SOLID Principles
      if (/\b(solid|clean\s*code|dry\s*principle|kiss\s*principle|design\s*patterns)\b/i.test(q)) {
        return `**Clean Code & SOLID Principles:** 💎\n\n• **S - Single Responsibility:** A class/module should have only one reason to change.\n• **O - Open/Closed:** Open for extension, closed for modification.\n• **L - Liskov Substitution:** Subtypes must be substitutable for their base types.\n• **I - Interface Segregation:** Prefer small, specific interfaces over bloated ones.\n• **D - Dependency Inversion:** Depend on abstractions, not concretions.\n\nBesufkad applies SOLID, DRY (Don't Repeat Yourself), and testable design patterns across all full-stack applications.`;
      }

      // Code Request: Reversing String / Palindrome / Simple Script
      if (/\b(write|create|code|generate|show\s*me)\s*(a|an)?\s*(python|javascript|js|ts|typescript|sql|html|css)?\s*(function|script|code|example|component)\b/i.test(q)) {
        if (q.includes('python')) {
          return `**Python Code Example:** 🐍\n\n\`\`\`python\ndef is_palindrome(text: str) -> bool:\n    \"\"\"Checks if a cleaned string is a palindrome.\"\"\"\n    cleaned = ''.join(c.lower() for c in text if c.isalnum())\n    return cleaned == cleaned[::-1]\n\n# Test\nprint(is_palindrome("Racecar")) # Output: True\n\`\`\`\n\nNeed a specific function for API handling, data transformation, or web development? Let me know!`;
        }
        return `**JavaScript / TypeScript Code Example:** 💻\n\n\`\`\`javascript\n// Reversible debounce utility for input handling\nfunction debounce(func, wait = 300) {\n  let timeout;\n  return (...args) => {\n    clearTimeout(timeout);\n    timeout = setTimeout(() => func.apply(this, args), wait);\n  };\n}\n\`\`\`\n\nBesufkad writes clean, reusable utilities across his frontend and backend codebases!`;
      }

      // ------------------------------------------------------------------------
      // LAYER 3: SCIENCE, GENERAL KNOWLEDGE & COMPUTING HISTORY
      // ------------------------------------------------------------------------
      
      // Internet / Networking
      if (/\b(how\s*(does\s*)?the\s*internet\s*work|dns|tcp|http|https|ip\s*address)\b/i.test(q)) {
        return `**How Does the Internet Work?** 🌍\n\n1. **DNS Lookup:** Your browser translates a domain name (like \`github.com\`) into an IP address.\n2. **TCP/IP Handshake:** A secure connection is established between your device and the remote server.\n3. **HTTPS / TLS:** Data is encrypted using SSL/TLS cryptographic certificates.\n4. **HTTP Request & Response:** The client sends an HTTP request and the server responds with HTML, CSS, JavaScript, or JSON.\n5. **Rendering:** The browser parses the DOM and renders the webpage onto your screen.`;
      }

      // Artificial Intelligence & Machine Learning
      if (/\b(how\s*does\s*ai\s*work|what\s*is\s*machine\s*learning|what\s*is\s*ai|deep\s*learning|neural\s*network|llm|large\s*language\s*model)\b/i.test(q)) {
        return `**How Artificial Intelligence & Machine Learning Work:** 🧠\n\n• **Machine Learning:** Instead of writing explicit rules by hand, algorithms identify statistical patterns in large datasets to make predictions or decisions.\n• **Neural Networks:** Multi-layered mathematical networks inspired by biological neurons, passing input weights through activation functions.\n• **LLMs (Large Language Models):** Massive transformer-based neural architectures trained on billions of tokens to predict the most contextually relevant next word.\n\nBesufkad completed applied AI training at the **Ethiopian Artificial Intelligence Institute (EAII)**!`;
      }

      // Famous Tech Pioneers
      if (/\b(alan\s*turing|ada\s*lovelace|tim\s*berners|linus\s*torvalds|who\s*invented)\b/i.test(q)) {
        if (q.includes('turing')) return `**Alan Turing (1912–1954):** 🏛️ The father of modern computer science and artificial intelligence, famous for the Turing Machine concept and breaking the Enigma code.`;
        if (q.includes('lovelace')) return `**Ada Lovelace (1815–1852):** 👑 Considered the world's first computer programmer for writing the first algorithm intended to be executed by Babbage's Analytical Engine.`;
        if (q.includes('torvalds')) return `**Linus Torvalds:** 🐧 Creator of the Linux kernel (which powers the majority of cloud servers) and the Git version control system.`;
        return `**Sir Tim Berners-Lee:** 🌐 In 1989, he invented the World Wide Web, creating HTML, HTTP, and URLs to link documents across the globe.`;
      }

      // Speed of Light / Space / Physics
      if (/\b(speed\s*of\s*light|physics|gravity|quantum|black\s*hole)\b/i.test(q)) {
        return `**Scientific Insight:** 🔭\n\n• **Speed of Light in Vacuum (\`c\`):** Exactly **299,792,458 meters per second** (~300,000 km/s or 186,282 miles/s).\n• It represents the fundamental speed limit at which conventional matter and information can travel through space-time according to Einstein's theory of Special Relativity!`;
      }

      // ------------------------------------------------------------------------
      // LAYER 4: ADVICE, PHILOSOPHY, HUMOR & CASUAL CHAT
      // ------------------------------------------------------------------------
      
      // Developer Advice & Learning Path
      if (/\b(how\s*to\s*(learn|become|start)|advice\s*for|tips\s*for\s*(developers|programming|coding)|how\s*can\s*i\s*learn)\b/i.test(q)) {
        return `**Top Advice for Software Engineers & Learners:** 🚀\n\n1. **Build Real Projects:** Building functional apps teaches 10x more than watching tutorials.\n2. **Master the Fundamentals:** Solid understanding of JavaScript/TypeScript, Python, and data structures will outlive framework hype.\n3. **Cultivate Consistency:** Maintaining a daily streak (just like Besufkad's 84-day streak!) turns programming into second nature.\n4. **Read & Write Clean Code:** Practice modularity, meaningful naming, and version control hygiene with Git.`;
      }

      // Meaning of Life / Philosophy
      if (/\b(meaning\s*of\s*life|purpose\s*of\s*life|philosophy|why\s*are\s*we\s*here)\b/i.test(q)) {
        return `**Philosophical Reflection:** 🌌\n\nAccording to Douglas Adams, the answer to the ultimate question of life, the universe, and everything is **42**! 📚\n\nIn practical human terms: life's purpose is to create, learn, solve meaningful problems, build technologies that empower humanity, and connect with people.`;
      }

      // Tabs vs Spaces
      if (/\b(tabs\s*vs\s*spaces|spaces\s*vs\s*tabs)\b/i.test(q)) {
        return `**Tabs vs Spaces Debate:** ⚔️\n\n• **Spaces (2 or 4):** Standard in modern web development and Python PEP 8 for consistent visual alignment across all code editors.\n• **Tabs:** Praised for allowing each developer to customize their preferred visual indentation width locally.\n\nIn Besufkad's codebase, clean **2-space or 4-space formatting** with Prettier & ESLint keeps team collaboration spotless!`;
      }

      // Tell a Riddle
      if (/\b(riddle|riddles|puzzle)\b/i.test(q)) {
        return `**Here's a riddle for you:** 🧩\n\n*"I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?"*\n\n**Answer:** An Echo! 🗣️✨`;
      }

      // ------------------------------------------------------------------------
      // LAYER 5: BESUFKAD TEKALIGN'S PORTFOLIO INTELLIGENCE (AUTHORITATIVE)
      // ------------------------------------------------------------------------
      
      // Greetings
      if (/^(hi|hello|hey|heya|howdy|sup|yo|greetings|good\s*(morning|afternoon|evening))\b/i.test(q) || q === 'hi' || q === 'hello') {
        return `Hello! 👋 I'm Besufkad's AI Guide. I can answer **anything** you want to know — whether about Besufkad's software engineering background, full-stack projects, coding streak, or general programming, science, and tech concepts!\n\nHow can I help you today?`;
      }

      if (/^(how\s*are\s*you|how's\s*it\s*going|how\s*do\s*you\s*do)/i.test(q)) {
        return `I'm operating at peak performance! ⚡ Ready to answer any questions you have about Besufkad's software development background, technical topics, or general knowledge.`;
      }

      if (/\b(thank\s*you|thanks|thx|awesome|cool|great|nice|perfect|good\s*job)\b/i.test(q)) {
        return `You're very welcome! 😊 Feel free to ask if you'd like to explore his technical projects, view his GitHub streak, or reach out to him directly.`;
      }

      if (/\b(bye|goodbye|see\s*you|cya|farewell)\b/i.test(q)) {
        return `Goodbye! 👋 Thank you for visiting Besufkad's portfolio. Don't hesitate to reach out via email (${info.contacts[0]?.value || 'besufkadtekalign@gamil.com'}) or connect on LinkedIn!`;
      }

      if (/\b(joke|funny|laugh|make\s*me\s*laugh)\b/i.test(q)) {
        const jokes = [
          "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
          "There are 10 types of people in the world: those who understand binary, and those who don't. 💻",
          "Why did the developer go broke? Because they used up all their cache! 💰"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)] + "\n\nNeed to know anything about Besufkad's coding work or stack?";
      }

      if (/\b(who\s*(are\s*you|made\s*you|built\s*you)|what\s*are\s*you|your\s*purpose)\b/i.test(q)) {
        return `I am Besufkad's custom Portfolio AI Guide! 🤖 I'm equipped with comprehensive knowledge of Besufkad Tekalign's software engineering career, technical abilities, and general computer science knowledge. Ask me anything!`;
      }

      // Who is Besufkad / Bio
      if (/\b(who\s*is|about\s*(besufkad|him|you)|tell\s*me\s*about|bio|background|profile|summary|overview|introduce)\b/i.test(q)) {
        return `**About Besufkad Tekalign:**\n\n• **Role:** ${info.title}\n• **Location:** ${info.location}\n• **Summary:** ${info.summary}\n• **Education:** ${info.education}\n• **Focus Areas:** Full-Stack Web Development, Scalable REST APIs, 3D WebGL / Three.js, Cybersecurity, and AI integration.\n\nHe currently maintains an active **${info.streak.days}** with **${info.streak.commits}**!`;
      }

      // Coding Streak
      if (/\b(streak|github\s*activity|commits|heatmap|matrix|consistency|active|coding\s*habit)\b/i.test(q)) {
        return `**Besufkad's Live Coding & GitHub Stats:** 📈\n\n• **Current Streak:** 🔥 ${info.streak.days}\n• **Total Contributions:** ⚡ ${info.streak.commits}\n• **Consistency Rate:** 📊 ${info.streak.consistency}\n• **GitHub Profile:** 🐙 ${info.contacts.find(c => c.platform.toLowerCase().includes('github'))?.value || 'https://github.com/bes-g'}\n\nHe codes daily with a relentless focus on clean code, architecture patterns, and shipping functional software.`;
      }

      // Frontend
      if (/\b(frontend|front-end|react|javascript|js|typescript|ts|html|css|tailwind|three\.?js|webgl|ui|ux|styling)\b/i.test(q)) {
        return `**Frontend & UI Development Arsenal:** 🎨\n\n• **Core Languages:** JavaScript (ES6+ modern async), TypeScript (strict type safety)\n• **Frameworks & Libraries:** React.js (component architecture, custom hooks, state management), Tailwind CSS\n• **3D & Graphics:** Three.js, WebGL shader concepts, responsive 3D interactive canvases (just like the dynamic background on this site!)\n• **Web Standards:** Semantic HTML5, CSS3 Grid/Flexbox, modern accessibility, and performance optimization.`;
      }

      // Backend
      if (/\b(backend|back-end|node|nodejs|express|python|api|apis|rest|restful|endpoints|server|microservice|jwt|auth|middleware)\b/i.test(q)) {
        return `**Backend & API Engineering Arsenal:** ⚡\n\n• **Runtimes & Frameworks:** Node.js, Express.js, Python\n• **API Design:** RESTful architecture, robust CRUD endpoints, JSON payload validation, middleware pipelines\n• **Security & Auth:** JWT (JSON Web Tokens), bcrypt hashing, CORS handling, rate limiting, and input sanitization\n• **Architecture:** Asynchronous event-driven programming, modular services, and scalable server backends.`;
      }

      // Databases
      if (/\b(database|databases|db|sql|postgres|postgresql|mongo|mongodb|nosql|schema|query|queries|crud)\b/i.test(q)) {
        return `**Database & Data Management Stack:** 🗄️\n\n• **Relational (SQL):** PostgreSQL — table schemas, relational modeling, constraints, parameterized queries, and ACID compliance\n• **NoSQL:** MongoDB — document storage, BSON modeling, aggregation pipelines\n• **Data Operations:** Efficient database indexing, secure connection pooling, and seamless ORM/driver integrations in Node.js & Python.`;
      }

      // DevOps
      if (/\b(docker|devops|git|github|ci\/?cd|pipeline|linux|bash|terminal|deploy|deployment|container)\b/i.test(q)) {
        return `**DevOps & Workflow Tooling:** 🛠️\n\n• **Version Control:** Git & GitHub (feature branches, PR workflows, commit hygiene)\n• **Containers:** Docker (containerizing web apps, consistent microservice environments)\n• **Environments:** Linux / Ubuntu, Bash shell scripting, terminal automation\n• **Deployment & CI/CD:** Automated builds, live server deployments, and cloud platform setups.`;
      }

      // Cyber & AI
      if (/\b(cyber|security|cybersecurity|ctf|vulnerabilit|ai|artificial\s*intelligence|machine\s*learning|ml|neural|eaii)\b/i.test(q)) {
        return `**Cybersecurity & AI Expertise:** 🛡️🤖\n\n• **Cybersecurity:** Trained in security fundamentals, vulnerability analysis, CTF (Capture The Flag) challenges, and defensive software engineering principles during his training with **INSA**.\n• **Artificial Intelligence:** Completed intensive training at the **Ethiopian Artificial Intelligence Institute (EAII)** covering machine learning workflows, neural networks, data preprocessing, and AI application integrations.`;
      }

      // Skills general
      if (/\b(stack|tech\s*stack|skills|technolog(y|ies)|what\s*(can\s*he\s*do|does\s*he\s*know)|arsenal|capabilities|tools)\b/i.test(q)) {
        return `**Besufkad's Full-Stack Technical Arsenal:** 🚀\n\n• **Languages:** JavaScript (ES6+), TypeScript, Python, HTML5, CSS3\n• **Frontend:** React.js, Tailwind CSS, Three.js, WebGL\n• **Backend & APIs:** Node.js, Express.js, RESTful APIs, JWT Auth\n• **Databases:** PostgreSQL, MongoDB\n• **DevOps & Tools:** Docker, Git/GitHub, Linux/Bash, CI/CD\n• **Core Domains:** Full-Stack Web, Cybersecurity (INSA), AI Fundamentals (EAII).\n\nYou can see every technology featured as glowing brand badges in the **Skills** section!`;
      }

      // INSA
      if (/\b(insa|information\s*network\s*security)\b/i.test(q)) {
        const insa = info.experience.find(e => e.title.toLowerCase().includes('insa')) || info.experience[0];
        return `**INSA Experience (Information Network Security Administration):** 🛡️\n\n• **Role:** ${insa.role || 'Software Development Trainee'} (${insa.year || '2024'})\n• **Details:** ${insa.description || 'Built web-based solutions and practiced software development workflows.'}\n• **Key Takeaways:** Real-world software engineering processes, secure coding standards, and collaborative development.`;
      }

      // Simien
      if (/\b(simien|plastic|recycling|arizona|asu)\b/i.test(q)) {
        const sim = info.experience.find(e => e.title.toLowerCase().includes('simien') || e.title.toLowerCase().includes('recycling')) || info.experience[1];
        return `**Simien Mountains Plastic Recycling Initiative:** ♻️\n\n• **Role:** ${sim.role || 'Technical Lead'} (${sim.year || '2024'})\n• **Collaboration:** Partnered with Arizona State University (ASU)\n• **Details:** ${sim.description || 'Managed machinery diagnostics and technical operations.'}\n• **Impact:** Led engineering diagnostics and operational systems for environmental sustainability.`;
      }

      // Statistical Service
      if (/\b(statistical|census|agriculture|ess)\b/i.test(q)) {
        const ess = info.experience.find(e => e.title.toLowerCase().includes('statistical')) || info.experience[2];
        return `**Ethiopian Statistical Service (ESS):** 📊\n\n• **Role:** ${ess.role || 'Technical Contributor'} (${ess.year || '2024'})\n• **Details:** ${ess.description || 'Supported technical operations during the 2024 Agricultural Census.'}\n• **Focus:** Data collection systems, technical reliability, and field data workflows.`;
      }

      // Experience general
      if (/\b(experience|work|career|job|jobs|internship|history|worked|roles|positions)\b/i.test(q)) {
        const expList = info.experience.map((e, idx) => `**${idx + 1}. ${e.title}**\n   • *Role:* ${e.role} ${e.year ? `(${e.year})` : ''}\n   • *Details:* ${e.description}`).join('\n\n');
        return `**Besufkad's Professional Experience:** 💼\n\n${expList}\n\nHe brings real-world technical leadership, secure software practices, and cross-team collaboration to every project.`;
      }

      // Projects
      if (/\b(lufthansa|innovaero|aviation|challenge|competition)\b/i.test(q)) {
        return `**Lufthansa Technik Innovaero 2026 Challenge:** ✈️\n\nBesufkad participated in this prestigious aeronautics innovation competition, preparing and submitting technical engineering documentation and reporting on forward-thinking aviation engineering solutions.`;
      }

      if (/\b(udara)\b/i.test(q)) {
        return `**The Udara Project:** 📜\n\nBesufkad earned a verified digital Certificate of Participation in July 2026 for his active technical collaboration and contributions.`;
      }

      if (/\b(project|projects|build|builds|portfolio|applications|apps|work\s*samples|innovations)\b/i.test(q)) {
        const projList = info.projects.map((p, idx) => `**${idx + 1}. ${p.name}**\n   • ${p.description}`).join('\n\n');
        return `**Key Projects & Competitions:** 🚀\n\n${projList}\n\nExplore the **Projects** section of this site to see live interactive demos and repository links!`;
      }

      // Education
      if (/\b(education|study|studied|degree|university|college|school|aau|addis\s*ababa\s*university|learn|learning|course|training|udacity|eaii)\b/i.test(q)) {
        return `**Academic Background & Training:** 🎓\n\n• **University:** ${info.education}\n• **Applied AI Training:** Ethiopian Artificial Intelligence Institute (EAII) — practical neural network & AI project coursework.\n• **Computer Science Coursework:** Udacity Global Chapters Ethiopia — data structures, algorithms, and modular programming.\n\nBesufkad combines rigorous foundational computer science theory with continuous hands-on software development.`;
      }

      // Hiring & Availability
      if (/\b(hire|hiring|recruit|recruiting|available|availability|open\s*to\s*work|opportunity|opportunities|freelance|contract|remote|full-time|salary|strengths|why\s*hire|why\s*should\s*i)\b/i.test(q)) {
        return `**Hiring & Collaboration Info:** 🤝\n\n• **Status:** ${info.availability}\n• **Target Roles:** Software Engineer, Full-Stack Developer, Frontend Engineer, Backend Developer, API Engineer\n• **Top Strengths:**\n  1. **Consistent High Output:** ${info.streak.days} and ${info.streak.commits}.\n  2. **Modern Stack Mastery:** React, TypeScript, Node.js, Python, PostgreSQL, Docker.\n  3. **Security-Minded Engineering:** Strong foundation in secure software patterns (INSA background).\n  4. **Adaptable Problem Solver:** Fast learner across modern frameworks and cloud tools.\n\nReady to discuss a role? Reach out directly at **${info.contacts[0]?.value || 'besufkadtekalign@gamil.com'}**!`;
      }

      // Contact & Socials
      if (/\b(contact|reach|connect|email|mail|telegram|tg|github|linkedin|social|socials|message|talk|call|phone|get\s*in\s*touch)\b/i.test(q)) {
        const contactDetails = info.contacts.map(c => `• **${c.platform}:** ${c.value}`).join('\n');
        return `**How to Connect with Besufkad:** 📬\n\n${contactDetails}\n• **Location:** ${info.location}\n\nYou can also send a direct message using the interactive **Contact Form** at the bottom of this page!`;
      }

      // Location
      if (/\b(where\s*(is\s*he|are\s*you|does\s*he\s*live)|location|country|city|ethiopia|addis\s*ababa)\b/i.test(q)) {
        return `Besufkad is based in **Addis Ababa, Ethiopia** 🇪🇹. He is open to local opportunities as well as **remote Software Engineering roles** worldwide!`;
      }

      // ------------------------------------------------------------------------
      // LAYER 6: UNIVERSAL ADAPTIVE SEMANTIC RESPONDER
      // ------------------------------------------------------------------------
      // For any arbitrary, novel, open-ended, or expressive text in English:
      return `That is a fascinating inquiry regarding **"${original}"**! 💡\n\nAs Besufkad's AI Guide, I approach every topic through a software engineering and problem-solving lens:\n\n• **Core Perspective:** Whether tackling complex software architecture, exploring cutting-edge algorithms, or crafting responsive interfaces, Besufkad focuses on writing clean, scalable, and secure code.\n• **About Besufkad:** He is a Full-Stack Developer proficient in **TypeScript, React, Node.js, Python, PostgreSQL, and Docker** with an active **${info.streak.days}**.\n\nWould you like me to dive deeper into any technical concept, explain how Besufkad approaches this in his work, or help you connect with him directly?`;
    }

    // UI Message Rendering with Rich Markdown & Code Support
    function formatMessageText(text) {
      if (!text) return '';
      let formatted = text
        // Code blocks ```lang ... ```
        .replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
          return `<pre class="chat-code-block"><code class="language-${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        })
        // Inline code `code`
        .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')
        // Bold: **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italics: *text*
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Links: [text](url)
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent); text-decoration:underline;">$1</a>')
        // Plain URLs: https://...
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--accent); text-decoration:underline;">$1</a>');

      return formatted;
    }

    function appendMessage(text, who = 'bot') {
      const el = document.createElement('div');
      el.className = `msg ${who === 'user' ? 'user' : 'bot'}`;
      
      if (who === 'bot') {
        el.innerHTML = formatMessageText(text);
      } else {
        el.textContent = text;
      }

      aiMessages.appendChild(el);
      aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    let aiConversationHistory = [];

    async function simulateBotResponse(query) {
      // Animated typing indicator
      const typing = document.createElement('div');
      typing.className = 'msg bot typing-indicator';
      typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
      aiMessages.appendChild(typing);
      aiMessages.scrollTop = aiMessages.scrollHeight;

      let reply = null;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            conversationHistory: aiConversationHistory
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.reply) {
            reply = data.reply;
          }
        }
      } catch (err) {
        // Network or offline fallback
      }

      if (!reply) {
        reply = processNaturalLanguageQuery(query);
      }

      aiConversationHistory.push({ role: 'user', content: query });
      aiConversationHistory.push({ role: 'assistant', content: reply });
      if (aiConversationHistory.length > 12) {
        aiConversationHistory = aiConversationHistory.slice(-12);
      }

      if (typing.parentNode) {
        aiMessages.removeChild(typing);
      }
      appendMessage(reply, 'bot');
    }

    aiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = aiInput.value.trim();
      if (!text) return;
      appendMessage(text, 'user');
      aiInput.value = '';
      simulateBotResponse(text);
    });

    if (quickBtns && quickBtns.length > 0) {
      quickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const q = e.currentTarget.dataset.q;
          if (q) {
            appendMessage(q, 'user');
            simulateBotResponse(q);
          }
        });
      });
    }
  }

  // ==========================================================================
  // Three.js Interactive 3D Cyber Matrix & 3D Mecha Robot Model
  // ==========================================================================
  if (typeof THREE !== 'undefined') {
    try {
      const themeColorMap = {
        'cyber-cyan': 0x00f2fe,
        'github-dark': 0x39D353,
        'github-light': 0x2DA44E,
        'navy-dark': 0x60A5FA,
        'forest-dark': 0x10B981,
        'steel-dark': 0x94A3B8,
        'cherry-dark': 0xF43F5E,
        'lavender-dark': 0xA855F7,
        'matcha-dark': 0x84CC16,
        'lavender-light': 0x9333EA
      };

      function getThemeColorHex() {
        const current = document.documentElement.dataset.theme || 'cyber-cyan';
        return themeColorMap[current] || 0x00f2fe;
      }

      // 1. Background Cyber Matrix Network
      let bgPointMat = null;
      let bgLineMat = null;

      (function initDeveloperCyberBackground() {
        const canvas = document.getElementById('three-canvas');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1200);
        camera.position.z = 380;

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        const particleCount = 80;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 850;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 650;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 450;
          velocities.push({
            x: (Math.random() - 0.5) * 0.35,
            y: (Math.random() - 0.5) * 0.35,
            z: (Math.random() - 0.5) * 0.35
          });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        bgPointMat = new THREE.PointsMaterial({
          color: getThemeColorHex(),
          size: 4.5,
          transparent: true,
          opacity: 0.75
        });

        const points = new THREE.Points(geometry, bgPointMat);
        scene.add(points);

        bgLineMat = new THREE.LineBasicMaterial({
          color: getThemeColorHex(),
          transparent: true,
          opacity: 0.16
        });

        const maxLineSegments = particleCount * particleCount;
        const linePositions = new Float32Array(maxLineSegments * 3);
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const lineMesh = new THREE.LineSegments(lineGeometry, bgLineMat);
        scene.add(lineMesh);

        let mouseX = 0;
        let mouseY = 0;
        document.addEventListener('mousemove', (e) => {
          mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
          mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
        }, { passive: true });

        function animateBg() {
          requestAnimationFrame(animateBg);

          const pos = geometry.attributes.position.array;
          let lineIdx = 0;
          const linePos = lineGeometry.attributes.position.array;

          for (let i = 0; i < particleCount; i++) {
            pos[i * 3] += velocities[i].x;
            pos[i * 3 + 1] += velocities[i].y;
            pos[i * 3 + 2] += velocities[i].z;

            if (pos[i * 3] < -425 || pos[i * 3] > 425) velocities[i].x *= -1;
            if (pos[i * 3 + 1] < -325 || pos[i * 3 + 1] > 325) velocities[i].y *= -1;
            if (pos[i * 3 + 2] < -225 || pos[i * 3 + 2] > 225) velocities[i].z *= -1;

            for (let j = i + 1; j < particleCount; j++) {
              const dx = pos[i * 3] - pos[j * 3];
              const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
              const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

              if (dist < 130) {
                linePos[lineIdx++] = pos[i * 3];
                linePos[lineIdx++] = pos[i * 3 + 1];
                linePos[lineIdx++] = pos[i * 3 + 2];

                linePos[lineIdx++] = pos[j * 3];
                linePos[lineIdx++] = pos[j * 3 + 1];
                linePos[lineIdx++] = pos[j * 3 + 2];
              }
            }
          }

          geometry.attributes.position.needsUpdate = true;
          lineGeometry.setDrawRange(0, lineIdx / 3);
          lineGeometry.attributes.position.needsUpdate = true;

          camera.position.x += (mouseX - camera.position.x) * 0.035;
          camera.position.y += (-mouseY - camera.position.y) * 0.035;
          camera.lookAt(scene.position);

          renderer.render(scene, camera);
        }

        animateBg();

        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
      })();

      // Global theme updater for 3D background cyber matrix
      window.updateCyberThemeColor = function(themeId) {
        const colorHex = themeColorMap[themeId] || 0x00f2fe;
        if (bgPointMat) bgPointMat.color.setHex(colorHex);
        if (bgLineMat) bgLineMat.color.setHex(colorHex);
      };

    } catch (e) {
      console.warn('Three.js initialization error:', e);
    }
  }

})();