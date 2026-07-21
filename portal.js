// DreamSites.pro - Client Portal & Spec Generator Logic (Supabase Powered)

const SUPABASE_URL = "https://uummphswzohaxqwytbtu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bW1waHN3em9oYXhxd3l0YnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NTQ4NTIsImV4cCI6MjA2MDAzMDg1Mn0.TU_k5iphEcLf3XmejlqUe0p0kNT2y6Kd3jUEJtaB98I";

// Initialize Supabase Client
let db = null;
if (window.supabase) {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Global App State
let currentUser = null;
let currentProfile = null;
let currentProject = null;
let userProjects = [];
let currentSpecs = [];
let isDesignerMode = false;
let adminAllClients = [];
let openSpecIds = new Set(); // Accordion open state tracker

// Admin Account Identifier
const ADMIN_USERNAME = "daxiel777";
const ADMIN_EMAIL = "daxiel777@dreamsites.pro";

// Standardized Web Design Questionnaire Items
const DEFAULT_QUESTIONS = [
  {
    key: 'business_identity',
    title: '1. Business Identity & Core Offerings',
    tag: '#Brand-Identity',
    desc: 'What is your business name, industry, primary services/products offered, and brand tagline?'
  },
  {
    key: 'target_audience',
    title: '2. Target Audience & Primary Call-to-Action',
    tag: '#Audience-Conversion',
    desc: 'Who is your ideal customer, and what is the #1 action they should take on your website? (e.g. Call immediately, Book online, Request a Quote)'
  },
  {
    key: 'design_aesthetic',
    title: '3. Design Aesthetic & Benchmark Websites',
    tag: '#Design-Aesthetic',
    desc: 'What visual style do you prefer (e.g., Sleek Dark Mode, Warm Minimalist, Bold & Vibrant, Clean Corporate)? Please share 2-3 links of websites you love.'
  },
  {
    key: 'content_pages',
    title: '4. Site Architecture & Key Pages',
    tag: '#Content-Pages',
    desc: 'Which pages/sections do you require? (e.g. Home, About Us, Services, Portfolio/Gallery, Pricing, FAQ, Contact, Blog)'
  },
  {
    key: 'e_commerce',
    title: '5. E-Commerce & Online Payments',
    tag: '#E-Commerce',
    desc: 'Do you need to sell physical or digital products, accept online deposit payments, or send client invoices?'
  },
  {
    key: 'user_portal',
    title: '6. User Logins & Client Portals',
    tag: '#User-Portal',
    desc: 'Do your customers need account registration, order tracking, downloadable files, or member-only restricted pages?'
  },
  {
    key: 'ai_automation',
    title: '7. Smart AI Tools & Online Booking',
    tag: '#AI-Automation',
    desc: 'Would you like to integrate an AI Customer Chatbot, automated online calendar scheduling, or AI call routing?'
  },
  {
    key: 'content_assets',
    title: '8. Copywriting & Media Assets',
    tag: '#Content-Assets',
    desc: 'Do you already have your logo, high-res photos, videos, and written text ready, or will you need copywriting and media asset creation?'
  },
  {
    key: 'seo_marketing',
    title: '9. Local SEO & Marketing Integrations',
    tag: '#SEO-Marketing',
    desc: 'What main keywords or local areas do you want to rank for in search results? Do you need Google Analytics or social media links connected?'
  },
  {
    key: 'timeline_budget',
    title: '10. Target Deadline & Investment Budget',
    tag: '#Timeline-Budget',
    desc: 'What is your target launch deadline and preferred budget range for this website/app project?'
  },
  {
    key: 'domain_hosting',
    title: '11. Domain, Hosting & Infrastructure',
    tag: '#Domain-Hosting',
    desc: 'Do you already own your domain name and web hosting (e.g. GoDaddy, Namecheap, Cloudflare), or do you need assistance purchasing, configuring DNS, and setting up SSL certificates?'
  },
  {
    key: 'third_party_integrations',
    title: '12. Third-Party Software & API Integrations',
    tag: '#Integrations-APIs',
    desc: 'Which existing business software tools must connect to your site? (e.g. CRM like HubSpot/Salesforce, Email Marketing like Mailchimp/Klaviyo, Calendly, Zapier, ERP, or payment gateways)'
  },
  {
    key: 'maintenance_care',
    title: '13. Post-Launch Maintenance & Technical Care',
    tag: '#Maintenance-Care',
    desc: 'Do you require ongoing post-launch support, monthly security updates, automated backups, speed optimization, or a content update retainer?'
  },
  {
    key: 'multilingual_accessibility',
    title: '14. Multilingual & ADA Accessibility Compliance',
    tag: '#Multilingual-ADA',
    desc: 'Does your website need to support multiple languages or adhere to formal accessibility standards (WCAG 2.1 / ADA compliance)?'
  }
];

const WEBSITE_QUESTIONS = DEFAULT_QUESTIONS;

// Standardized Application Development Questionnaire Items
const APP_QUESTIONS = [
  {
    key: 'app_scope_type',
    title: '1. Application Type & Scope',
    tag: '#App-Scope',
    desc: 'Is this a standalone web or mobile application, a SaaS product, or a custom application module/widget to be integrated into an existing website?'
  },
  {
    key: 'core_purpose_features',
    title: '2. Core Purpose & Key Features',
    tag: '#Core-Features',
    desc: 'What primary business problem does this application solve, and what are its 3 to 5 essential user features?'
  },
  {
    key: 'target_users_roles',
    title: '3. Target Users & Access Roles',
    tag: '#User-Roles',
    desc: 'Who will use the application (e.g. general public, paying clients, internal staff, admins)? What permission levels or role restrictions are needed?'
  },
  {
    key: 'user_auth_profiles',
    title: '4. Authentication & User Profiles',
    tag: '#Auth-Profiles',
    desc: 'How will users sign up and log in (e.g., Email/Password, Google/OAuth, SSO, Magic Links)? What user profile data and account settings are stored?'
  },
  {
    key: 'data_management_schema',
    title: '5. Data Management & Database Schema',
    tag: '#Data-Schema',
    desc: 'What data does the application capture, calculate, or display? Do you have existing database systems, APIs, or spreadsheets to import?'
  },
  {
    key: 'ui_ux_platform',
    title: '6. UI/UX & Platform Requirements',
    tag: '#UX-Platform',
    desc: 'Is this application designed primarily for desktop web, mobile web, or responsive cross-platform? Do you have design preferences or benchmark apps?'
  },
  {
    key: 'workflows_business_logic',
    title: '7. Workflows & Business Logic',
    tag: '#App-Logic',
    desc: 'Describe step-by-step user workflows, automated calculations, background tasks, or notification triggers (email, SMS, push notifications).'
  },
  {
    key: 'api_integrations',
    title: '8. Third-Party APIs & System Integrations',
    tag: '#API-Integrations',
    desc: 'Which external APIs or software must connect to your app? (e.g. Stripe, Twilio, OpenAI/LLMs, Google Maps, CRM, Zapier, custom webhooks)'
  },
  {
    key: 'ecommerce_monetization',
    title: '9. E-Commerce, Subscriptions & Payments',
    tag: '#Monetization',
    desc: 'Will the application process one-time payments, recurring subscription billing, usage-based fees, or generate invoices for clients?'
  },
  {
    key: 'admin_dashboard',
    title: '10. Admin Dashboard & Operations',
    tag: '#Admin-Dashboard',
    desc: 'What admin controls, reporting charts, user management tools, or content approval workflows are needed behind the scenes?'
  },
  {
    key: 'security_compliance',
    title: '11. Security, Privacy & Data Compliance',
    tag: '#Security-Compliance',
    desc: 'Does the application handle sensitive data subject to compliance standards (e.g. HIPAA, PCI-DSS payment security, GDPR privacy, encryption)?'
  },
  {
    key: 'hosting_cloud_infrastructure',
    title: '12. Cloud Hosting & Infrastructure',
    tag: '#Hosting-Cloud',
    desc: 'Do you have preferred server infrastructure (e.g. Vercel, AWS, Firebase, Supabase), or do you need complete backend setup and deployment?'
  },
  {
    key: 'timeline_budget_app',
    title: '13. Target Deadline & Investment Budget',
    tag: '#Timeline-Budget',
    desc: 'What is your target launch deadline for the MVP/app and preferred budget range for building this application?'
  },
  {
    key: 'maintenance_scaling',
    title: '14. Post-Launch Maintenance & Scaling',
    tag: '#Maintenance-Scaling',
    desc: 'Will you require ongoing server maintenance, bug fixes, feature scaling, or SLA technical support post-launch?'
  }
];

function resolveProjectType(proj) {
  if (!proj) return 'website';
  let pType = (proj.project_type || '').toLowerCase();
  if (!pType && proj.id) {
    pType = (localStorage.getItem(`ds_proj_type_${proj.id}`) || '').toLowerCase();
  }
  if (!pType && currentProject && currentProject.id === proj.id && currentSpecs && currentSpecs.length > 0) {
    const isApp = currentSpecs.some(s => APP_QUESTIONS.some(aq => aq.key === s.question_key));
    if (isApp) pType = 'application';
  }
  return (pType === 'application' || pType === 'app') ? 'application' : 'website';
}

function getQuestionsForProject(proj) {
  const pType = resolveProjectType(proj);
  return pType === 'application' ? APP_QUESTIONS : WEBSITE_QUESTIONS;
}


document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await checkSession();
});

function setupEventListeners() {
  // Auth Form Tabs
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      const mode = e.target.dataset.mode;
      document.getElementById('authSubmitBtn').textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
      document.getElementById('authMode').value = mode;
      document.getElementById('profileFieldsGroup').style.display = mode === 'signup' ? 'block' : 'none';
    });
  });

  // Auth Form Submit
  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }

  // Desktop Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Dashboard Nav Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      const targetTab = e.currentTarget;
      targetTab.classList.add('active');
      showTabSection(targetTab.dataset.tab);
    });
  });

  // Questionnaire Save Form
  const questionnaireForm = document.getElementById('questionnaireForm');
  if (questionnaireForm) {
    questionnaireForm.addEventListener('submit', handleQuestionnaireSave);
  }

  // Create Project Button & Form
  const createProjectHeaderBtn = document.getElementById('createProjectHeaderBtn');
  if (createProjectHeaderBtn) {
    createProjectHeaderBtn.addEventListener('click', () => toggleCreateProjectForm(true));
  }

  const cancelCreateProjectBtn = document.getElementById('cancelCreateProjectBtn');
  if (cancelCreateProjectBtn) {
    cancelCreateProjectBtn.addEventListener('click', () => toggleCreateProjectForm(false));
  }

  const createProjectForm = document.getElementById('createProjectForm');
  if (createProjectForm) {
    createProjectForm.addEventListener('submit', handleCreateProjectSubmit);
  }

  // Back to All Projects Button
  const btnBackToProjects = document.getElementById('btnBackToProjects');
  if (btnBackToProjects) {
    btnBackToProjects.addEventListener('click', async () => {
      if (isDesignerMode) {
        await loadAdminClientList();
      } else {
        await loadUserProjectsList();
      }
    });
  }

  // Admin Client Selector Dropdown
  const adminClientSelect = document.getElementById('adminClientSelect');
  if (adminClientSelect) {
    adminClientSelect.addEventListener('change', async (e) => {
      const selectedProjectId = e.target.value;
      if (selectedProjectId) {
        await selectAdminProject(selectedProjectId);
      }
    });
  }

  // Mobile Hamburger Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('portalMobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }

  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', handleLogout);
  }
}

let toastTimer = null;
function showToastOverlay(message) {
  const el = document.getElementById('toastOverlay');
  const txt = document.getElementById('toastText');
  if (!el || !txt) return;

  txt.textContent = message;
  el.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
  }, 2000);
}

async function checkSession() {
  if (!db) {
    showAuthError("Supabase client missing.");
    return;
  }

  const { data: { session }, error } = await db.auth.getSession();
  if (session && session.user) {
    currentUser = session.user;
    await loadUserProfile();
  } else {
    showAuthView();
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  clearAuthError();

  const mode = document.getElementById('authMode').value;
  let emailInputVal = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const fullName = document.getElementById('fullNameInput') ? document.getElementById('fullNameInput').value.trim() : '';
  const companyName = document.getElementById('companyNameInput') ? document.getElementById('companyNameInput').value.trim() : '';

  if (!emailInputVal || !password) {
    showAuthError("Please enter email/username and password.");
    return;
  }

  // Format email if username 'Daxiel777' is entered
  let formattedEmail = emailInputVal.toLowerCase();
  if (formattedEmail === ADMIN_USERNAME) {
    formattedEmail = ADMIN_EMAIL;
  } else if (!formattedEmail.includes('@')) {
    formattedEmail = `${formattedEmail}@dreamsites.pro`;
  }

  try {
    if (mode === 'signup') {
      const isAdminReg = formattedEmail === ADMIN_EMAIL;
      const { data, error } = await db.auth.signUp({ 
        email: formattedEmail, 
        password: password,
        options: { emailRedirectTo: 'https://dreamsites.pro/portal.html' }
      });
      if (error) throw error;

      if (data.user) {
        await db.from('ds_profiles').insert([{
          id: data.user.id,
          email: formattedEmail,
          full_name: isAdminReg ? 'Designer / Admin' : (fullName || 'Client'),
          company_name: isAdminReg ? 'DreamSites.pro' : (companyName || ''),
          role: isAdminReg ? 'designer' : 'client'
        }]);
        currentUser = data.user;
        await loadUserProfile();
      }
    } else {
      let { data, error } = await db.auth.signInWithPassword({ email: formattedEmail, password });
      
      // Auto-provision Daxiel777 Admin account in Supabase if it doesn't exist yet
      if (error && formattedEmail === ADMIN_EMAIL) {
        const signUpRes = await db.auth.signUp({ 
          email: formattedEmail, 
          password: password,
          options: { emailRedirectTo: 'https://dreamsites.pro/portal.html' }
        });
        if (signUpRes.data && signUpRes.data.user) {
          await db.from('ds_profiles').upsert([{
            id: signUpRes.data.user.id,
            email: formattedEmail,
            full_name: 'Designer / Admin',
            company_name: 'DreamSites.pro',
            role: 'designer'
          }]);
          currentUser = signUpRes.data.user;
          await loadUserProfile();
          return;
        }
      }

      if (error) throw error;
      currentUser = data.user;
      await loadUserProfile();
    }
  } catch (err) {
    showAuthError(err.message || "Authentication failed. Check your login details.");
  }
}

async function loadUserProfile() {
  try {
    const { data: profile, error } = await db
      .from('ds_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    const isAdminUser = (currentUser.email.toLowerCase() === ADMIN_EMAIL) || (profile && profile.role === 'designer');

    if (profile) {
      currentProfile = profile;
      if (isAdminUser && currentProfile.role !== 'designer') {
        currentProfile.role = 'designer';
        await db.from('ds_profiles').update({ role: 'designer' }).eq('id', currentUser.id);
      }
    } else {
      currentProfile = { 
        id: currentUser.id, 
        email: currentUser.email, 
        role: isAdminUser ? 'designer' : 'client', 
        full_name: isAdminUser ? 'Designer / Admin' : 'Client' 
      };
    }

    // Set UI Header Info
    const labelTxt = `${currentProfile.full_name || currentUser.email} (${currentProfile.role.toUpperCase()})`;
    document.getElementById('userEmailLabel').textContent = labelTxt;
    document.getElementById('userBadge').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'inline-block';

    if (document.getElementById('mobileUserEmailLabel')) {
      document.getElementById('mobileUserEmailLabel').textContent = labelTxt;
      document.getElementById('mobileUserBadge').style.display = 'block';
    }
    if (document.getElementById('mobileLogoutBtn')) {
      document.getElementById('mobileLogoutBtn').style.display = 'flex';
    }

    document.getElementById('authSection').style.display = 'none';

    // Admin Access Configuration
    if (currentProfile.role === 'designer') {
      isDesignerMode = true;
      document.getElementById('adminSelectorBar').style.display = 'flex';
      document.getElementById('projectsSection').style.display = 'none';
      document.getElementById('portalDashboard').style.display = 'block';
      await loadAdminClientList();
    } else {
      isDesignerMode = false;
      document.getElementById('adminSelectorBar').style.display = 'none';
      await loadUserProjectsList();
    }
  } catch (err) {
    console.error("Error loading user profile:", err);
  }
}

async function loadUserProjectsList() {
  try {
    document.getElementById('projectsSection').style.display = 'block';
    document.getElementById('portalDashboard').style.display = 'none';

    const titleHeader = document.getElementById('projectsTitleHeader');
    const subtitleHeader = document.getElementById('projectsSubtitleHeader');
    if (titleHeader) titleHeader.innerHTML = 'My <em>Projects</em>';
    if (subtitleHeader) subtitleHeader.textContent = 'Select a project card to launch its Project Builder, view the Proposed Project, and inspect the Agreed Project, or create a new project.';

    const createBtn = document.getElementById('createProjectHeaderBtn');
    if (createBtn) createBtn.style.display = 'inline-flex';

    let { data: projects, error } = await db
      .from('ds_projects')
      .select('*')
      .eq('client_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
    }

    userProjects = projects || [];

    // Hydrate project_type for user projects via background spec check
    const pIds = userProjects.map(p => p.id);
    if (pIds.length > 0) {
      try {
        const { data: specData } = await db
          .from('ds_questionnaire_specs')
          .select('project_id, question_key')
          .in('project_id', pIds);

        if (specData && specData.length > 0) {
          const appProjIds = new Set(
            specData
              .filter(s => APP_QUESTIONS.some(aq => aq.key === s.question_key))
              .map(s => s.project_id)
          );
          userProjects.forEach(p => {
            if (appProjIds.has(p.id)) {
              p.project_type = 'application';
              localStorage.setItem(`ds_proj_type_${p.id}`, 'application');
            } else if (!p.project_type) {
              p.project_type = localStorage.getItem(`ds_proj_type_${p.id}`) || 'website';
            }
          });
        }
      } catch (checkErr) {
        console.warn("Spec key detection check fallback:", checkErr.message);
      }
    }

    userProjects.forEach(p => {
      if (!p.project_type) {
        p.project_type = localStorage.getItem(`ds_proj_type_${p.id}`) || 'website';
      }
    });

    // If client has no projects yet, auto-create a default project
    if (userProjects.length === 0) {
      const defaultName = (currentProfile.company_name ? currentProfile.company_name + ' Website' : 'My Website Project');
      const { data: newProj, error: createErr } = await db
        .from('ds_projects')
        .insert([{
          client_id: currentUser.id,
          project_name: defaultName,
          status: 'questionnaire_in_progress',
          total_quote: 0
        }])
        .select()
        .single();

      if (!createErr && newProj) {
        userProjects = [newProj];
      }
    }

    renderProjectCards();
  } catch (err) {
    console.error("Error in loadUserProjectsList:", err);
  }
}

function renderProjectCards() {
  const gridEl = document.getElementById('projectsGrid');
  if (!gridEl) return;

  let html = `
    <div class="create-project-card-item" id="createProjectCardBtn">
      <div class="create-project-icon">+</div>
      <strong style="color:var(--text-main); font-size:1.05rem;">Create New Project</strong>
      <span style="font-size:0.82rem; color:var(--text-muted); margin-top:4px;">Start a new website or app spec</span>
    </div>
  `;

  if (userProjects.length > 0) {
    html += userProjects.map(p => {
      const createdDate = p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const quoteVal = parseFloat(p.total_quote || 0).toFixed(2);
      const statusObj = formatProjectStatus(p.status);
      const pType = resolveProjectType(p);
      const isApp = pType === 'application';

      return `
        <div class="project-card-item" onclick="openUserProject('${p.id}')">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <div class="project-card-title" style="margin-bottom:0;">${escapeHtml(p.project_name || 'Untitled Project')}</div>
              <span style="font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:600; background:rgba(255,255,255,0.06); color:${(isApp ? 'var(--coral-accent)' : 'var(--text-muted)')}; font-family:'DM Sans', sans-serif;">
                ${isApp ? '📱 Application' : '🌐 Website'}
              </span>
            </div>
            <span class="spec-tag ${statusObj.tagClass}">${statusObj.text}</span>
            <div class="project-card-quote">$${quoteVal}</div>
          </div>
          <div class="project-card-meta">
            <span>Created: ${createdDate}</span>
            <span style="color:var(--coral-accent); font-weight:600;">Open Workspace →</span>
          </div>
        </div>
      `;
    }).join('');
  }

  gridEl.innerHTML = html;

  const cardBtn = document.getElementById('createProjectCardBtn');
  if (cardBtn) {
    cardBtn.addEventListener('click', () => {
      toggleCreateProjectForm(true);
    });
  }
}

function formatProjectStatus(status) {
  switch (status) {
    case 'specs_agreed':
      return { text: 'Specs Agreed', tagClass: 'agreed' };
    case 'questionnaire_in_progress':
      return { text: 'In Progress', tagClass: 'pending' };
    default:
      return { text: 'Active', tagClass: 'pending' };
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function toggleCreateProjectForm(show) {
  const formCard = document.getElementById('newProjectCard');
  if (!formCard) return;
  formCard.style.display = show ? 'block' : 'none';
  if (show) {
    const input = document.getElementById('newProjectTitleInput');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

async function handleCreateProjectSubmit(e) {
  e.preventDefault();
  const titleInput = document.getElementById('newProjectTitleInput');
  const title = titleInput ? titleInput.value.trim() : '';
  if (!title) return;

  const typeEl = document.querySelector('input[name="projectTypeChoice"]:checked');
  const projectType = typeEl ? typeEl.value : 'website';

  try {
    let newProj = null;
    const res = await db
      .from('ds_projects')
      .insert([{
        client_id: currentUser.id,
        project_name: title,
        project_type: projectType,
        status: 'questionnaire_in_progress',
        total_quote: 0
      }])
      .select();

    if (res.data && res.data.length > 0) {
      newProj = res.data[0];
    } else {
      const fallbackRes = await db
        .from('ds_projects')
        .insert([{
          client_id: currentUser.id,
          project_name: title,
          status: 'questionnaire_in_progress',
          total_quote: 0
        }])
        .select();

      if (fallbackRes.data && fallbackRes.data.length > 0) {
        newProj = fallbackRes.data[0];
      } else if (fallbackRes.error) {
        throw fallbackRes.error;
      }
    }

    if (newProj) {
      newProj.project_type = projectType;
      localStorage.setItem(`ds_proj_type_${newProj.id}`, projectType);

      const initialQuestions = projectType === 'application' ? APP_QUESTIONS : WEBSITE_QUESTIONS;
      const firstQ = initialQuestions[0];
      try {
        await db.from('ds_questionnaire_specs').insert([{
          project_id: newProj.id,
          question_key: firstQ.key,
          question_text: firstQ.title,
          spec_tag: firstQ.tag,
          client_answer: ''
        }]);
      } catch (specErr) {
        console.warn("Could not seed first spec:", specErr.message);
      }

      if (userProjects) {
        userProjects.unshift(newProj);
      }
    }

    toggleCreateProjectForm(false);
    showToastOverlay('✓ Project Created!');

    await openUserProject(newProj.id);
  } catch (err) {
    console.error("Error creating project:", err);
    alert("Could not create project. Please try again.");
  }
}

async function openUserProject(projectId) {
  try {
    let proj = userProjects.find(p => p.id === projectId);
    if (!proj) {
      const { data } = await db.from('ds_projects').select('*').eq('id', projectId).single();
      proj = data;
    }

    if (proj) {
      if (!proj.project_type) {
        proj.project_type = localStorage.getItem(`ds_proj_type_${proj.id}`);
      }
      currentProject = proj;
      const questions = getQuestionsForProject(currentProject);
      const isApp = (questions === APP_QUESTIONS);
      if (!currentProject.project_type) {
        currentProject.project_type = isApp ? 'application' : 'website';
      }

      const titleEl = document.getElementById('activeProjectTitle');
      if (titleEl) {
        const typeBadge = isApp ? '📱 Application' : '🌐 Website';
        titleEl.innerHTML = `${escapeHtml(currentProject.project_name || 'Project Workspace')} <span style="font-size:0.8rem; padding:2px 8px; border-radius:12px; font-weight:600; background:rgba(255,255,255,0.08); color:var(--text-muted); margin-left:6px;">${typeBadge}</span>`;
      }

      const specsContainer = document.getElementById('specsReviewList');
      if (specsContainer) {
        specsContainer.innerHTML = `
          <div style="padding:40px 20px; text-align:center; color:var(--text-muted);">
            <div style="font-size:1.8rem; margin-bottom:10px;">⏳</div>
            <strong style="display:block; color:var(--text-main); font-size:1.05rem;">Loading Workspace Specifications...</strong>
            <span style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">Retrieving answers, files, and discussion threads...</span>
          </div>
        `;
      }

      document.getElementById('projectsSection').style.display = 'none';
      document.getElementById('portalDashboard').style.display = 'block';

      await loadProjectSpecs();
    }
  } catch (err) {
    console.error("Error opening project:", err);
  }
}

async function loadAdminClientList() {
  try {
    const { data: projects, error } = await db
      .from('ds_projects')
      .select('*, ds_profiles(full_name, company_name, email)')
      .order('created_at', { ascending: false });

    adminAllClients = projects || [];
    const selectEl = document.getElementById('adminClientSelect');

    if (!adminAllClients || adminAllClients.length === 0) {
      selectEl.innerHTML = '<option value="">No client projects submitted yet</option>';
    } else {
      selectEl.innerHTML = adminAllClients.map(p => {
        const clientName = p.ds_profiles ? (p.ds_profiles.company_name || p.ds_profiles.full_name || p.ds_profiles.email) : 'Client Project';
        return `<option value="${p.id}">${clientName} — ${p.project_name} ($${parseFloat(p.total_quote || 0).toFixed(2)})</option>`;
      }).join('');
    }

    // Update Headers for Admin Mode
    const titleHeader = document.getElementById('projectsTitleHeader');
    const subtitleHeader = document.getElementById('projectsSubtitleHeader');
    if (titleHeader) titleHeader.innerHTML = 'All Client <em>Projects</em>';
    if (subtitleHeader) subtitleHeader.textContent = 'Select any client project card below or use the top dropdown to review & edit specs.';

    const createBtn = document.getElementById('createProjectHeaderBtn');
    if (createBtn) createBtn.style.display = 'none';

    // Show projects cards section by default for admin
    document.getElementById('projectsSection').style.display = 'block';
    document.getElementById('portalDashboard').style.display = 'none';

    renderAdminProjectCards();
  } catch (err) {
    console.error("Error loading admin client list:", err);
  }
}

function renderAdminProjectCards() {
  const gridEl = document.getElementById('projectsGrid');
  if (!gridEl) return;

  if (adminAllClients.length === 0) {
    gridEl.innerHTML = '<p style="color:var(--text-muted);">No client projects found.</p>';
    return;
  }

  gridEl.innerHTML = adminAllClients.map(p => {
    const clientName = p.ds_profiles ? (p.ds_profiles.company_name || p.ds_profiles.full_name || p.ds_profiles.email) : 'Client Project';
    const createdDate = p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const quoteVal = parseFloat(p.total_quote || 0).toFixed(2);
    const statusObj = formatProjectStatus(p.status);
    const pType = resolveProjectType(p);
    const isApp = pType === 'application';

    return `
      <div class="project-card-item" onclick="selectAdminProject('${p.id}')">
        <div>
          <span class="project-card-client">✦ ${escapeHtml(clientName)}</span>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div class="project-card-title" style="margin-bottom:0;">${escapeHtml(p.project_name || 'Untitled Project')}</div>
            <span style="font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:600; background:rgba(255,255,255,0.06); color:${(isApp ? 'var(--coral-accent)' : 'var(--text-muted)')}; font-family:'DM Sans', sans-serif;">
              ${isApp ? '📱 Application' : '🌐 Website'}
            </span>
          </div>
          <span class="spec-tag ${statusObj.tagClass}">${statusObj.text}</span>
          <div class="project-card-quote">$${quoteVal}</div>
        </div>
        <div class="project-card-meta">
          <span>Created: ${createdDate}</span>
          <span style="color:var(--coral-accent); font-weight:600;">Review Project →</span>
        </div>
      </div>
    `;
  }).join('');
}

async function selectAdminProject(projectId) {
  const selectEl = document.getElementById('adminClientSelect');
  if (selectEl) {
    selectEl.value = projectId;
  }
  await loadProjectById(projectId);
}

async function loadProjectById(projectId) {
  let proj = adminAllClients.find(p => p.id === projectId);
  if (!proj) {
    const { data } = await db.from('ds_projects').select('*').eq('id', projectId).single();
    proj = data;
  }

  if (proj) {
    currentProject = proj;
    const titleEl = document.getElementById('activeProjectTitle');
    if (titleEl) {
      titleEl.textContent = currentProject.project_name || 'Project Workspace';
    }

    const selectEl = document.getElementById('adminClientSelect');
    if (selectEl && selectEl.value !== projectId) {
      selectEl.value = projectId;
    }

    // Switch screen view to project workspace
    document.getElementById('projectsSection').style.display = 'none';
    document.getElementById('portalDashboard').style.display = 'block';

    await loadProjectSpecs();
  }
}

async function loadProjectSpecs() {
  if (!currentProject) return;

  const { data: specs } = await db
    .from('ds_questionnaire_specs')
    .select('*')
    .eq('project_id', currentProject.id);

  currentSpecs = specs || [];

  const activeQuestions = getQuestionsForProject(currentProject);
  // STABLE SORT: Order specs strictly matching activeQuestions sequence
  currentSpecs.sort((a, b) => {
    const idxA = activeQuestions.findIndex(q => q.key === a.question_key);
    const idxB = activeQuestions.findIndex(q => q.key === b.question_key);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  await renderQuestionnaireSpecs();
  renderJobPlan();
  renderProjectOverview();
}

let openQuestionKeys = new Set([DEFAULT_QUESTIONS[0].key]);

window.toggleQuestionAccordion = function(qKey) {
  const block = document.getElementById(`specCard_${qKey}`);
  if (!block) return;

  if (openSpecIds.has(qKey)) {
    openSpecIds.delete(qKey);
    block.classList.remove('open');
  } else {
    openSpecIds.add(qKey);
    block.classList.add('open');
  }
};

window.toggleSpecAccordion = function(key) {
  const card = document.getElementById(`specCard_${key}`);
  if (!card) return;

  if (openSpecIds.has(key)) {
    openSpecIds.delete(key);
    card.classList.remove('open');
  } else {
    openSpecIds.add(key);
    card.classList.add('open');
  }
};

let projectSpecFilesMap = {};

// High-Capacity IndexedDB File Storage Engine
function openFileIndexedDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) return resolve(null);
    const req = window.indexedDB.open('DreamSitesFilesDB', 1);
    req.onupgradeneeded = function(e) {
      const dbInstance = e.target.result;
      if (!dbInstance.objectStoreNames.contains('files')) {
        dbInstance.createObjectStore('files', { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

async function saveIndexedDBFile(fileObj) {
  try {
    const idb = await openFileIndexedDB();
    if (!idb) return;
    const tx = idb.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    store.put(fileObj);
  } catch (e) {
    console.warn("IndexedDB save error:", e);
  }
}

async function getIndexedDBFiles(projectId) {
  try {
    const idb = await openFileIndexedDB();
    if (!idb) return [];
    return new Promise((resolve) => {
      const tx = idb.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        resolve(all.filter(f => f.project_id === projectId));
      };
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

async function deleteIndexedDBFile(fileId) {
  try {
    const idb = await openFileIndexedDB();
    if (!idb) return;
    const tx = idb.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    store.delete(fileId);
  } catch (e) {}
}

function getLocalProjectFiles() {
  if (!currentProject) return [];
  try {
    const raw = localStorage.getItem('ds_files_' + currentProject.id);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalProjectFile(fileObj) {
  if (!currentProject) return;
  saveIndexedDBFile(fileObj);
  try {
    const files = getLocalProjectFiles();
    files.push(fileObj);
    localStorage.setItem('ds_files_' + currentProject.id, JSON.stringify(files));
  } catch (e) {
    console.warn("localStorage quota exceeded, preserved in IndexedDB:", e);
  }
}

function deleteLocalProjectFile(fileId) {
  if (!currentProject) return;
  deleteIndexedDBFile(fileId);
  try {
    const files = getLocalProjectFiles().filter(f => f.id !== fileId);
    localStorage.setItem('ds_files_' + currentProject.id, JSON.stringify(files));
  } catch (e) {}
}

async function loadSpecFilesForProject() {
  if (!currentProject) return;

  const localFiles = getLocalProjectFiles();
  const idbFiles = await getIndexedDBFiles(currentProject.id);
  let dbFiles = [];

  try {
    const { data } = await db
      .from('ds_spec_files')
      .select('*')
      .eq('project_id', currentProject.id);
    dbFiles = data || [];
  } catch (err) {
    console.warn("ds_spec_files table check:", err.message);
  }

  // FAIL-SAFE CHAT MESSAGES PARSER: Recover uploaded files directly from ds_spec_messages
  let recoveredChatFiles = [];
  try {
    const specIds = currentSpecs.map(s => s.id);
    if (specIds.length > 0) {
      const { data: msgs } = await db
        .from('ds_spec_messages')
        .select('*')
        .in('spec_id', specIds);

      (msgs || []).forEach(m => {
        if (m.message_text && m.message_text.includes('uploaded file:')) {
          const specObj = currentSpecs.find(s => s.id === m.spec_id);
          const qKey = specObj ? specObj.question_key : null;

          const hrefMatch = m.message_text.match(/href="([^"]+)"/);
          const downloadMatch = m.message_text.match(/download="([^"]+)"/);
          const textMatch = m.message_text.match(/⬇ Download ([^\(]+)\s*\(([^\)]+)\)/);

          if (hrefMatch && hrefMatch[1] && downloadMatch && downloadMatch[1]) {
            const dataUrl = hrefMatch[1];
            const fileName = downloadMatch[1];
            const metaStr = textMatch ? textMatch[2] : '';
            const sizeStr = metaStr.split('•')[0] ? metaStr.split('•')[0].trim() : 'Asset';
            const dimStr = metaStr.split('•')[1] ? metaStr.split('•')[1].trim() : null;

            recoveredChatFiles.push({
              id: 'chat_file_' + m.id,
              project_id: currentProject.id,
              spec_id: m.spec_id,
              question_key: qKey,
              file_name: fileName,
              file_size: sizeStr,
              file_dimensions: dimStr,
              file_type: fileName.toLowerCase().endsWith('.png') ? 'image/png' : (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/*'),
              file_data: dataUrl,
              uploaded_by_role: m.sender_role,
              created_at: m.created_at
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn("Chat file recovery check:", err.message);
  }

  // Merge localFiles, idbFiles, dbFiles, and recoveredChatFiles by unique key
  const mapById = new Map();
  localFiles.forEach(f => mapById.set(f.file_data ? f.file_data.substr(0, 100) + '_' + f.file_name : f.id, f));
  idbFiles.forEach(f => mapById.set(f.file_data ? f.file_data.substr(0, 100) + '_' + f.file_name : f.id, f));
  dbFiles.forEach(f => mapById.set(f.file_data ? f.file_data.substr(0, 100) + '_' + f.file_name : f.id, f));
  recoveredChatFiles.forEach(f => mapById.set(f.file_data ? f.file_data.substr(0, 100) + '_' + f.file_name : f.id, f));

  const mergedFiles = Array.from(mapById.values());

  projectSpecFilesMap = {};
  mergedFiles.forEach(f => {
    const key = f.question_key || f.spec_id;
    if (key) {
      if (!projectSpecFilesMap[key]) projectSpecFilesMap[key] = [];
      projectSpecFilesMap[key].push(f);
    }
  });
}

async function renderQuestionnaireSpecs() {
  const container = document.getElementById('specsReviewList');
  if (!container) return;

  await loadSpecFilesForProject();

  let totalQuote = 0;
  let html = '';

  const activeQuestions = getQuestionsForProject(currentProject);
  const isApp = (activeQuestions === APP_QUESTIONS);
  const qTitleEl = document.getElementById('questionnaireHeaderTitle');
  if (qTitleEl) {
    qTitleEl.innerHTML = isApp ? '📱 Application Specs & Architecture Builder' : '🌐 Website Design Specs & Builder';
  }

  // Collect any custom user/admin generated spec items in currentSpecs
  const customQuestionObjs = [];
  currentSpecs.forEach(s => {
    const isBuiltIn = activeQuestions.some(aq => aq.key === s.question_key);
    if (!isBuiltIn && s.question_key) {
      customQuestionObjs.push({
        key: s.question_key,
        title: s.question_text || 'Custom Spec Item',
        tag: s.spec_tag || '#Custom-Spec',
        desc: 'Custom line-item specification created for this project workspace.'
      });
    }
  });

  const displayQuestions = [...activeQuestions, ...customQuestionObjs];

  // BATCH QUERY: Fetch all discussion messages for active specs in 1 single network request
  const allSpecIds = currentSpecs.map(s => s.id).filter(Boolean);
  const specMessagesMap = {};
  if (allSpecIds.length > 0) {
    try {
      const { data: allMsgs } = await db
        .from('ds_spec_messages')
        .select('*')
        .in('spec_id', allSpecIds)
        .order('created_at', { ascending: true });

      if (allMsgs) {
        allMsgs.forEach(m => {
          if (!specMessagesMap[m.spec_id]) specMessagesMap[m.spec_id] = [];
          specMessagesMap[m.spec_id].push(m);
        });
      }
    } catch (msgErr) {
      console.warn("Batch spec message fetch error:", msgErr.message);
    }
  }

  for (const q of displayQuestions) {
    const spec = currentSpecs.find(s => s.question_key === q.key);
    const specId = spec ? spec.id : null;
    const cost = spec ? parseFloat(spec.line_item_cost || 0) : 0;
    totalQuote += cost;

    const isAgreed = spec ? (spec.client_agreed && spec.designer_agreed) : false;
    const statusClass = isAgreed ? 'agreed' : 'pending';
    const isAnswered = spec && spec.client_answer && spec.client_answer.trim().length > 0;
    const statusText = isAgreed ? '✓ Agreed' : (isAnswered ? (spec.client_agreed || spec.designer_agreed ? 'Pending Sign-off' : 'Under Review') : 'Pending Answer');

    const accordionKey = specId || q.key;
    const isOpen = openSpecIds.has(accordionKey) || openSpecIds.has(q.key);

    // Look up messages instantly from batched specMessagesMap
    const msgs = specId ? (specMessagesMap[specId] || []) : [];

    // Determine attached files for this spec question
    const specFiles = (projectSpecFilesMap[q.key] || []).concat(specId ? (projectSpecFilesMap[specId] || []) : []);
    
    // Deduplicate specFiles by id
    const uniqueSpecFilesMap = new Map();
    specFiles.forEach(f => uniqueSpecFilesMap.set(f.id, f));
    const uniqueSpecFiles = Array.from(uniqueSpecFilesMap.values());

    // Determine latest answer version count
    const versionSaveMsgs = msgs.filter(m => m.message_text && m.message_text.includes('saved answer version'));
    const currentVersionNum = versionSaveMsgs.length > 0 
      ? versionSaveMsgs.length 
      : (isAnswered ? 1 : 0);

    html += `
      <div class="spec-item-card ${statusClass} ${isOpen ? 'open' : ''}" id="specCard_${accordionKey}">
        <!-- Collapsible Header -->
        <div class="spec-item-header" onclick="toggleSpecAccordion('${accordionKey}')">
          <div class="spec-header-left">
            <span class="spec-accordion-chevron">▼</span>
            <span class="spec-badge">${q.tag}</span>
            <h4 style="margin:0; font-size:1rem; font-weight:600;">${q.title}</h4>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <b style="font-size:1.15rem; color:var(--coral-accent);">$${cost.toFixed(2)}</b>
          </div>
        </div>

        <!-- Collapsible Body -->
        <div class="spec-body">
          <p class="question-desc" style="margin-bottom:12px;">${q.desc}</p>

          <!-- Main Answer Input & Versioning -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--card-border); padding: 16px; border-radius: 10px; margin-bottom: 16px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px;">
              <small style="color:var(--coral-accent); font-weight:700; text-transform:uppercase; font-size:0.75rem;">
                Main Specification Answer ${currentVersionNum > 0 ? `(Current Version ${currentVersionNum})` : '(Version 1 Draft)'}
              </small>
              <span id="ansSaveFeedback_${q.key}" style="font-size:0.82rem;"></span>
            </div>
            <textarea class="form-control" id="ansInput_${q.key}" rows="3" placeholder="Type or update main answer here...">${spec ? (spec.client_answer || '') : ''}</textarea>
            <div style="margin-top:10px; display:flex; justify-content:flex-end;">
              <button class="btn-portal" onclick="saveSpecAnswerVersion('${q.key}', '${specId || ''}')" style="padding:8px 18px; font-size:0.88rem;">
                💾 Save Answer ${currentVersionNum > 0 ? `Version ${currentVersionNum + 1}` : 'Version 1'} ↗
              </button>
            </div>
          </div>

          <!-- Attached Brand Assets & File Upload Dropzone -->
          <div style="margin-bottom:16px; background: rgba(0,0,0,0.2); padding: 14px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <small style="color:var(--text-muted); font-weight:700; text-transform:uppercase; font-size:0.75rem;">
                📎 Attached Brand Assets & Files (${uniqueSpecFiles.length})
              </small>
              <span id="fileUploadStatus_${q.key}" style="font-size:0.8rem;"></span>
            </div>

            <div class="attached-files-container">
              ${uniqueSpecFiles.map(f => {
                const isImg = f.file_type && f.file_type.startsWith('image/');
                const icon = isImg ? '🖼️' : (f.file_type && f.file_type.includes('pdf') ? '📄' : '📦');
                return `
                  <div class="attached-file-chip">
                    ${isImg && f.file_data 
                      ? `<img src="${f.file_data}" class="file-thumb-preview" alt="preview" onclick="openImageLightbox('${f.file_data}', '${escapeHtml(f.file_name)}', '${f.file_size || ''}', '${f.file_type || ''}', '${f.file_dimensions || ''}')" title="Click to enlarge image">` 
                      : `<div class="file-thumb-fallback">${icon}</div>`
                    }
                    <div class="asset-card-actions">
                      <span class="asset-action-link" onclick="openImageLightbox('${f.file_data}', '${escapeHtml(f.file_name)}', '${f.file_size || ''}', '${f.file_type || ''}', '${f.file_dimensions || ''}')">View</span>
                      <a href="${f.file_data || '#'}" download="${escapeHtml(f.file_name)}" class="asset-action-link" target="_blank">Download</a>
                    </div>
                    <button class="file-delete-btn" onclick="deleteSpecFile('${f.id}', '${q.key}')" title="Delete file">✕</button>
                  </div>
                `;
              }).join('')}
            </div>

            <input type="file" id="fileInput_${q.key}" multiple style="display:none;" onchange="handleSpecFileInputChange(event, '${q.key}', '${specId || ''}')">
            
            <div class="file-dropzone" id="dropzone_${q.key}" 
                 onclick="document.getElementById('fileInput_${q.key}').click()" 
                 ondragover="event.preventDefault(); this.classList.add('dragover');" 
                 ondragleave="this.classList.remove('dragover');" 
                 ondrop="handleSpecFileDrop(event, '${q.key}', '${specId || ''}')">
              <div class="dropzone-title">📁 Drag & Drop Brand Assets or Click to Upload (Multiple Files Supported)</div>
              <div class="dropzone-sub">Logos, High-res Images, PDFs, Brand Guidelines, Docs (PNG, JPG, PDF, ZIP)</div>
            </div>
          </div>

          ${isDesignerMode && specId ? `
            <div style="background: rgba(255,107,82,0.06); border: 1px solid rgba(255,107,82,0.2); padding: 16px; border-radius: 10px; margin-bottom: 16px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px;">
                <h5 style="color:var(--coral-accent); font-size:0.88rem; margin:0;">✦ DESIGNER PRICING & SCOPE:</h5>
                <span id="saveFeedback_${specId}"></span>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 140px; gap:12px; margin-bottom:10px;">
                <div>
                  <label style="font-size:0.75rem; color:var(--text-muted);">Scope Notes / What this entails:</label>
                  <input type="text" class="form-control" id="scopeNote_${specId}" value="${spec.designer_scope_notes || ''}" placeholder="e.g. Custom schema, 3 API endpoints, UI design.">
                </div>
                <div>
                  <label style="font-size:0.75rem; color:var(--text-muted);">Line Cost ($):</label>
                  <input type="number" step="10" class="form-control" id="cost_${specId}" value="${cost.toFixed(2)}">
                </div>
              </div>
              <button class="btn-portal" onclick="saveDesignerSpecUpdate('${specId}')">Save Price & Scope Notes</button>
            </div>
          ` : `
            ${spec && spec.designer_scope_notes ? `
              <div style="background: rgba(255,107,82,0.05); border-left: 3px solid var(--coral-accent); padding: 12px; border-radius: 4px; margin-bottom: 14px;">
                <small style="color:var(--coral-accent); font-weight:700;">Designer Scope Notes:</small>
                <p style="margin-top:2px; font-size:0.9rem;">${spec.designer_scope_notes}</p>
              </div>
            ` : ''}
          `}

          <!-- Interactive Spec Q&A & Dialogue Thread -->
          <div class="qa-thread">
            <div class="qa-title">💬 Interactive Discussion & Dialogue Thread:</div>
            <div id="msgContainer_${accordionKey}">
              ${(msgs && msgs.length > 0) ? msgs.map(m => {
                const isVersionSave = m.message_text && m.message_text.includes('has saved answer version');
                const isFileUpload = m.message_text && m.message_text.includes('uploaded file:');
                if (isVersionSave) {
                  return `
                    <div class="message-bubble version-save">
                      <span class="msg-sender" style="color:#2ecc71;">
                        📌 ${escapeHtml(m.sender_role === 'designer' ? '✦ Admin / Designer' : '👤 Client')} 
                        <span class="version-badge-tag">Answer Update</span>
                      </span>
                      <div style="white-space: pre-wrap; font-weight:500; margin-top:4px;">${escapeHtml(m.message_text)}</div>
                      <span class="msg-time">${new Date(m.created_at).toLocaleString([], {month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  `;
                }
                if (isFileUpload) {
                  return `
                    <div class="message-bubble ${m.sender_role}" style="border: 1px solid rgba(255, 107, 82, 0.3); background: rgba(255, 107, 82, 0.08);">
                      <span class="msg-sender ${m.sender_role === 'designer' ? 'designer-name' : ''}">
                        ${m.sender_role === 'designer' ? '✦ Designer/Developer' : '👤 Client'}
                      </span>
                      <div style="margin-top:4px; font-size:0.92rem;">${m.message_text}</div>
                      <span class="msg-time">${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  `;
                }
                return `
                  <div class="message-bubble ${m.sender_role}">
                    <span class="msg-sender ${m.sender_role === 'designer' ? 'designer-name' : ''}">
                      ${m.sender_role === 'designer' ? '✦ Designer/Developer' : '👤 Client'}
                    </span>
                    <div>${escapeHtml(m.message_text)}</div>
                    <span class="msg-time">${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                `;
              }).join('') : '<p style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">No notes or follow-up questions posted yet.</p>'}
            </div>

            ${specId ? `
              <div class="qa-input-row" style="margin-top:10px;">
                <input type="text" class="form-control" id="msgInput_${specId}" placeholder="Ask a question or comment on this spec..." onkeydown="if(event.key==='Enter') sendSpecMessage('${specId}')">
                <button class="btn-portal" onclick="sendSpecMessage('${specId}')">Send</button>
              </div>
            ` : `
              <p style="font-size:0.82rem; color:var(--text-muted); margin-top:8px;">Save an answer above to activate discussion thread on this specification.</p>
            `}
          </div>

          ${specId ? `
            <!-- Spec Agreement Button -->
            <div style="margin-top:16px; display:flex; align-items:center; justify-content:space-between; border-top:1px solid var(--card-border); padding-top:14px;">
              <span style="font-size:0.85rem; color:var(--text-muted);">
                Client Sign-off: <strong>${spec.client_agreed ? '✓ Yes' : 'Pending'}</strong> | 
                Designer Sign-off: <strong>${spec.designer_agreed ? '✓ Yes' : 'Pending'}</strong>
              </span>
              <button class="btn-portal-outline" onclick="toggleSpecSignOff('${specId}', ${isDesignerMode ? "'designer'" : "'client'"})">
                ${(isDesignerMode ? spec.designer_agreed : spec.client_agreed) ? '✓ Spec Agreed' : 'Agree to Spec'}
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  const totalQuoteEl = document.getElementById('totalQuoteVal');
  if (totalQuoteEl) totalQuoteEl.textContent = `$${totalQuote.toFixed(2)}`;

  if (currentProject) {
    await db.from('ds_projects').update({ total_quote: totalQuote }).eq('id', currentProject.id);
  }
}

// File Upload Handlers
window.handleSpecFileInputChange = async function(e, qKey, specId) {
  const files = e.target.files ? Array.from(e.target.files) : [];
  for (const file of files) {
    await processSpecFileUpload(file, qKey, specId);
  }
};

window.handleSpecFileDrop = async function(e, qKey, specId) {
  e.preventDefault();
  const dropzone = document.getElementById(`dropzone_${qKey}`);
  if (dropzone) dropzone.classList.remove('dragover');

  const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
  for (const file of files) {
    await processSpecFileUpload(file, qKey, specId);
  }
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(`${img.naturalWidth}×${img.naturalHeight} px`);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

async function processSpecFileUpload(file, qKey, specId) {
  if (!currentProject) return;

  const statusEl = document.getElementById(`fileUploadStatus_${qKey}`);
  if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-muted);">Uploading file...</span>';

  try {
    const sizeStr = formatBytes(file.size);
    const reader = new FileReader();

    reader.onload = async function(e) {
      const dataUrl = e.target.result;
      const role = isDesignerMode ? 'designer' : 'client';
      const senderName = isDesignerMode ? '✦ Admin' : '👤 Client';

      let dimensions = null;
      if (file.type && file.type.startsWith('image/')) {
        dimensions = await getImageDimensions(dataUrl);
      }

      let activeSpecId = specId && specId !== 'null' && specId !== 'undefined' ? specId : null;
      let existingSpec = currentSpecs.find(s => s.question_key === qKey);

      if (!existingSpec && !activeSpecId) {
        const activeQuestions = getQuestionsForProject(currentProject);
        const qObj = activeQuestions.find(q => q.key === qKey);
        const { data: ins } = await db.from('ds_questionnaire_specs').insert([{
          project_id: currentProject.id,
          question_key: qKey,
          question_text: qObj ? qObj.title : qKey,
          spec_tag: qObj ? qObj.tag : '#Spec',
          client_answer: ''
        }]).select();
        if (ins && ins[0]) activeSpecId = ins[0].id;
      } else if (existingSpec) {
        activeSpecId = existingSpec.id;
      }

      const fileObj = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        project_id: currentProject.id,
        spec_id: activeSpecId,
        question_key: qKey,
        file_name: file.name,
        file_size: sizeStr,
        file_dimensions: dimensions,
        file_type: file.type || 'application/octet-stream',
        file_data: dataUrl,
        uploaded_by_role: role,
        created_at: new Date()
      };

      saveLocalProjectFile(fileObj);

      try {
        await db.from('ds_spec_files').insert([fileObj]);
      } catch (err) {
        console.warn("Database storage fallback for ds_spec_files:", err.message);
      }

      if (!projectSpecFilesMap[qKey]) projectSpecFilesMap[qKey] = [];
      projectSpecFilesMap[qKey].push(fileObj);

      // Insert log entry in chat thread with interactive download link
      if (activeSpecId) {
        const dimLabel = dimensions ? ` • ${dimensions}` : '';
        const chatLinkMsg = `📎 ${senderName} uploaded file: <a href="${dataUrl}" download="${escapeHtml(file.name)}" target="_blank" style="color:var(--coral-accent); font-weight:700; text-decoration:underline;">⬇ Download ${escapeHtml(file.name)} (${sizeStr}${dimLabel})</a>`;
        await db.from('ds_spec_messages').insert([{
          spec_id: activeSpecId,
          sender_id: currentUser ? currentUser.id : 'anon',
          sender_role: role,
          message_text: chatLinkMsg
        }]);
      }

      openSpecIds.add(activeSpecId || qKey);
      openSpecIds.add(qKey);

      showToastOverlay(`✓ File "${file.name}" Uploaded!`);
      await loadProjectSpecs();
    };

    reader.readAsDataURL(file);
  } catch (err) {
    console.error("Error uploading file:", err);
    if (statusEl) statusEl.innerHTML = `<span style="color:#ff8a80;">Error: ${err.message}</span>`;
  }
}

// Lightbox Modal Handlers
window.openImageLightbox = function(src, name, size, type, dim) {
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('lightboxImg');
  const title = document.getElementById('lightboxTitle');
  const meta = document.getElementById('lightboxMeta');
  const dlBtn = document.getElementById('lightboxDownloadBtn');

  if (!modal || !img) return;

  img.src = src;
  if (title) title.textContent = name || 'Image Preview';
  if (dlBtn) {
    dlBtn.href = src;
    dlBtn.download = name || 'image';
  }

  // Determine user-friendly file format
  let typeLabel = 'Image';
  if (type) {
    if (type.includes('png')) typeLabel = 'PNG Image';
    else if (type.includes('jpeg') || type.includes('jpg')) typeLabel = 'JPEG Image';
    else if (type.includes('svg')) typeLabel = 'SVG Vector';
    else if (type.includes('webp')) typeLabel = 'WebP Image';
    else if (type.includes('gif')) typeLabel = 'GIF Image';
    else typeLabel = type.split('/')[1] ? type.split('/')[1].toUpperCase() : 'Image';
  } else if (name && name.includes('.')) {
    typeLabel = name.split('.').pop().toUpperCase() + ' File';
  }

  const updateMetaDisplay = (dimensionsStr) => {
    let parts = [];
    if (dimensionsStr) parts.push(`<b>Dimensions:</b> ${dimensionsStr}`);
    if (size) parts.push(`<b>Size:</b> ${size}`);
    if (typeLabel) parts.push(`<b>Type:</b> ${typeLabel}`);
    if (meta) meta.innerHTML = parts.join(' &nbsp;|&nbsp; ');
  };

  updateMetaDisplay(dim);

  // Dynamic on-the-fly dimension detection when image loads
  img.onload = function() {
    if (img.naturalWidth && img.naturalHeight) {
      const calcDim = `${img.naturalWidth} × ${img.naturalHeight} px`;
      updateMetaDisplay(calcDim);
    }
  };

  modal.classList.add('active');
};

window.closeImageLightbox = function(e) {
  if (e) e.stopPropagation();
  const modal = document.getElementById('imageLightboxModal');
  if (modal) modal.classList.remove('active');
};

window.deleteSpecFile = async function(fileId, qKey) {
  if (!confirm("Are you sure you want to remove this attached file?")) return;

  deleteLocalProjectFile(fileId);

  try {
    await db.from('ds_spec_files').delete().eq('id', fileId);
  } catch (err) {
    console.warn("Delete file fallback:", err.message);
  }

  if (projectSpecFilesMap[qKey]) {
    projectSpecFilesMap[qKey] = projectSpecFilesMap[qKey].filter(f => f.id !== fileId);
  }

  showToastOverlay("✓ File Attachment Removed");
  await loadProjectSpecs();
};

window.saveSpecAnswerVersion = async function(qKey, specId) {
  if (!currentProject) return;

  const inputEl = document.getElementById(`ansInput_${qKey}`);
  const feedbackEl = document.getElementById(`ansSaveFeedback_${qKey}`);
  if (!inputEl) return;

  const newAnswerText = inputEl.value.trim();
  const activeQuestions = getQuestionsForProject(currentProject);
  const qObj = activeQuestions.find(q => q.key === qKey);

  try {
    if (feedbackEl) feedbackEl.innerHTML = '<span style="color:var(--text-muted);">Saving version...</span>';

    let activeSpecId = specId && specId !== 'null' && specId !== 'undefined' ? specId : null;
    let existingSpec = currentSpecs.find(s => s.question_key === qKey);

    const changeRole = isDesignerMode ? 'Developer' : ((currentProfile && currentProfile.full_name) || 'Client');
    const updatePayload = {
      client_answer: newAnswerText,
      change_requested_by: changeRole,
      client_agreed: !isDesignerMode,
      designer_agreed: isDesignerMode,
      updated_at: new Date()
    };

    if (existingSpec && existingSpec.id) {
      activeSpecId = existingSpec.id;
      await db.from('ds_questionnaire_specs').update(updatePayload).eq('id', activeSpecId);
    } else {
      const { data: inserted, error: insErr } = await db.from('ds_questionnaire_specs').insert([{
        project_id: currentProject.id,
        question_key: qKey,
        question_text: qObj ? qObj.title : qKey,
        spec_tag: qObj ? qObj.tag : '#Spec',
        client_answer: newAnswerText,
        change_requested_by: changeRole,
        client_agreed: !isDesignerMode,
        designer_agreed: isDesignerMode
      }]).select();

      if (insErr) throw insErr;
      if (inserted && inserted[0]) {
        activeSpecId = inserted[0].id;
      }
    }

    // Determine version number from existing spec messages
    let versionNum = 1;
    if (activeSpecId) {
      const { data: msgs } = await db
        .from('ds_spec_messages')
        .select('*')
        .eq('spec_id', activeSpecId);

      const versionMsgs = (msgs || []).filter(m => m.message_text && m.message_text.includes('saved answer version'));
      versionNum = versionMsgs.length + 1;
    }

    const senderRole = isDesignerMode ? 'designer' : 'client';
    const senderName = isDesignerMode ? 'admin' : 'client';
    const versionSaveMessage = `${senderName} has saved answer version ${versionNum}:\n"${newAnswerText}"`;

    if (activeSpecId) {
      await db.from('ds_spec_messages').insert([{
        spec_id: activeSpecId,
        sender_id: currentUser ? currentUser.id : 'anon',
        sender_role: senderRole,
        message_text: versionSaveMessage
      }]);
    }

    openSpecIds.add(activeSpecId || qKey);
    openSpecIds.add(qKey);

    if (feedbackEl) {
      feedbackEl.innerHTML = `<span style="color:#2ecc71; font-weight:700;">✓ Saved Version ${versionNum}!</span>`;
      setTimeout(() => { feedbackEl.innerHTML = ''; }, 3000);
    }

    showToastOverlay(`✓ Answer Version ${versionNum} Saved!`);
    await loadProjectSpecs();
  } catch (err) {
    console.error("Error saving answer version:", err);
    if (feedbackEl) feedbackEl.innerHTML = `<span style="color:#ff8a80;">Error: ${err.message}</span>`;
  }
};

window.saveDesignerSpecUpdate = async function(specId) {
  const scopeNotesEl = document.getElementById(`scopeNote_${specId}`);
  const costEl = document.getElementById(`cost_${specId}`);
  const feedbackEl = document.getElementById(`saveFeedback_${specId}`);

  if (!scopeNotesEl || !costEl) return;

  const scopeNotes = scopeNotesEl.value;
  const cost = parseFloat(costEl.value || 0);

  try {
    if (feedbackEl) feedbackEl.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">Saving...</span>';

    const { error } = await db.from('ds_questionnaire_specs').update({
      designer_scope_notes: scopeNotes,
      line_item_cost: cost,
      updated_at: new Date()
    }).eq('id', specId);

    if (error) throw error;

    openSpecIds.add(specId);

    if (feedbackEl) {
      feedbackEl.innerHTML = `<span style="color:var(--green-accent); font-size:0.85rem; font-weight:700;">✓ Saved $${cost.toFixed(2)}!</span>`;
      setTimeout(() => { feedbackEl.innerHTML = ''; }, 3000);
    }

    showToastOverlay(`✓ Price Saved ($${cost.toFixed(2)})!`);
    await loadProjectSpecs();
  } catch (err) {
    console.error("Error updating spec:", err);
    if (feedbackEl) feedbackEl.innerHTML = `<span style="color:#ff8a80; font-size:0.85rem;">Error: ${err.message}</span>`;
  }
};

window.sendSpecMessage = async function(specId) {
  const input = document.getElementById(`msgInput_${specId}`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const role = isDesignerMode ? 'designer' : 'client';

  await db.from('ds_spec_messages').insert([{
    spec_id: specId,
  openSpecIds.add(specId);
  input.value = '';
  showToastOverlay("✓ Discussion Note Posted!");
  await loadProjectSpecs();
};

window.toggleSpecSignOff = async function(specId, role) {
  const spec = currentSpecs.find(s => s.id === specId);
  if (!spec) return;

  const newClientAgreed = role === 'client' ? !spec.client_agreed : spec.client_agreed;
  const newDesignerAgreed = role === 'designer' ? !spec.designer_agreed : spec.designer_agreed;
  const isBothAgreed = newClientAgreed && newDesignerAgreed;

  const updateObj = {
    client_agreed: newClientAgreed,
    designer_agreed: newDesignerAgreed
  };

  if (isBothAgreed) {
    updateObj.agreed_client_answer = spec.client_answer;
    updateObj.change_requested_by = null;
  }

  openSpecIds.add(specId);
  await db.from('ds_questionnaire_specs').update(updateObj).eq('id', specId);
  showToastOverlay("✓ Spec Agreement Updated!");
  await loadProjectSpecs();
};

async function renderJobPlan() {
  const container = document.getElementById('jobPlanContainer');
  if (!container) return;

  const agreedSpecs = currentSpecs.filter(s => s.agreed_client_answer || (s.client_agreed && s.designer_agreed));

  if (agreedSpecs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px 20px;">
        <h4 style="font-size:1.2rem; color:var(--text-muted);">No Agreed Project Yet</h4>
        <p style="font-size:0.9rem; color:var(--text-muted); margin-top:8px;">
          Once specs are reviewed and agreed upon by both client and developer in the <strong>Project Builder</strong> tab, they will automatically synthesize into your official Agreed Project here.
        </p>
      </div>
    `;
    return;
  }

  let total = agreedSpecs.reduce((acc, s) => acc + parseFloat(s.line_item_cost || 0), 0);

  let { data: plans } = await db
    .from('ds_job_plans')
    .select('*')
    .eq('project_id', currentProject.id);

  let planObj = null;
  if (!plans || plans.length === 0) {
    const { data: newPlan } = await db.from('ds_job_plans').insert([{
      project_id: currentProject.id,
      agreed_specs_summary: JSON.stringify(agreedSpecs),
      final_total_price: total
    }]).select().single();
    planObj = newPlan;
  } else {
    planObj = plans[0];
  }

  const { data: notes } = await db
    .from('ds_job_plan_notes')
    .select('*')
    .eq('job_plan_id', planObj.id)
    .order('created_at', { ascending: true });

  container.innerHTML = `
    <div style="background: rgba(0,0,0,0.3); border:1px solid var(--card-border); padding:32px; border-radius:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--card-border); padding-bottom:16px; margin-bottom:20px;">
        <div>
          <span class="status-badge agreed">✓ OFFICIAL AGREED PROJECT</span>
          <h2 style="font-family:var(--font-serif); font-size:2rem; margin-top:6px;">${currentProject.project_name}</h2>
        </div>
        <div style="text-align:right;">
          <small style="color:var(--text-muted); text-transform:uppercase; font-size:0.75rem;">Agreed Price Quote</small>
          <div style="font-family:var(--font-serif); font-size:2.5rem; color:var(--coral-accent);">$${total.toFixed(2)}</div>
        </div>
      </div>

      <h4 style="margin-bottom:12px; font-size:1.1rem;">Agreed Specifications & Line Items</h4>
      <table class="job-sheet-table">
        <thead>
          <tr>
            <th>Tag</th>
            <th>Specification</th>
            <th>Scope & Details</th>
            <th>Line Price</th>
          </tr>
        </thead>
        <tbody>
          ${agreedSpecs.map(s => {
            const displayedAgreedAnswer = s.agreed_client_answer || s.client_answer;
            const hasPendingChange = (s.client_answer && s.client_answer !== displayedAgreedAnswer) || (!s.client_agreed || !s.designer_agreed);
            const changeNotice = hasPendingChange
              ? `<div style="color:var(--coral-accent); font-size:0.82rem; margin-top:6px; font-weight:600; background:rgba(255,107,107,0.1); padding:4px 8px; border-radius:6px; display:inline-block;">* Change requested by ${escapeHtml(s.change_requested_by || 'user')}</div>`
              : '';

            return `
              <tr>
                <td><span class="spec-badge">${s.spec_tag}</span></td>
                <td>
                  <strong>${escapeHtml(s.question_text)}</strong><br>
                  <small style="color:var(--text-muted);">${escapeHtml(displayedAgreedAnswer)}</small>
                  ${changeNotice}
                </td>
                <td>${escapeHtml(s.designer_scope_notes || 'Standard Scope')}</td>
                <td><b>$${parseFloat(s.line_item_cost || 0).toFixed(2)}</b></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Aggregated Project Asset Locker -->
      <div style="margin-top:32px; border-top:1px solid var(--card-border); padding-top:20px;">
        <h4 style="font-size:1.05rem; margin-bottom:12px;">📁 Project Asset Locker & Uploaded Files</h4>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">
          All brand logos, guidelines, images, and documents uploaded across project specifications.
        </p>
        <div class="asset-locker-grid">
          ${(() => {
            let allFiles = [];
            Object.keys(projectSpecFilesMap).forEach(key => {
              allFiles = allFiles.concat(projectSpecFilesMap[key] || []);
            });

            if (allFiles.length === 0) {
              return '<p style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">No project assets uploaded yet.</p>';
            }

            return allFiles.map(f => {
              const isImg = f.file_type && f.file_type.startsWith('image/');
              const icon = isImg ? '🖼️' : (f.file_type && f.file_type.includes('pdf') ? '📄' : '📦');
              return `
                <div class="asset-locker-card">
                  ${isImg && f.file_data 
                    ? `<img src="${f.file_data}" class="file-thumb-preview" alt="asset" onclick="openImageLightbox('${f.file_data}', '${escapeHtml(f.file_name)}', '${f.file_size || ''}', '${f.file_type || ''}', '${f.file_dimensions || ''}')" title="Click to enlarge image">` 
                    : `<div class="file-thumb-fallback">${icon}</div>`
                  }
                  <div class="asset-card-actions">
                    <span class="asset-action-link" onclick="openImageLightbox('${f.file_data}', '${escapeHtml(f.file_name)}', '${f.file_size || ''}', '${f.file_type || ''}', '${f.file_dimensions || ''}')">View</span>
                    <a href="${f.file_data || '#'}" download="${escapeHtml(f.file_name)}" class="asset-action-link" target="_blank">Download</a>
                  </div>
                </div>
              `;
            }).join('');
          })()}
        </div>
      </div>

      <!-- Post-Agreement Job Plan Clarification Notes -->
      <div class="qa-thread" style="margin-top:32px;">
        <h4 style="font-size:1.05rem; margin-bottom:12px;">📌 Job Plan Clarification Notes & Q&A</h4>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
          This Job Plan is final and agreed upon. Use this thread for any ongoing questions or notes to clarify the agreed plan.
        </p>

        <div id="planNotesList">
          ${(notes && notes.length > 0) ? notes.map(n => `
            <div class="message-bubble ${n.author_role}">
              <span class="msg-sender ${n.author_role === 'designer' ? 'designer-name' : ''}">
                ${n.author_role === 'designer' ? '✦ Designer/Developer Note' : '👤 Client Note'}
              </span>
              <div>${n.note_text}</div>
              <span class="msg-time">${new Date(n.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
          `).join('') : '<p style="font-size:0.85rem; color:var(--text-muted);">No clarification notes added yet.</p>'}
        </div>

        <div class="qa-input-row" style="margin-top:14px;">
          <input type="text" class="form-control" id="planNoteInput" placeholder="Add a clarification note to this agreed Job Plan...">
          <button class="btn-portal" onclick="addJobPlanNote('${planObj.id}')">Add Note</button>
        </div>
      </div>
    </div>
  `;
}

window.addJobPlanNote = async function(jobPlanId) {
  const input = document.getElementById('planNoteInput');
  const text = input.value.trim();
  if (!text) return;

  const role = isDesignerMode ? 'designer' : 'client';

  await db.from('ds_job_plan_notes').insert([{
    job_plan_id: jobPlanId,
    author_id: currentUser.id,
    author_role: role,
    note_text: text
  }]);

  input.value = '';
  showToastOverlay("✓ Job Plan Note Added!");
  await renderJobPlan();
};

async function renderProjectOverview() {
  const container = document.getElementById('projectOverviewContainer');
  if (!container) return;

  if (!currentProject) {
    container.innerHTML = '<p style="padding:20px; color:var(--text-muted);">No active project selected.</p>';
    return;
  }

  const activeQuestions = getQuestionsForProject(currentProject);

  // Collect custom spec items created for this project
  const customQuestionObjs = [];
  currentSpecs.forEach(s => {
    const isBuiltIn = activeQuestions.some(aq => aq.key === s.question_key);
    if (!isBuiltIn && s.question_key) {
      customQuestionObjs.push({
        key: s.question_key,
        title: s.question_text || 'Custom Spec Item',
        tag: s.spec_tag || '#Custom-Spec',
        desc: 'Custom line-item specification created for this project workspace.'
      });
    }
  });

  const allItems = [...activeQuestions, ...customQuestionObjs];
  let totalCost = 0;

  const rowsHtml = allItems.map(q => {
    const spec = currentSpecs.find(s => s.question_key === q.key);
    const hasAnswer = spec && spec.client_answer && spec.client_answer.trim().length > 0;
    const answer = hasAnswer
      ? spec.client_answer.trim()
      : '<span style="color:var(--text-muted); font-style:italic;">No specification answer provided yet.</span>';
    
    const hasNotes = spec && spec.designer_scope_notes && spec.designer_scope_notes.trim().length > 0;
    const scopeNotes = hasNotes
      ? spec.designer_scope_notes.trim()
      : '<span style="color:var(--text-muted); font-style:italic;">No designer scope notes added yet.</span>';

    const cost = spec ? parseFloat(spec.line_item_cost || 0) : 0;
    totalCost += cost;

    return `
      <div class="overview-item-card">
        <div class="overview-card-header">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <span class="spec-badge" style="align-self:flex-start;">${q.tag}</span>
            <strong style="font-size:1.05rem; color:var(--text-main); font-family:'DM Sans', sans-serif;">${escapeHtml(q.title)}</strong>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); display:block;">Line Cost</span>
            <b style="font-size:1.15rem; color:var(--coral-accent); font-family:var(--font-serif);">$${cost.toFixed(2)}</b>
          </div>
        </div>

        <div class="overview-card-body">
          <div class="overview-block">
            <div class="overview-block-title">Proposed Main Specification Answer</div>
            <div style="font-size:0.92rem; color:var(--text-main); line-height:1.5;">${hasAnswer ? escapeHtml(answer) : answer}</div>
          </div>
          <div class="overview-block">
            <div class="overview-block-title">Designer Scope Notes</div>
            <div style="font-size:0.9rem; color:var(--text-main); line-height:1.5;">${hasNotes ? escapeHtml(scopeNotes) : scopeNotes}</div>
          </div>
        </div>

        <div class="overview-card-footer">
          <span style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); font-weight:700;">Sign-off Status:</span>
          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <span class="status-badge ${spec && spec.client_agreed ? 'agreed' : 'pending'}" style="font-size:0.78rem; padding:4px 10px;">
              Client: ${spec && spec.client_agreed ? '✓ Signed Off' : 'Pending'}
            </span>
            <span class="status-badge ${spec && spec.designer_agreed ? 'agreed' : 'pending'}" style="font-size:0.78rem; padding:4px 10px;">
              Designer: ${spec && spec.designer_agreed ? '✓ Signed Off' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="background: rgba(0,0,0,0.2); border:1px solid var(--card-border); padding:20px; border-radius:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--card-border); padding-bottom:16px; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
          <span class="status-badge" style="background:rgba(255,107,107,0.15); color:var(--coral-accent); border:1px solid var(--coral-accent);">📋 PROPOSED PROJECT OVERVIEW</span>
          <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-top:6px; margin-bottom:0;">${escapeHtml(currentProject.project_name)}</h2>
        </div>
        <div style="text-align:right;">
          <small style="color:var(--text-muted); text-transform:uppercase; font-size:0.75rem;">Total Estimated Quote</small>
          <div style="font-family:var(--font-serif); font-size:2.2rem; color:var(--coral-accent);">$${totalCost.toFixed(2)}</div>
        </div>
      </div>

      <div class="overview-cards-list">
        ${rowsHtml}
      </div>
    </div>
  `;
}

function showTabSection(tabKey) {
  const qTab = document.getElementById('tabQuestionnaire');
  const oTab = document.getElementById('tabOverview');
  const sTab = document.getElementById('tabSpecs');
  const jTab = document.getElementById('tabJobPlan');
  if (qTab) qTab.style.display = (tabKey === 'questionnaire' || tabKey === 'specs') ? 'block' : 'none';
  if (oTab) {
    oTab.style.display = tabKey === 'overview' ? 'block' : 'none';
    if (tabKey === 'overview') renderProjectOverview();
  }
  if (sTab) sTab.style.display = 'none';
  if (jTab) jTab.style.display = tabKey === 'jobplan' ? 'block' : 'none';
}

function handleLogout() {
  if (db) db.auth.signOut();
  currentUser = null;
  currentProfile = null;
  currentProject = null;
  currentSpecs = [];
  showAuthView();
}

function showAuthView() {
  const authSec = document.getElementById('authSection');
  const projSec = document.getElementById('projectsSection');
  const dashSec = document.getElementById('portalDashboard');
  const grid = document.getElementById('projectsGrid');

  if (authSec) authSec.style.display = 'block';
  if (projSec) projSec.style.display = 'none';
  if (dashSec) dashSec.style.display = 'none';
  if (grid) grid.innerHTML = '';
}

function showAuthError(msg) {
  const el = document.getElementById('authErrorMsg');
  if (el) {
    el.className = 'alert-msg error';
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function clearAuthError() {
  const el = document.getElementById('authErrorMsg');
  if (el) el.style.display = 'none';
}

window.showAddCustomSpecModal = function() {
  const modal = document.getElementById('addCustomSpecModal');
  if (!modal) return;
  modal.classList.add('active');
  modal.style.display = 'flex';
  const titleInput = document.getElementById('customSpecTitleInput');
  if (titleInput) {
    titleInput.value = '';
    titleInput.focus();
  }
};

window.closeAddCustomSpecModal = function(e) {
  if (e) e.stopPropagation();
  const modal = document.getElementById('addCustomSpecModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
};

window.handleAddCustomSpecSubmit = async function(e) {
  e.preventDefault();
  if (!currentProject) {
    alert("Please open a project workspace first before adding custom specs.");
    return;
  }

  const titleInput = document.getElementById('customSpecTitleInput');
  const tagInput = document.getElementById('customSpecTagInput');
  const descInput = document.getElementById('customSpecDescInput');

  const title = titleInput ? titleInput.value.trim() : '';
  const tag = tagInput ? tagInput.value.trim() : '#Custom-Spec';
  const desc = descInput ? descInput.value.trim() : '';

  if (!title) return;

  const customKey = 'custom_spec_' + Date.now();

  try {
    const { data: inserted, error } = await db.from('ds_questionnaire_specs').insert([{
      project_id: currentProject.id,
      question_key: customKey,
      question_text: title,
      spec_tag: tag || '#Custom-Spec',
      client_answer: desc
    }]).select();

    if (error) throw error;

    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';

    closeAddCustomSpecModal();
    showToastOverlay("✓ Custom Line Item Added!");

    if (inserted && inserted[0]) {
      openSpecIds.add(inserted[0].id);
      openSpecIds.add(customKey);
    }

    await loadProjectSpecs();
  } catch (err) {
    console.error("Error creating custom spec item:", err);
    alert("Could not create custom spec item. Please try again: " + err.message);
  }
};
