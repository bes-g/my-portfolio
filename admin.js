(() => {
  const yearEl = document.getElementById('year');
  const themeToggle = document.getElementById('theme-toggle');
  const form = document.getElementById('admin-form');
  const feedback = document.getElementById('admin-feedback');
  const passwordInput = document.getElementById('admin-password');
  const loadButton = document.getElementById('load-cv');

  const nameInput = document.getElementById('name');
  const headlineInput = document.getElementById('headline');
  const summaryInput = document.getElementById('summary');
  const skillsInput = document.getElementById('skills-list');

  const contactList = document.getElementById('contact-list');
  const educationList = document.getElementById('education-list');
  const trainingList = document.getElementById('training-list');
  const experienceList = document.getElementById('experience-list');
  const projectsList = document.getElementById('projects-list');

  const addContactButton = document.getElementById('add-contact');
  const addEducationButton = document.getElementById('add-education');
  const addTrainingButton = document.getElementById('add-training');
  const addExperienceButton = document.getElementById('add-experience');
  const addProjectButton = document.getElementById('add-project');
  const pdfInput = document.getElementById('cv-pdf');
  const uploadPdfButton = document.getElementById('upload-pdf');
  const deletePdfButton = document.getElementById('delete-pdf');
  const photoInput = document.getElementById('profile-pic');
  const uploadPhotoButton = document.getElementById('upload-photo');
  const deletePhotoButton = document.getElementById('delete-photo');
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const changePasswordButton = document.getElementById('change-password');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin;

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    localStorage.setItem('theme', theme);
  }

  function getSavedTheme() {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  setTheme(getSavedTheme());

  function createInput(labelText, className, placeholder = '', value = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';

    const label = document.createElement('label');
    label.textContent = labelText;
    wrapper.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = className;
    input.placeholder = placeholder;
    input.value = value || '';
    wrapper.appendChild(input);

    return wrapper;
  }

  function createTextarea(labelText, className, placeholder = '', value = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';

    const label = document.createElement('label');
    label.textContent = labelText;
    wrapper.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.className = className;
    textarea.placeholder = placeholder;
    textarea.rows = 3;
    textarea.value = value || '';
    wrapper.appendChild(textarea);

    return wrapper;
  }

  function createEntryCard(fields) {
    const card = document.createElement('div');
    card.className = 'entry-card';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn outline remove-entry';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => card.remove());
    card.appendChild(removeButton);

    fields.forEach(field => card.appendChild(field));

    return card;
  }

  function addContactEntry(data = {}) {
    const card = createEntryCard([
      createInput('Platform / Account Type', 'contact-platform', 'e.g. Telegram, Email, GitHub, LinkedIn, Phone, X/Twitter', data.platform || ''),
      createInput('URL, Username, or Handle', 'contact-value', 'e.g. https://t.me/yourusername, username@example.com, https://github.com/...', data.value || data.url || ''),
      createInput('Display Text (Optional)', 'contact-label', 'e.g. @username or t.me/username (optional)', data.label || '')
    ]);
    card.classList.add('contact-entry');
    contactList.appendChild(card);
  }

  function addEducationEntry(data = {}) {
    const card = createEntryCard([
      createInput('Institution', 'institution', 'University or school', data.institution),
      createInput('Degree', 'degree', 'Degree or program', data.degree),
      createInput('Years', 'years', '2023 – Present', data.years)
    ]);
    card.classList.add('education-entry');
    educationList.appendChild(card);
  }

  function addTrainingEntry(data = {}) {
    const card = createEntryCard([
      createInput('Title', 'title', 'Training or course name', data.title),
      createTextarea('Description', 'description', 'Describe the training', data.description)
    ]);
    card.classList.add('training-entry');
    trainingList.appendChild(card);
  }

  function addExperienceEntry(data = {}) {
    const card = createEntryCard([
      createInput('Year', 'year', '2024', data.year),
      createInput('Title', 'title', 'Role or position', data.title),
      createInput('Role', 'role', 'Technical Lead, Trainee, etc.', data.role),
      createTextarea('Description', 'description', 'What you did', data.description)
    ]);
    card.classList.add('experience-entry');
    experienceList.appendChild(card);
  }

  function addProjectEntry(data = {}) {
    const card = createEntryCard([
      createInput('Project Name', 'name', 'Project title', data.name),
      createTextarea('Description', 'description', 'Brief project summary', data.description)
    ]);
    card.classList.add('project-entry');
    projectsList.appendChild(card);
  }

  function clearList(list) {
    if (!list) return;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
  }

  function collectEntries(selector, mapping) {
    return Array.from(document.querySelectorAll(selector)).map(card => {
      const entry = {};
      Object.keys(mapping).forEach(key => {
        const element = card.querySelector(`.${mapping[key]}`);
        entry[key] = element ? element.value.trim() : '';
      });
      return entry;
    }).filter(entry => Object.values(entry).some(value => value));
  }

  async function loadCv() {
    feedback.textContent = 'Loading current CV...';
    feedback.style.color = 'var(--muted)';

    try {
      const response = await fetch(`${apiBase}/api/cv`);
      if (!response.ok) {
        throw new Error('Unable to fetch CV.');
      }
      const cv = await response.json();

      nameInput.value = cv.name || '';
      headlineInput.value = cv.headline || '';
      summaryInput.value = cv.summary || '';
      skillsInput.value = Array.isArray(cv.skills) ? cv.skills.join('\n') : '';

      clearList(contactList);
      clearList(educationList);
      clearList(trainingList);
      clearList(experienceList);
      clearList(projectsList);

      let loadedContacts = [];
      if (Array.isArray(cv.contacts) && cv.contacts.length) {
        loadedContacts = cv.contacts;
      } else if (Array.isArray(cv.contact) && cv.contact.length) {
        loadedContacts = cv.contact;
      } else if (cv.contact && typeof cv.contact === 'object') {
        if (Array.isArray(cv.contact.list) && cv.contact.list.length) {
          loadedContacts = cv.contact.list;
        } else {
          Object.keys(cv.contact).forEach(key => {
            if (key === 'list') return;
            const val = cv.contact[key];
            if (val && typeof val === 'string') {
              const platformName = key.toLowerCase() === 'github' ? 'GitHub' :
                                   key.toLowerCase() === 'linkedin' ? 'LinkedIn' :
                                   key.toLowerCase() === 'telegram' ? 'Telegram' :
                                   key.charAt(0).toUpperCase() + key.slice(1);
              loadedContacts.push({
                platform: platformName,
                value: val,
                label: ''
              });
            }
          });
        }
      }

      if (loadedContacts.length > 0) {
        loadedContacts.forEach(item => addContactEntry(item));
      } else {
        addContactEntry({ platform: 'Email', value: '' });
      }

      if (Array.isArray(cv.education) && cv.education.length) {
        cv.education.forEach(item => addEducationEntry(item));
      } else {
        addEducationEntry();
      }

      if (Array.isArray(cv.training) && cv.training.length) {
        cv.training.forEach(item => addTrainingEntry(item));
      } else {
        addTrainingEntry();
      }

      if (Array.isArray(cv.experience) && cv.experience.length) {
        cv.experience.forEach(item => addExperienceEntry(item));
      } else {
        addExperienceEntry();
      }

      if (Array.isArray(cv.projects) && cv.projects.length) {
        cv.projects.forEach(item => addProjectEntry(item));
      } else {
        addProjectEntry();
      }

      feedback.textContent = 'CV loaded successfully. Make edits and save.';
      feedback.style.color = 'var(--accent)';
    } catch (err) {
      feedback.textContent = `Error loading CV: ${err.message}`;
      feedback.style.color = 'salmon';
    }
  }

  function getFormData() {
    const contactsList = collectEntries('.contact-entry', {
      platform: 'contact-platform',
      value: 'contact-value',
      label: 'contact-label'
    });

    const contactObj = {
      list: contactsList
    };

    contactsList.forEach(c => {
      const p = (c.platform || '').trim().toLowerCase();
      if (p === 'email' && !contactObj.email) contactObj.email = c.value;
      if (p === 'github' && !contactObj.github) contactObj.github = c.value;
      if (p === 'linkedin' && !contactObj.linkedin) contactObj.linkedin = c.value;
      if (p === 'telegram' && !contactObj.telegram) contactObj.telegram = c.value;
      if (p && !contactObj[p]) contactObj[p] = c.value;
    });

    return {
      name: nameInput.value.trim(),
      headline: headlineInput.value.trim(),
      summary: summaryInput.value.trim(),
      education: collectEntries('.education-entry', { institution: 'institution', degree: 'degree', years: 'years' }),
      training: collectEntries('.training-entry', { title: 'title', description: 'description' }),
      skills: skillsInput.value.split('\n').map(item => item.trim()).filter(Boolean),
      experience: collectEntries('.experience-entry', { year: 'year', title: 'title', role: 'role', description: 'description' }),
      projects: collectEntries('.project-entry', { name: 'name', description: 'description' }),
      contact: contactObj,
      contacts: contactsList
    };
  }

  async function saveCv(event) {
    event.preventDefault();
    const password = passwordInput.value.trim();
    if (!password) {
      feedback.textContent = 'Enter the admin password before saving.';
      feedback.style.color = 'salmon';
      return;
    }

    const cv = getFormData();

    feedback.textContent = 'Saving CV...';
    feedback.style.color = 'var(--muted)';

    try {
      const response = await fetch(`${apiBase}/api/cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, cv })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to save CV.');
      }

      feedback.textContent = 'CV saved successfully.';
      feedback.style.color = 'var(--accent)';
      passwordInput.value = '';
    } catch (err) {
      feedback.textContent = `Error saving CV: ${err.message}`;
      feedback.style.color = 'salmon';
    }
  }

  if (form) {
    form.addEventListener('submit', saveCv);
  }

  if (loadButton) {
    loadButton.addEventListener('click', loadCv);
  }

  if (addContactButton) addContactButton.addEventListener('click', () => addContactEntry());
  if (addEducationButton) addEducationButton.addEventListener('click', () => addEducationEntry());
  if (addTrainingButton) addTrainingButton.addEventListener('click', () => addTrainingEntry());
  if (addExperienceButton) addExperienceButton.addEventListener('click', () => addExperienceEntry());
  if (addProjectButton) addProjectButton.addEventListener('click', () => addProjectEntry());
  if (uploadPdfButton) uploadPdfButton.addEventListener('click', uploadPdf);
  if (deletePdfButton) deletePdfButton.addEventListener('click', deletePdf);
  if (uploadPhotoButton) uploadPhotoButton.addEventListener('click', uploadPhoto);
  if (deletePhotoButton) deletePhotoButton.addEventListener('click', deletePhoto);
  if (changePasswordButton) changePasswordButton.addEventListener('click', changePassword);

  async function changePassword() {
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      feedback.textContent = 'Fill in all password fields.';
      feedback.style.color = 'salmon';
      return;
    }

    if (newPassword !== confirmPassword) {
      feedback.textContent = 'New passwords do not match.';
      feedback.style.color = 'salmon';
      return;
    }

    if (newPassword.length < 4) {
      feedback.textContent = 'New password must be at least 4 characters.';
      feedback.style.color = 'salmon';
      return;
    }

    feedback.textContent = 'Updating password...';
    feedback.style.color = 'var(--muted)';

    try {
      const response = await fetch(`${apiBase}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to change password.');
      }

      feedback.textContent = 'Password updated successfully.';
      feedback.style.color = 'var(--accent)';
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
    } catch (err) {
      feedback.textContent = `Error changing password: ${err.message}`;
      feedback.style.color = 'salmon';
    }
  }

  async function uploadPdf() {
    const password = passwordInput.value.trim();
    if (!password) {
      feedback.textContent = 'Enter the admin password before uploading.';
      feedback.style.color = 'salmon';
      return;
    }

    if (!pdfInput || !pdfInput.files || pdfInput.files.length === 0) {
      feedback.textContent = 'Choose a PDF file to upload.';
      feedback.style.color = 'salmon';
      return;
    }

    const file = pdfInput.files[0];
    if (file.type !== 'application/pdf') {
      feedback.textContent = 'Only PDF files are allowed.';
      feedback.style.color = 'salmon';
      return;
    }

    const formData = new FormData();
    formData.append('cvPdf', file);
    formData.append('password', password);

    feedback.textContent = 'Uploading PDF...';
    feedback.style.color = 'var(--muted)';

    try {
      const response = await fetch(`${apiBase}/api/upload-pdf`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to upload PDF.');
      }

      feedback.textContent = result.message || 'PDF uploaded successfully.';
      feedback.style.color = 'var(--accent)';
      pdfInput.value = '';
      await refreshUploadStatus();
    } catch (err) {
      feedback.textContent = `Error uploading PDF: ${err.message}`;
      feedback.style.color = 'salmon';
    }
  }

  async function uploadPhoto() {
    const password = passwordInput.value.trim();
    if (!password) {
      feedback.textContent = 'Enter the admin password before uploading.';
      feedback.style.color = 'salmon';
      return;
    }

    if (!photoInput || !photoInput.files || photoInput.files.length === 0) {
      feedback.textContent = 'Choose an image file to upload.';
      feedback.style.color = 'salmon';
      return;
    }

    const file = photoInput.files[0];
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      feedback.textContent = 'Only JPEG, PNG, or WEBP images are allowed.';
      feedback.style.color = 'salmon';
      return;
    }

    const formData = new FormData();
    formData.append('profilePic', file);
    formData.append('password', password);

    feedback.textContent = 'Uploading photo...';
    feedback.style.color = 'var(--muted)';

    try {
      const response = await fetch(`${apiBase}/api/upload-photo`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to upload photo.');
      }

      feedback.textContent = result.message || 'Profile photo uploaded successfully.';
      feedback.style.color = 'var(--accent)';
      photoInput.value = '';
      await refreshUploadStatus();
    } catch (err) {
      feedback.textContent = `Error uploading photo: ${err.message}`;
      feedback.style.color = 'salmon';
    }
  }

  async function deletePdf() {
    const password = passwordInput.value.trim();
    if (!password) {
      feedback.textContent = 'Enter the admin password before deleting.';
      feedback.style.color = 'salmon';
      return;
    }

    feedback.textContent = 'Deleting CV...';
    feedback.style.color = 'var(--muted)';

    try {
      const response = await fetch(`${apiBase}/api/upload-pdf`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to delete CV.');
      }

      feedback.textContent = result.message || 'CV deleted successfully.';
      feedback.style.color = 'var(--accent)';
      await refreshUploadStatus();
    } catch (err) {
      feedback.textContent = `Error deleting CV: ${err.message}`;
      feedback.style.color = 'salmon';
    }
  }

  async function deletePhoto() {
    const password = passwordInput.value.trim();
    if (!password) {
      feedback.textContent = 'Enter the admin password before deleting.';
      feedback.style.color = 'salmon';
      return;
    }

    feedback.textContent = 'Deleting profile photo...';
    feedback.style.color = 'var(--muted)';

    try {
      const response = await fetch(`${apiBase}/api/upload-photo`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to delete profile photo.');
      }

      feedback.textContent = result.message || 'Profile photo deleted successfully.';
      feedback.style.color = 'var(--accent)';
      await refreshUploadStatus();
    } catch (err) {
      feedback.textContent = `Error deleting profile photo: ${err.message}`;
      feedback.style.color = 'salmon';
    }
  }

  async function refreshUploadStatus() {
    try {
      const response = await fetch(`${apiBase}/api/uploads/status`);
      if (!response.ok) {
        throw new Error('Unable to fetch upload status.');
      }
      const status = await response.json();
      const cvStatus = document.getElementById('cv-status');
      const photoStatus = document.getElementById('photo-status');

      if (cvStatus) {
        cvStatus.textContent = status.cvUploaded ? 'CV is uploaded and available on the portfolio.' : 'No CV uploaded yet.';
        cvStatus.style.color = status.cvUploaded ? 'var(--accent)' : 'salmon';
      }
      if (photoStatus) {
        photoStatus.textContent = status.profileUploaded ? 'Profile photo is uploaded and visible on the portfolio.' : 'No profile photo uploaded yet.';
        photoStatus.style.color = status.profileUploaded ? 'var(--accent)' : 'salmon';
      }
    } catch (err) {
      console.warn('Upload status error:', err);
    }
  }

  loadCv();
  refreshUploadStatus();
})();