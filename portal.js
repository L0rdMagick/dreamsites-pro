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

// Standard Questionnaire Schema mapped to Spec Tags
const DEFAULT_QUESTIONS = [
  {
    key: 'design_style',
    title: 'Visual Design & Brand Vibe',
    tag: '#Design-Style',
    desc: 'What visual aesthetic fits your business best? (e.g. Sleek Dark Mode, Warm Minimalist, Bold & Vibrant, Modern Corporate)'
  },
  {
    key: 'target_audience',
    title: 'Target Audience & Primary Action',
    tag: '#Audience-Conversion',
    desc: 'Who are your main clients and what is the #1 goal when they visit? (e.g., Book appointments, Call immediately, Request a Quote)'
  },
  {
    key: 'pages_needed',
    title: 'Pages & Content Scope',
    tag: '#Content-Pages',
    desc: 'Which key pages or sections do you require? (e.g., Home, Services, Pricing, About Us, Gallery, FAQ, Contact)'
  },
  {
    key: 'e_commerce',
    title: 'E-Commerce & Online Payments',
    tag: '#E-Commerce',
    desc: 'Do you need to sell products, digital downloads, or collect online deposits/payments?'
  },
  {
    key: 'user_auth',
    title: 'User Accounts & Client Portal',
    tag: '#User-Auth',
    desc: 'Do your customers need to register, log in, view orders, or access restricted member content?'
  },
  {
    key: 'ai_tools',
    title: 'AI Chat, Scheduling & Smart Tools',
    tag: '#AI-Automation',
    desc: 'Would you like to integrate AI Customer Chat, automated online booking calendars, or AI lead catchers?'
  },
  {
    key: 'domain_hosting',
    title: 'Domain & Hosting Preferences',
    tag: '#Hosting-Domain',
    desc: 'Do you already own a custom domain? Do you need custom email setup (e.g., info@yourdomain.com)?'
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

  // Designer Mode Toggle
  const designerToggle = document.getElementById('designerToggle');
  if (designerToggle) {
    designerToggle.addEventListener('change', (e) => {
      isDesignerMode = e.target.checked;
      renderSpecsReview();
    });
  }
}

async function checkSession() {
  if (!db) {
    showAuthError("Supabase client is loading or missing script tag.");
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
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const fullName = document.getElementById('fullNameInput') ? document.getElementById('fullNameInput').value.trim() : '';
  const companyName = document.getElementById('companyNameInput') ? document.getElementById('companyNameInput').value.trim() : '';

  if (!email || !password) {
    showAuthError("Please enter email and password.");
    return;
  }

  try {
    if (mode === 'signup') {
      const { data, error } = await db.auth.signUp({ email, password });
      if (error) throw error;
      
      if (data.user) {
        // Create Profile in ds_profiles
        await db.from('ds_profiles').insert([{
          id: data.user.id,
          email: email,
          full_name: fullName || 'Client',
          company_name: companyName || '',
          role: 'client'
        }]);
        currentUser = data.user;
        await loadUserProfile();
      }
    } else {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
      await loadUserProfile();
    }
  } catch (err) {
    showAuthError(err.message || "Authentication failed.");
  }
}

async function loadUserProfile() {
  try {
    const { data: profile, error } = await db
      .from('ds_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (profile) {
      currentProfile = profile;
    } else {
      // Fallback default profile if missing
      currentProfile = { id: currentUser.id, email: currentUser.email, role: 'client', full_name: 'Client' };
    }

    // Set UI Header Info
    document.getElementById('userEmailLabel').textContent = currentProfile.full_name || currentUser.email;
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('portalDashboard').style.display = 'block';

    // Check if user is Designer
    if (currentProfile.role === 'designer') {
      document.getElementById('designerBanner').style.display = 'flex';
      isDesignerMode = true;
    }

    await loadUserProject();
  } catch (err) {
    console.error("Error loading user profile:", err);
  }
}

async function loadUserProject() {
  try {
    let { data: projects } = await db
      .from('ds_projects')
      .select('*')
      .eq('client_id', currentUser.id);

    if (!projects || projects.length === 0) {
      // Auto-create initial project for client
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
        <textarea class="form-control" name="${q.key}" placeholder="Describe your preferences here...">${val}</textarea>
      </div>
    `;
  }).join('');
}

async function handleQuestionnaireSave(e) {
  e.preventDefault();
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
          <small style="color:var(--text-muted); font-weight:700; text-transform:uppercase; font-size:0.75rem;">Client Response:</small>
          <p style="margin-top:4px;">${spec.client_answer || '<i>No answer provided yet.</i>'}</p>
        </div>

        ${isDesignerMode ? `
          <div style="background: rgba(255,107,82,0.06); border: 1px solid rgba(255,107,82,0.2); padding: 16px; border-radius: 10px; margin-bottom: 16px;">
            <h5 style="color:var(--coral-accent); margin-bottom: 10px; font-size:0.88rem;">DESIGNER CONTROLS:</h5>
            <div style="display:grid; grid-template-columns: 1fr 140px; gap:12px; margin-bottom:10px;">
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted);">Scope Notes / What this entails:</label>
                <input type="text" class="form-control" id="scopeNote_${spec.id}" value="${spec.designer_scope_notes || ''}" placeholder="e.g. Includes custom database schema, 3 API endpoints, full UI testing.">
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

  // Update total quote in ds_projects DB
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

  // Fetch or sync Job Plan record
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

  // Fetch post-agreement notes
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
          <p style="font-size:0.85rem; color:var(--text-muted);">Client: ${currentProfile.full_name || currentProfile.email} (${currentProfile.company_name || 'N/A'})</p>
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
