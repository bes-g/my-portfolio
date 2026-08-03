/* Portfolio behavior and Three.js 3D robot that tracks cursor.
   Uses a placeholder GLB path: 'models/robot.glb' — replace with real file path when available.
*/

(() => {
  // Basic UI initialization
  document.getElementById('year').textContent = new Date().getFullYear();

  // Cache-bust the resume PDF link so it never shows a stale cached copy
  const cvDownloadLink = document.getElementById('cv-download-link');
  const profilePic = document.querySelector('.profile-pic');
  const profilePlaceholder = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="#0b0c10"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8da2b8" font-family="Inter,Arial,sans-serif" font-size="18">No Photo</text></svg>'
  );

  if (cvDownloadLink) {
    cvDownloadLink.href = `resume.pdf?v=${Date.now()}`;
  }

  const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin;

  // ROBOT EYE TRACKING
  const pupils = document.querySelectorAll('.pupil');

  document.addEventListener('mousemove', function(e) {
    pupils.forEach(function(pupil) {
      const eye = pupil.parentElement;
      const rect = eye.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;

      const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
      const distance = 6; // how far the pupil can move within the eye

      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      pupil.style.transform = `translate(${x}px, ${y}px)`;
    });
  });

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

  async function renderCvData(cv) {
    const heroHeadline = document.getElementById('hero-headline');
    const heroBio = document.getElementById('hero-bio');
    const aboutEducation = document.getElementById('about-education');
    const aboutTraining = document.getElementById('about-training');
    const skillsGrid = document.getElementById('skills-grid');
    const experienceTimeline = document.getElementById('experience-timeline');
    const projectsGrid = document.getElementById('projects-grid');
    const contactEmail = document.getElementById('contact-email');
    const contactGithub = document.getElementById('contact-github');
    const contactLinkedIn = document.getElementById('contact-linkedin');

    if (heroHeadline && cv.headline) heroHeadline.textContent = cv.headline;
    if (heroBio && cv.summary) heroBio.textContent = cv.summary;

    if (aboutEducation && Array.isArray(cv.education)) {
      aboutEducation.innerHTML = cv.education.map(item => `
        <p><strong>Education:</strong> ${item.degree} — ${item.institution}${item.years ? ` (${item.years})` : ''}</p>
      `).join('');
    }

    if (aboutTraining && Array.isArray(cv.training)) {
      aboutTraining.innerHTML = `<p><strong>Training:</strong> ${cv.training.map(item => item.title).join('; ')}</p>`;
    }

    if (skillsGrid && Array.isArray(cv.skills)) {
      skillsGrid.innerHTML = cv.skills.map(skill => `
        <div class="skill-card">
          <h4>${skill}</h4>
          <p>${skill}</p>
        </div>
      `).join('');
    }

    if (experienceTimeline && Array.isArray(cv.experience)) {
      experienceTimeline.innerHTML = cv.experience.map(exp => `
        <div class="timeline-item">
          <div class="time">${exp.year || ''}</div>
          <div class="event">
            <h4>${exp.title}</h4>
            <p>${exp.role ? exp.role + ' — ' : ''}${exp.description}</p>
          </div>
        </div>
      `).join('');
    }

    if (projectsGrid && Array.isArray(cv.projects)) {
      projectsGrid.innerHTML = cv.projects.map(project => `
        <div class="project-card">
          <h4>${project.name}</h4>
          <p>${project.description}</p>
        </div>
      `).join('');
    }

    if (contactEmail && cv.contact?.email) {
      contactEmail.textContent = cv.contact.email;
      contactEmail.href = `mailto:${cv.contact.email}`;
    }
    if (contactGithub && cv.contact?.github) {
      contactGithub.textContent = new URL(cv.contact.github).host + new URL(cv.contact.github).pathname;
      contactGithub.href = cv.contact.github;
    }
    if (contactLinkedIn && cv.contact?.linkedin) {
      contactLinkedIn.textContent = new URL(cv.contact.linkedin).host + new URL(cv.contact.linkedin).pathname;
      contactLinkedIn.href = cv.contact.linkedin;
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

  // RAG CHATBOT - Knowledge Base & Retrieval System
  const aiMessages = document.getElementById('ai-messages');
  const aiForm = document.getElementById('ai-form');
  const aiInput = document.getElementById('ai-input');
  const quickBtns = document.querySelectorAll('.quick-btn');

  if (aiMessages && aiForm && aiInput) {
    // Knowledge Base
    const knowledgeBase = {
      personal: {
        name: "Besufkad Tekalign",
        headline: "Mechanical Engineering Student | Web Developer | Robotics & AI Enthusiast",
        bio: "I am a Mechanical Engineering student at Addis Ababa University bridging the gap between hardware and software. My expertise spans mechanical system design, robotics, and industrial maintenance, combined with strong foundations in web development, Python programming, and cybersecurity. I am passionate about algorithmic problem-solving and building interactive, technical solutions.",
        education: "Mechanical Engineering — Addis Ababa University"
      },
      skills: {
        web: ["HTML", "CSS", "JavaScript", "Python", "Android Development Basics"],
        engineering: ["Mechanical System Design", "SOLIDWORKS", "Thermodynamics", "Heat Transfer", "Prototyping", "Machinery Diagnostics"],
        emerging: ["AI Fundamentals", "Data Fundamentals", "Robotics", "Cybersecurity", "CTF challenges"]
      },
      experience: [
        {
          title: "Simien Mountains Plastic Recycling Initiative",
          role: "Technical Lead",
          description: "Managing machinery diagnostics and collaborating with Arizona State University"
        },
        {
          title: "INSA",
          role: "Development Trainee",
          description: "Software development and web development training"
        },
        {
          title: "Ethiopian Statistical Service",
          role: "Technical Contributor",
          description: "Provided technical contributions during the 2024 Agricultural Census"
        },
        {
          title: "Ethiopian Artificial Intelligence Institute",
          role: "Student",
          description: "Completed intensive AI training"
        },
        {
          title: "Udacity Global Chapters Ethiopia",
          role: "Student",
          description: "Completed coursework in programming and data structures"
        }
      ],
      projects: [
        {
          name: "Lufthansa Technik Innovaero 2026 Challenge",
          description: "Submitted technical reporting and participated in the innovation competition"
        },
        {
          name: "The Udara Project",
          description: "Earned a digital Certificate of Participation (July 2026)"
        }
      ],
      contact: {
        email: "besufkadtekalign@gamil.com",
        github: "https://github.com/bes-g",
        linkedin: "https://www.linkedin.com/in/besufkad-tekalign"
      }
    };

    // RAG Retrieval System
    function tokenize(text) {
      return text.toLowerCase().match(/\b\w+\b/g) || [];
    }

    function calculateRelevance(query, text) {
      const queryTokens = tokenize(query);
      const textTokens = tokenize(text);
      let score = 0;
      queryTokens.forEach(token => {
        if (textTokens.includes(token)) score++;
      });
      return score > 0 ? score / Math.max(queryTokens.length, textTokens.length) : 0;
    }

    function retrieveRelevantInfo(query) {
      const lowerQuery = query.toLowerCase();
      let relevantInfo = [];
      let relevanceScores = [];

      // Check personal info
      if (lowerQuery.includes('who') || lowerQuery.includes('about') || lowerQuery.includes('name')) {
        relevantInfo.push(`I'm ${knowledgeBase.personal.name} — ${knowledgeBase.personal.headline}. ${knowledgeBase.personal.bio}`);
        relevanceScores.push(calculateRelevance(query, knowledgeBase.personal.bio) + 1);
      }

      // Check skills
      if (lowerQuery.includes('skill') || lowerQuery.includes('expertise') || lowerQuery.includes('know')) {
        const webSkillsStr = knowledgeBase.skills.web.join(', ');
        const engSkillsStr = knowledgeBase.skills.engineering.join(', ');
        const emergingSkillsStr = knowledgeBase.skills.emerging.join(', ');
        const skillsText = `Web: ${webSkillsStr}. Engineering: ${engSkillsStr}. Emerging Tech: ${emergingSkillsStr}`;
        relevantInfo.push(skillsText);
        relevanceScores.push(calculateRelevance(query, skillsText) + 0.8);
      }

      // Check experience
      if (lowerQuery.includes('experience') || lowerQuery.includes('work') || lowerQuery.includes('worked')) {
        knowledgeBase.experience.forEach(exp => {
          const expText = `${exp.title} - ${exp.role}: ${exp.description}`;
          relevantInfo.push(expText);
          relevanceScores.push(calculateRelevance(query, expText));
        });
      }

      // Check projects
      if (lowerQuery.includes('project') || lowerQuery.includes('build') || lowerQuery.includes('achievement')) {
        knowledgeBase.projects.forEach(proj => {
          const projText = `${proj.name}: ${proj.description}`;
          relevantInfo.push(projText);
          relevanceScores.push(calculateRelevance(query, projText) + 0.7);
        });
      }

      // Check specific keywords
      knowledgeBase.experience.forEach((exp) => {
        const expText = `${exp.title} ${exp.description}`;
        const score = calculateRelevance(query, expText);
        if (score > 0) {
          relevantInfo.push(expText);
          relevanceScores.push(score);
        }
      });

      // Sort by relevance and return top results
      return relevantInfo
        .map((info, idx) => ({ info, score: relevanceScores[idx] || 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.info);
    }

    // Response Generation
    function generateResponse(query, retrievedInfo) {
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
        return `Hello! I'm an AI assistant for Besufkad's portfolio. I can tell you about ${knowledgeBase.personal.name}'s skills, experience, projects, and background. What would you like to know?`;
      }

      if (!retrievedInfo || retrievedInfo.length === 0) {
        return "I don't have specific information about that. You can ask me about my skills, experience, projects, education, or background. What interests you?";
      }

      let response = "";
      
      if (lowerQuery.includes('who') || lowerQuery.includes('about')) {
        response = `${retrievedInfo[0]}`;
      } else if (lowerQuery.includes('skill') || lowerQuery.includes('expertise')) {
        response = `Here's what I'm skilled at:\n${retrievedInfo[0]}`;
      } else if (lowerQuery.includes('experience') || lowerQuery.includes('work')) {
        response = `My experience includes:\n${retrievedInfo.slice(0, 2).map((info, i) => `${i + 1}. ${info}`).join('\n')}`;
      } else if (lowerQuery.includes('project')) {
        response = `Some of my projects:\n${retrievedInfo.slice(0, 2).map((info, i) => `${i + 1}. ${info}`).join('\n')}`;
      } else {
        response = retrievedInfo.join('\n\n');
      }

      return response || "I'd be happy to help! Ask me about my skills, experience, or projects.";
    }

    // UI Functions
    function appendMessage(text, who = 'bot') {
      const el = document.createElement('div');
      el.className = `msg ${who === 'user' ? 'user' : 'bot'}`;
      el.textContent = text;
      aiMessages.appendChild(el);
      aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    function simulateBotResponse(query) {
      const retrievedInfo = retrieveRelevantInfo(query);
      const reply = generateResponse(query, retrievedInfo);
      
      const typing = document.createElement('div');
      typing.className = 'msg bot';
      typing.textContent = '...';
      aiMessages.appendChild(typing);
      aiMessages.scrollTop = aiMessages.scrollHeight;
      
      setTimeout(() => {
        aiMessages.removeChild(typing);
        appendMessage(reply, 'bot');
      }, 500 + Math.min(800, reply.length * 10));
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

  // Three.js Robot Scene
  // Pre-tool message: Initializing Three.js scene and loading GLB (placeholder path). Using pointer tracking to compute target for the robot to "look at".
  if (typeof THREE !== 'undefined') {
    try {
      (function initThree() {
        const canvasWrap = document.getElementById('three-canvas-wrap');
        const canvas = document.getElementById('three-canvas');

        let scene, camera, renderer, robot, mixer;
        let target = new THREE.Vector3(0, 1.6, 0); // default look target
        let mouse = new THREE.Vector2(0, 0);
        let clock = new THREE.Clock();

        scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.4, 3.5);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = false;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 0.6);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // subtle environment gradient (large plane very far)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({ color: 0x03060a, opacity: 0.0, transparent: true })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    scene.add(ground);

    // Group for robot
    robot = new THREE.Group();
    scene.add(robot);

    // Placeholder path — replace with actual file in models/robot.glb
    const glbPath = 'models/robot.glb';

    const loader = new THREE.GLTFLoader();
    let headObject = null; // object to rotate/lookAt

    loader.load(glbPath, function (gltf) {
      const model = gltf.scene || gltf.scenes[0];
      model.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = false;
          c.receiveShadow = false;
          c.material.side = THREE.FrontSide;
        }
      });
      // normalize scale and center
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = (1.1 / maxDim);
      model.scale.setScalar(scale);
      box.getCenter(model.position).multiplyScalar(-1);
      model.position.y -= 0.3; // lower to stand on ground
      robot.add(model);

      // Try to find a head object by common names
      headObject = model.getObjectByName('Head') || model.getObjectByName('head') || model.getObjectByName('HeadMesh') || null;
      if (!headObject) {
        // approximate head position: pick highest point
        let highest = null;
        model.traverse(node => {
          if (node.isMesh) {
            if (!highest || node.position.y > highest.position.y) highest = node;
          }
        });
        if (highest) {
          headObject = highest;
        }
      }
    }, undefined, function (err) {
      // If load fails, create a simple fallback robot
      console.warn('GLB load failed — using fallback robot. Please place model at', glbPath, err);
      // body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.0, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x0bd6b6, metalness: 0.4, roughness: 0.6, emissive: 0x003333, emissiveIntensity: 0.1 })
      );
      body.position.y = 0.25;
      // head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0x00b3ff, metalness: 0.3, roughness: 0.4, emissive: 0x002233, emissiveIntensity: 0.15 })
      );
      head.position.y = 0.9;
      const eye = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.06, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x031018, metalness: 0.1, roughness: 0.2 })
      );
      eye.position.set(0, 0, 0.22);
      head.add(eye);
      robot.add(body);
      robot.add(head);
      headObject = head;
    });

    // Keep the robot slightly to the right/center for layout balance
    robot.position.set(1.2, -0.5, -0.6);

    // Resize handler
    function onResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    // Track pointer position normalized -1..1
    window.addEventListener('pointermove', (e) => {
      // convert to normalized device coordinates
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    // Smooth target movement
    const smoothed = new THREE.Vector3();

    function animate() {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();

      // compute world-space target from mouse
      const ndc = new THREE.Vector3(mouse.x, mouse.y, 0.5);
      ndc.unproject(camera); // now in world coords at depth of 0.5
      // direction from camera to ndc
      const dir = ndc.clone().sub(camera.position).normalize();
      // choose a distance for the look target
      const distance = 3.0;
      target.copy(camera.position).add(dir.multiplyScalar(distance));
      // interpolate smoothed target for organic movement
      smoothed.lerp(target, 0.08);

      // If head object exists, lookAt
      if (headObject) {
        // compute local look target relative to head's parent to avoid weird rotations
        const headWorldPos = new THREE.Vector3();
        headObject.getWorldPosition(headWorldPos);

        // direction from head to smoothed target
        const lookDir = smoothed.clone().sub(headWorldPos).normalize();

        // Compute a quaternion that rotates the head's forward axis to lookDir
        // Determine the forward axis; assume +Z is forward for mesh
        const forward = new THREE.Vector3(0, 0, 1);
        const parent = headObject.parent || robot;
        // convert lookDir into the local space of the head's parent
        const invParentQuat = parent.getWorldQuaternion(new THREE.Quaternion()).invert();
        const localLook = lookDir.clone().applyQuaternion(invParentQuat);

        // create quaternion to rotate forward to localLook
        const q = new THREE.Quaternion().setFromUnitVectors(forward, localLook);
        // apply a small smoothing
        headObject.quaternion.slerp(q, 0.12);
      } else {
        // if no headObject, rotate whole robot subtly
        const rotY = Math.atan2(mouse.x, 1.6) * 0.18;
        robot.rotation.y += (rotY - robot.rotation.y) * 0.06;
      }

      // subtle breathing / idle movement
      robot.position.y += Math.sin(clock.elapsedTime * 0.6) * 0.0008;

      renderer.render(scene, camera);
    }

    animate();

    // Clean up on page unload (helpful for dev/live reload)
    window.addEventListener('unload', () => {
      renderer.dispose();
    });

    // Limit canvas size and DPI for mobile performance
    function limitDPR() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
    }
    limitDPR();
      })();
    } catch (e) {
      console.error('Three.js initialization error:', e);
    }
  }

})();