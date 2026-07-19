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
let currentSpecs = [];
let isDesignerMode = false;
let adminAllClients = [];

// Admin Account Identifier
const ADMIN_USERNAME = "daxiel777";
const ADMIN_EMAIL = "daxiel777@dreamsites.pro";

// Standardized 10 Web Design Questionnaire Items
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
  }
];

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

  // Logout
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

  // Admin Client Selector Dropdown
  const adminClientSelect = document.getElementById('adminClientSelect');
  if (adminClientSelect) {
    adminClientSelect.addEventListener('change', async (e) => {
      const selectedProjectId = e.target.value;
      if (selectedProjectId) {
        await loadProjectById(selectedProjectId);
      }
    });
  }
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
    document.getElementById('userEmailLabel').textContent = `${currentProfile.full_name || currentUser.email} (${currentProfile.role.toUpperCase()})`;
    document.getElementById('userBadge').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('portalDashboard').style.display = 'block';

    // Admin Access Configuration
    if (currentProfile.role === 'designer') {
      isDesignerMode = true;
      document.getElementById('adminSelectorBar').style.display = 'flex';
      await loadAdminClientList();
    } else {
      isDesignerMode = false;
      document.getElementById('adminSelectorBar').style.display = 'none';
      await loadUserProject();
    }
  } catch (err) {
    console.error("Error loading user profile:", err);
  }
}

async function loadAdminClientList() {
  try {
    const { data: projects, error } = await db
      .from('ds_projects')
      .select('*, ds_profiles(full_name, company_name, email)');

    adminAllClients = projects || [];
    const selectEl = document.getElementById('adminClientSelect');

    if (!adminAllClients || adminAllClients.length === 0) {
      selectEl.innerHTML = '<option value="">No client projects submitted yet</option>';
      return;
    }

    selectEl.innerHTML = adminAllClients.map(p => {
      const clientName = p.ds_profiles ? (p.ds_profiles.company_name || p.ds_profiles.full_name || p.ds_profiles.email) : 'Client Project';
      return `<option value="${p.id}">${clientName} — ${p.project_name} ($${parseFloat(p.total_quote || 0).toFixed(2)})</option>`;
    }).join('');

    // Load first client project by default for admin
    if (adminAllClients.length > 0) {
      await loadProjectById(adminAllClients[0].id);
    }
  } catch (err) {
    console.error("Error loading admin client list:", err);
  }
}

async function loadProjectById(projectId) {
  const { data: proj } = await db.from('ds_projects').select('*').eq('id', projectId).single();
  if (proj) {
    currentProject = proj;
    await loadProjectSpecs();
  }
}

async function loadUserProject() {
  try {
    let { data: projects } = await db
      .from('ds_projects')
      .select('*')
      .eq('client_id', currentUser.id);

    if (!projects || projects.length === 0) {
      const { data: newProj } = await db
        .from('ds_projects')
        .insert([{
          client_id: currentUser.id,
          project_name: (currentProfile.company_name ? currentProfile.company_name + ' Website' : 'My Website Project'),
          status: 'questionnaire_in_progress'
        }])
        .select()
        .single();
      currentProject = newProj;
    } else {
      currentProject = projects[0];
    }

    await loadProjectSpecs();
  } catch (err) {
    console.error("Error loading project:", err);
  }
}

async function loadProjectSpecs() {
  if (!currentProject) return;

  const { data: specs } = await db
    .from('ds_questionnaire_specs')
    .select('*')
    .eq('project_id', currentProject.id);

  currentSpecs = specs || [];
  renderQuestionnaireForm();
  renderSpecsReview();
  renderJobPlan();
}

function renderQuestionnaireForm() {
  const container = document.getElementById('questionnaireFields');
  if (!container) return;

  container.innerHTML = DEFAULT_QUESTIONS.map(q => {
    const existing = currentSpecs.find(s => s.question_key === q.key);
    const val = existing ? existing.client_answer : '';

    return `
      <div class="question-block">
        <div class="question-header">
          <span class="question-title">${q.title}</span>
          <span class="spec-badge">${q.tag}</span>
        </div>
        <p class="question-desc">${q.desc}</p>
        <textarea class="form-control" name="${q.key}" placeholder="Answer here..." ${isDesignerMode ? 'readonly' : ''}>${val}</textarea>
      </div>
    `;
  }).join('');
}

async function handleQuestionnaireSave(e) {
  e.preventDefault();
  if (isDesignerMode) {
    alert("Admin view is read-only for questionnaire submission. Switch client or edit pricing in Tab 2.");
    return;
  }

  const formData = new FormData(e.target);
  const statusMsg = document.getElementById('questionnaireStatusMsg');
  statusMsg.innerHTML = '<span style="color: var(--text-muted);">Saving your responses...</span>';

  try {
    for (const q of DEFAULT_QUESTIONS) {
      const answer = formData.get(q.key) || '';
      const existing = currentSpecs.find(s => s.question_key === q.key);

      if (existing) {
        await db.from('ds_questionnaire_specs').update({
          client_answer: answer,
          updated_at: new Date()
        }).eq('id', existing.id);
      } else {
        await db.from('ds_questionnaire_specs').insert([{
          project_id: currentProject.id,
          question_key: q.key,
          question_text: q.title,
          spec_tag: q.tag,
          client_answer: answer
        }]);
      }
    }

    statusMsg.innerHTML = '<div class="alert-msg success">✓ Questionnaire saved! Your answers are ready for spec review & line-item pricing.</div>';
    await loadProjectSpecs();
    setTimeout(() => { statusMsg.innerHTML = ''; }, 3000);
  } catch (err) {
    statusMsg.innerHTML = `<div class="alert-msg error">Error saving: ${err.message}</div>`;
  }
}

async function renderSpecsReview() {
  const container = document.getElementById('specsReviewList');
  if (!container) return;

  if (!currentSpecs || currentSpecs.length === 0) {
    container.innerHTML = '<p class="question-desc">No answered questionnaire specs yet. Please complete the Questionnaire tab first.</p>';
    document.getElementById('totalQuoteVal').textContent = '$0.00';
    return;
  }

  let totalQuote = 0;
  let html = '';

  for (const spec of currentSpecs) {
    const cost = parseFloat(spec.line_item_cost || 0);
    totalQuote += cost;
    const isAgreed = spec.client_agreed && spec.designer_agreed;
    const statusClass = isAgreed ? 'agreed' : 'pending';
    const statusText = isAgreed ? '✓ Agreed & Signed Off' : (spec.client_agreed || spec.designer_agreed ? 'Pending Dual Approval' : 'Under Review');

    // Fetch messages for this spec
    const { data: msgs } = await db
      .from('ds_spec_messages')
      .select('*')
      .eq('spec_id', spec.id)
      .order('created_at', { ascending: true });

    html += `
      <div class="spec-item-card ${statusClass}">
        <div class="spec-meta-row">
          <div>
            <span class="spec-badge">${spec.spec_tag}</span>
            <h4 style="margin-top:6px; font-size:1.1rem;">${spec.question_text}</h4>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <b style="font-size:1.3rem; color:var(--coral-accent);">$${cost.toFixed(2)}</b>
          </div>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px; margin-bottom: 14px;">
          <small style="color:var(--text-muted); font-weight:700; text-transform:uppercase; font-size:0.75rem;">Client Answer:</small>
          <p style="margin-top:4px;">${spec.client_answer || '<i>No answer provided yet.</i>'}</p>
        </div>

        ${isDesignerMode ? `
          <div style="background: rgba(255,107,82,0.06); border: 1px solid rgba(255,107,82,0.2); padding: 16px; border-radius: 10px; margin-bottom: 16px;">
            <h5 style="color:var(--coral-accent); margin-bottom: 10px; font-size:0.88rem;">✦ DESIGNER CONTROLS:</h5>
            <div style="display:grid; grid-template-columns: 1fr 140px; gap:12px; margin-bottom:10px;">
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted);">Scope Notes / What this entails:</label>
                <input type="text" class="form-control" id="scopeNote_${spec.id}" value="${spec.designer_scope_notes || ''}" placeholder="e.g. Custom database schema, 3 API endpoints, full UI testing.">
              </div>
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted);">Line Cost ($):</label>
                <input type="number" step="10" class="form-control" id="cost_${spec.id}" value="${cost.toFixed(2)}">
              </div>
            </div>
            <button class="btn-portal" onclick="saveDesignerSpecUpdate('${spec.id}')">Save Price & Scope Notes</button>
          </div>
        ` : `
          ${spec.designer_scope_notes ? `
            <div style="background: rgba(255,107,82,0.05); border-left: 3px solid var(--coral-accent); padding: 12px; border-radius: 4px; margin-bottom: 14px;">
              <small style="color:var(--coral-accent); font-weight:700;">Designer Scope Notes:</small>
              <p style="margin-top:2px; font-size:0.9rem;">${spec.designer_scope_notes}</p>
            </div>
          ` : ''}
        `}

        <!-- Interactive Spec Q&A Thread -->
        <div class="qa-thread">
          <div class="qa-title">💬 Interactive Discussion & Clarifications:</div>
          <div id="msgContainer_${spec.id}">
            ${(msgs && msgs.length > 0) ? msgs.map(m => `
              <div class="message-bubble ${m.sender_role}">
                <span class="msg-sender ${m.sender_role === 'designer' ? 'designer-name' : ''}">
                  ${m.sender_role === 'designer' ? '✦ Designer/Developer' : '👤 Client'}
                </span>
                <div>${m.message_text}</div>
                <span class="msg-time">${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            `).join('') : '<p style="font-size:0.85rem; color:var(--text-muted);">No notes or follow-up questions posted yet.</p>'}
          </div>

          <div class="qa-input-row">
            <input type="text" class="form-control" id="msgInput_${spec.id}" placeholder="Ask a question or post a note on this spec...">
            <button class="btn-portal" onclick="sendSpecMessage('${spec.id}')">Send</button>
          </div>
        </div>

        <!-- Spec Agreement Button -->
        <div style="margin-top:16px; display:flex; align-items:center; justify-content:space-between; border-top:1px solid var(--card-border); padding-top:14px;">
          <span style="font-size:0.85rem; color:var(--text-muted);">
            Client Sign-off: <strong>${spec.client_agreed ? '✓ Yes' : 'Pending'}</strong> | 
            Designer Sign-off: <strong>${spec.designer_agreed ? '✓ Yes' : 'Pending'}</strong>
          </span>
          <button class="btn-portal-outline" onclick="toggleSpecSignOff('${spec.id}', ${isDesignerMode ? "'designer'" : "'client'"})">
            ${(isDesignerMode ? spec.designer_agreed : spec.client_agreed) ? '✓ Spec Agreed' : 'Agree to Spec'}
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  document.getElementById('totalQuoteVal').textContent = `$${totalQuote.toFixed(2)}`;

  if (currentProject) {
    await db.from('ds_projects').update({ total_quote: totalQuote }).eq('id', currentProject.id);
  }
}

window.saveDesignerSpecUpdate = async function(specId) {
  const scopeNotes = document.getElementById(`scopeNote_${specId}`).value;
  const cost = parseFloat(document.getElementById(`cost_${specId}`).value || 0);

  await db.from('ds_questionnaire_specs').update({
    designer_scope_notes: scopeNotes,
    line_item_cost: cost,
    updated_at: new Date()
  }).eq('id', specId);

  await loadProjectSpecs();
};

window.sendSpecMessage = async function(specId) {
  const input = document.getElementById(`msgInput_${specId}`);
  const text = input.value.trim();
  if (!text) return;

  const role = isDesignerMode ? 'designer' : 'client';

  await db.from('ds_spec_messages').insert([{
    spec_id: specId,
    sender_id: currentUser.id,
    sender_role: role,
    message_text: text
  }]);

  input.value = '';
  await renderSpecsReview();
};

window.toggleSpecSignOff = async function(specId, role) {
  const spec = currentSpecs.find(s => s.id === specId);
  if (!spec) return;

  const updateObj = role === 'designer' 
    ? { designer_agreed: !spec.designer_agreed }
    : { client_agreed: !spec.client_agreed };

  await db.from('ds_questionnaire_specs').update(updateObj).eq('id', specId);
  await loadProjectSpecs();
};

async function renderJobPlan() {
  const container = document.getElementById('jobPlanContainer');
  if (!container) return;

  const agreedSpecs = currentSpecs.filter(s => s.client_agreed && s.designer_agreed);

  if (agreedSpecs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px 20px;">
        <h4 style="font-size:1.2rem; color:var(--text-muted);">No Agreed Job Sheet Yet</h4>
        <p style="font-size:0.9rem; color:var(--text-muted); margin-top:8px;">
          Once specs are reviewed and agreed upon by both client and designer in the <strong>Spec Review & Pricing</strong> tab, they will automatically synthesize into your official Job Plan here.
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
          <span class="status-badge agreed">✓ OFFICIAL AGREED JOB PLAN</span>
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
          ${agreedSpecs.map(s => `
            <tr>
              <td><span class="spec-badge">${s.spec_tag}</span></td>
              <td><strong>${s.question_text}</strong><br><small style="color:var(--text-muted);">${s.client_answer}</small></td>
              <td>${s.designer_scope_notes || 'Standard Scope'}</td>
              <td><b>$${parseFloat(s.line_item_cost || 0).toFixed(2)}</b></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

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
  await renderJobPlan();
};

function showTabSection(tabKey) {
  document.getElementById('tabQuestionnaire').style.display = tabKey === 'questionnaire' ? 'block' : 'none';
  document.getElementById('tabSpecs').style.display = tabKey === 'specs' ? 'block' : 'none';
  document.getElementById('tabJobPlan').style.display = tabKey === 'jobplan' ? 'block' : 'none';
}

function handleLogout() {
  if (db) db.auth.signOut();
  currentUser = null;
  currentProfile = null;
  showAuthView();
}

function showAuthView() {
  document.getElementById('authSection').style.display = 'block';
  document.getElementById('portalDashboard').style.display = 'none';
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
