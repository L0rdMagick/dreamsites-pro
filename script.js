const q=(s,p=document)=>p.querySelector(s),qa=(s,p=document)=>[...p.querySelectorAll(s)];q('#year').textContent=new Date().getFullYear();
const menu=q('.menu'),mobile=q('.mobile-menu');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobile.classList.toggle('open',!open);document.body.classList.toggle('lock',!open)});qa('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');mobile.classList.remove('open');document.body.classList.remove('lock')}));
const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.1});qa('.reveal').forEach(el=>observer.observe(el));
qa('.faq-item button').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.faq-item'),was=item.classList.contains('open');qa('.faq-item').forEach(x=>{x.classList.remove('open');q('button',x).setAttribute('aria-expanded','false');q('button b',x).textContent='+'});if(!was){item.classList.add('open');btn.setAttribute('aria-expanded','true');q('b',btn).textContent='−'}}));
const launch=q('.chat-launch'),chat=q('.chat'),close=q('.chat header button'),messages=q('.messages'),input=q('.chat form input');function setChat(open){chat.classList.toggle('open',open);chat.setAttribute('aria-hidden',String(!open));launch.setAttribute('aria-expanded',String(open));if(open)setTimeout(()=>input.focus(),200)}launch.addEventListener('click',()=>setChat(!chat.classList.contains('open')));close.addEventListener('click',()=>setChat(false));
const chatHistory = [];
function add(text,user=false){const p=document.createElement('p');p.textContent=text;if(user)p.className='user';messages.appendChild(p);messages.scrollTop=messages.scrollHeight}
async function askAI(text) {
  add(text,true);
  chatHistory.push({ role: 'user', text: text });
  const typing = document.createElement('p');
  typing.className = 'typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: chatHistory })
    });
    const data = await res.json();
    typing.remove();
    const replyText = data.text || "Sorry, I couldn't reach the server. Please try again.";
    add(replyText);
    chatHistory.push({ role: 'assistant', text: replyText });
  } catch(err) {
    typing.remove();
    add("Sorry, I'm having trouble connecting right now. Please try again or email hello@dreamsites.pro.");
    console.error(err);
  }
}
qa('.replies button').forEach(b=>b.addEventListener('click',()=>askAI(b.textContent)));
q('.chat form').addEventListener('submit',e=>{
  e.preventDefault();
  const text=input.value.trim();
  if(!text)return;
  askAI(text);
  input.value='';
});
// Project Planner Step Navigation
let currentStep = 1;
const formSteps = qa('.form-step');
const progressBar = q('.planner-progress .progress-bar');
const stepNumLabel = q('.planner-progress .step-num');

function goToStep(step) {
  currentStep = step;
  formSteps.forEach(el => {
    const sNum = parseInt(el.getAttribute('data-step'), 10);
    el.classList.toggle('active', sNum === currentStep);
  });
  if (progressBar) progressBar.style.width = `${(currentStep / 4) * 100}%`;
  if (stepNumLabel) {
    const stepTitles = ["Contact", "Project Scope", "Website Teardown", "Goals"];
    stepNumLabel.textContent = `Step ${currentStep} of 4: ${stepTitles[currentStep - 1]}`;
  }
}

qa('.next-step').forEach(btn => {
  btn.addEventListener('click', () => {
    const currentStepEl = q(`.form-step[data-step="${currentStep}"]`);
    const inputs = qa('input[required], textarea[required]', currentStepEl);
    let allValid = true;
    inputs.forEach(input => {
      if (!input.reportValidity()) {
        allValid = false;
      }
    });
    if (allValid && currentStep < 4) {
      goToStep(currentStep + 1);
    }
  });
});

qa('.prev-step').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  });
});

// Toggle teardown website URL field
const teardownRadios = qa('input[name="teardown"]');
const urlFieldContainer = q('.teardown-url-field');
const urlInput = urlFieldContainer ? q('input', urlFieldContainer) : null;

teardownRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (urlFieldContainer) {
      const showUrl = e.target.value === 'yes';
      urlFieldContainer.style.display = showUrl ? 'block' : 'none';
      if (urlInput) {
        urlInput.required = showUrl;
      }
    }
  });
});

// Submit planner details
const contactForm = q('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const statusEl = q('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (submitBtn) submitBtn.disabled = true;
    statusEl.textContent = 'Sending your request...';
    statusEl.style.color = '';
    
    const d = new FormData(form);
    
    // Collect checkboxes
    const selectedServices = [];
    qa('input[name="services"]:checked').forEach(cb => {
      selectedServices.push(cb.value);
    });
    const serviceVal = selectedServices.length > 0 ? selectedServices.join(', ') : 'Not specified';
    
    // Prepend teardown option to message payload
    const teardownChoice = d.get('teardown');
    let teardownUrl = (d.get('current_url') || '').trim();
    if (teardownUrl && !/^https?:\/\//i.test(teardownUrl)) {
      teardownUrl = 'https://' + teardownUrl;
    }
    const userMessage = d.get('message');
    
    let formattedMessage = userMessage;
    if (teardownChoice === 'yes' && teardownUrl) {
      formattedMessage = `[FREE TEARDOWN REQUESTED - URL: ${teardownUrl}]\n\n${userMessage}`;
    } else {
      formattedMessage = `[No teardown requested]\n\n${userMessage}`;
    }
    
    const payload = {
      name: d.get('name'),
      email: d.get('email'),
      service: serviceVal,
      message: formattedMessage
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        statusEl.textContent = 'Message sent successfully! Redirecting...';
        statusEl.style.color = '#2e7d32';
        setTimeout(() => {
          window.location.href = 'thanks.html';
        }, 1200);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = `Error: ${err.message || 'Something went wrong. Please try again.'}`;
      statusEl.style.color = '#d32f2f';
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
let lastScroll=0;window.addEventListener('scroll',()=>{const currentScroll=window.pageYOffset||document.documentElement.scrollTop,nav=q('.nav');if(!nav)return;const menuExpanded=q('.menu')&&q('.menu').getAttribute('aria-expanded')==='true';if(menuExpanded)return;if(currentScroll<=0){nav.classList.remove('nav-hidden');return}if(currentScroll>lastScroll&&currentScroll>120&&!nav.classList.contains('nav-hidden')){nav.classList.add('nav-hidden')}else if(currentScroll<lastScroll&&nav.classList.contains('nav-hidden')){nav.classList.remove('nav-hidden')}lastScroll=currentScroll});

// ROI Calculator Logic
const visitorsInput = q('#range-visitors');
const liftInput = q('#range-lift');
const valueInput = q('#range-value');

if (visitorsInput && liftInput && valueInput) {
  const formatCur = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  
  function updateCalc() {
    const visitors = parseInt(visitorsInput.value, 10);
    const lift = parseFloat(liftInput.value) / 100;
    const value = parseInt(valueInput.value, 10);
    
    q('#val-visitors').textContent = visitors.toLocaleString();
    q('#val-lift').textContent = '+' + (lift * 100).toFixed(1) + '%';
    q('#val-value').textContent = formatCur(value);
    
    const additionalLeads = Math.round(visitors * lift);
    const increase = additionalLeads * value;
    
    q('#out-leads').textContent = '+' + additionalLeads.toLocaleString() + ' leads / mo';
    q('#out-increase').textContent = '+' + formatCur(increase);
  }
  
  [visitorsInput, liftInput, valueInput].forEach(input => input.addEventListener('input', updateCalc));
  updateCalc();
}

// Before/After Slider Logic
const baRange = q('.ba-range');
if (baRange) {
  baRange.addEventListener('input', (e) => {
    const val = e.target.value;
    const beforeImg = q('.ba-before');
    const handle = q('.ba-handle');
    if (beforeImg) beforeImg.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
    if (handle) handle.style.left = `${val}%`;
  });
}

// Planner Budget Estimator Logic
const serviceCheckboxes = qa('input[name="services"]');
const budgetLabel = q('#planner-price-range');

if (serviceCheckboxes.length > 0 && budgetLabel) {
  const priceMap = {
    'New Website': { min: 1200, max: 1800 },
    'Website Redesign': { min: 1000, max: 1600 },
    'AI & Automations': { min: 600, max: 1200 },
    'Custom Web App': { min: 2500, max: 4000 }
  };
  
  function updateBudget() {
    let minTotal = 0;
    let maxTotal = 0;
    let checkedCount = 0;
    
    serviceCheckboxes.forEach(cb => {
      if (cb.checked && priceMap[cb.value]) {
        minTotal += priceMap[cb.value].min;
        maxTotal += priceMap[cb.value].max;
        checkedCount++;
      }
    });
    
    if (checkedCount === 0) {
      budgetLabel.textContent = 'Select services';
    } else {
      budgetLabel.textContent = `$${minTotal.toLocaleString()} – $${maxTotal.toLocaleString()}`;
    }
  }
  
  serviceCheckboxes.forEach(cb => cb.addEventListener('change', updateBudget));
  updateBudget(); // initialize
}

// Platform Speed Meter Comparison Logic
const speedTabs = qa('.speed-tab');
if (speedTabs.length > 0) {
  const speedData = {
    dreamsite: { score: 99, time: "0.7 seconds", bounce: "Under 2%", progress: 14, color: "var(--lime)", desc: "Hand-coded static HTML + vanilla JS with 0 server-side database queries. Serviced via a global Content Delivery Network (CDN). Speed score is close to perfect." },
    wordpress: { score: 48, time: "3.9 seconds", bounce: "Around 24%", progress: 78, color: "var(--coral)", desc: "Heavy database-driven architecture with slow server response times (TTFB) and plugin asset bloat. Standard drag-and-drop themes degrade mobile rendering." },
    wix: { score: 32, time: "4.8 seconds", bounce: "Around 35%", progress: 96, color: "var(--coral)", desc: "Closed proprietary system with massive JavaScript file footprint. Renders slow layouts on mobile connections, causing visitors to close the page." },
    squarespace: { score: 45, time: "4.2 seconds", bounce: "Around 28%", progress: 84, color: "var(--coral)", desc: "Proprietary templated server system with heavy stylesheet assets and rendering blocks. Decent visual load but slow time-to-interactive." }
  };

  speedTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const platform = e.target.getAttribute('data-platform');
      const data = speedData[platform];
      if (!data) return;

      // Update active state on tab buttons
      speedTabs.forEach(t => {
        t.classList.toggle('active', t === e.target);
        if (t === e.target) {
          t.style.background = '';
          t.style.borderColor = '';
        } else {
          t.style.background = 'transparent';
          t.style.borderColor = 'transparent';
        }
      });

      // Update score and details
      const scoreEl = q('#speed-score');
      const dialEl = q('#speed-dial');
      const timeEl = q('#speed-time');
      const bounceEl = q('#speed-bounce');
      const progressLabel = q('#speed-progress-lbl');
      const progressBar = q('#speed-progress-bar');
      const descEl = q('#speed-desc');

      if (scoreEl) {
        scoreEl.textContent = data.score;
        scoreEl.style.color = data.color;
      }
      if (dialEl) dialEl.style.borderColor = data.color;
      if (timeEl) {
        timeEl.textContent = data.time;
        timeEl.style.color = data.color;
      }
      if (bounceEl) {
        bounceEl.textContent = data.bounce;
        bounceEl.style.color = data.color;
      }
      if (progressLabel) progressLabel.textContent = `${data.time.split(' ')[0]}s / 5.0s`;
      if (progressBar) {
        progressBar.style.width = `${data.progress}%`;
        progressBar.style.backgroundColor = data.color;
      }
      if (descEl) descEl.textContent = data.desc;
    });
  });
}

// Self-Diagnostic Audit Logic
const auditForm = q('#audit-form');
if (auditForm) {
  const auditQGroups = qa('.audit-q');
  
  function updateAuditScore() {
    let yesCount = 0;
    auditQGroups.forEach(group => {
      const checkedInput = q('input:checked', group);
      if (checkedInput && checkedInput.value === 'yes') {
        yesCount++;
      }
    });

    const score = Math.round((yesCount / 5) * 100);
    const scoreValEl = q('#audit-score-val');
    const gradeEl = q('#audit-grade');
    const recoEl = q('#audit-reco');

    let grade = "CRITICAL AUDIT";
    let color = "var(--coral)";
    let reco = "Your website has major performance, SEO, and client booking issues. It is failing to convert traffic and hurting your Google credibility. We highly recommend a clean modern rebuild.";

    if (score === 100) {
      grade = "PERFECT STATUS";
      color = "var(--lime)";
      reco = "Your website is in excellent health! You've successfully automated client onboarding and achieved perfect performance metrics.";
    } else if (score === 80) {
      grade = "GOOD STATUS";
      color = "var(--lime)";
      reco = "Your site is in good shape, but there is still room to optimize features or improve loading speeds. Let's make it fully bulletproof.";
    } else if (score === 60) {
      grade = "NEEDS TUNING";
      color = "var(--coral)";
      reco = "Your site works, but you have key bottlenecks in speed, SEO, or client booking automation. A focused Website Refresh will quickly resolve these.";
    } else if (score === 40) {
      grade = "NEEDS REBUILD";
      color = "var(--coral)";
      reco = "Your site is holding your business back. Outdated templates and lack of automation mean you are actively losing prospective clients. We recommend a full custom redesign.";
    }

    if (scoreValEl) {
      scoreValEl.textContent = `${score}%`;
      scoreValEl.style.color = color;
    }
    if (gradeEl) {
      gradeEl.textContent = grade;
      gradeEl.style.color = color;
    }
    if (recoEl) recoEl.textContent = reco;
  }

  // Update audit score on radio option changes
  qa('input[type="radio"]', auditForm).forEach(radio => {
    radio.addEventListener('change', updateAuditScore);
  });
  
  updateAuditScore(); // Initialize
}