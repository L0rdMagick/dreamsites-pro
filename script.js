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

// Synchronized Wheel Scroll inside Slider
const baSlider = q('.ba-slider');
if (baSlider) {
  const images = qa('.ba-image');
  let scrollPos = 0;
  
  const imgObj = new Image();
  imgObj.src = 'images/slider-after.png';
  imgObj.onload = () => {
    const naturalWidth = imgObj.naturalWidth || 1200;
    const naturalHeight = imgObj.naturalHeight || 2000;
    const imageRatio = naturalWidth / naturalHeight;
    
    baSlider.addEventListener('wheel', (eEvent) => {
      const currentWidth = baSlider.offsetWidth;
      const currentHeight = baSlider.offsetHeight;
      const scaledImgHeight = currentWidth / imageRatio;
      const maxScroll = Math.max(0, scaledImgHeight - currentHeight);
      
      if (maxScroll <= 0) return;
      
      if ((eEvent.deltaY > 0 && scrollPos < maxScroll) || (eEvent.deltaY < 0 && scrollPos > 0)) {
        eEvent.preventDefault();
        scrollPos = Math.max(0, Math.min(maxScroll, scrollPos + eEvent.deltaY * 0.6));
        
        images.forEach(img => {
          img.style.backgroundPositionY = `-${scrollPos}px`;
        });
      }
    }, { passive: false });
  };
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

    const score = Math.round((yesCount / auditQGroups.length) * 100);
    const scoreValEl = q('#audit-score-val');
    const gradeEl = q('#audit-grade');
    const recoEl = q('#audit-reco');

    let grade = "CRITICAL AUDIT";
    let color = "var(--coral)";
    let reco = "Your website has major bottlenecks. It is failing to convert traffic and hurting your Google credibility. We highly recommend a clean modern rebuild.";

    if (score === 100) {
      grade = "PERFECT STATUS";
      color = "var(--lime)";
      reco = "Your website is in excellent health! You've successfully automated client onboarding and achieved perfect performance metrics.";
    } else if (score >= 75) {
      grade = "GOOD STATUS";
      color = "var(--lime)";
      reco = "Your site is in good shape, but there is still room to optimize features or improve loading speeds. Let's make it fully bulletproof.";
    } else if (score >= 50) {
      grade = "NEEDS TUNING";
      color = "var(--coral)";
      reco = "Your site works, but you have key bottlenecks in speed, SEO, interactive conversion tools, or booking automation. A focused Website Refresh will quickly resolve these.";
    } else if (score >= 25) {
      grade = "NEEDS REBUILD";
      color = "var(--coral)";
      reco = "Your site is holding your business back. Outdated templates, lack of modern visuals, and lack of interactive features mean you are actively losing prospective clients.";
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

/* ==========================================================================
   APPS DROPDOWN AND LANDSCAPING CALCULATOR SCRIPTS
   ========================================================================== */

// Close desktop dropdown when clicking outside
document.addEventListener('click', (e) => {
  const openTrigger = q('.nav-dropdown-trigger[aria-expanded="true"]');
  if (openTrigger && !e.target.closest('.nav-dropdown')) {
    openTrigger.setAttribute('aria-expanded', 'false');
  }
});

// Mobile dropdown toggle inside mobile-menu
qa('.mobile-dropdown-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropdown = trigger.closest('.mobile-dropdown');
    const isOpen = dropdown.classList.contains('open');
    
    // Toggle active state
    dropdown.classList.toggle('open', !isOpen);
    trigger.setAttribute('aria-expanded', String(!isOpen));
  });
});

// Landscaping Calculator Wizard Logic
(function() {
  const calc = q('#yard-calculator');
  if (!calc) return;

  const serviceBasePrices = {
    mowing: { small: [45, 65], medium: [65, 95], large: [95, 150], xl: [150, 250] },
    cleanup: { small: [150, 250], medium: [250, 450], large: [450, 750], xl: [750, 1000] },
    mulch: { small: [250, 450], medium: [450, 850], large: [850, 1500], xl: null }, // null means Custom Quote
    sod: { small: [800, 1500], medium: [1500, 4000], large: [4000, 8000], xl: null },
    hedge: { small: [100, 200], medium: [200, 400], large: [400, 700], xl: null },
    leaf: { small: [100, 175], medium: [175, 350], large: [350, 600], xl: [600, 900] },
    flowerbed: { small: [150, 300], medium: [300, 600], large: [600, 1000], xl: null },
    landscape: { small: [750, 1500], medium: [1500, 4000], large: [4000, 10000], xl: null },
    irrigation: { small: [95, 175], medium: [95, 175], large: [95, 175], xl: [95, 175] }, // base range flat
    tree: { small: [150, 300], medium: [300, 600], large: [600, 1200], xl: null }
  };

  const conditionMultipliers = {
    well: 1.0,
    light: 1.15,
    very: 1.30,
    major: 1.50,
    unsure: 1.0
  };

  const accessMultipliers = {
    yes: 1.0,
    somewhat: 1.0,
    no: 1.15
  };

  const addonPrices = {
    clippings: { small: [15, 25], medium: [25, 35], large: [35, 50], xl: [50, 75] },
    haul: { small: [75, 100], medium: [120, 150], large: [180, 220], xl: [250, 300] },
    weeds: { small: [40, 60], medium: [60, 90], large: [90, 150], xl: [150, 250] },
    fert: { small: [50, 70], medium: [70, 100], large: [100, 150], xl: [150, 220] },
    edging: { small: [25, 35], medium: [35, 50], large: [50, 80], xl: [80, 120] },
    cleanup: { small: [100, 150], medium: [150, 250], large: [250, 400], xl: [400, 600] },
    mulch: { small: [150, 220], medium: [220, 350], large: [350, 600], xl: [600, 900] },
    pressure: { small: [100, 150], medium: [150, 250], large: [250, 450], xl: [450, 700] },
    irrigation: { small: [50, 75], medium: [75, 110], large: [110, 160], xl: [160, 220] }
  };

  let currentStep = 0;
  const steps = qa('.calc-step', calc);
  const progressBar = q('.calc-progress-bar-fill', calc);
  const progressText = q('#progress-step-text', calc);
  const btnPrev = q('.btn-prev', calc);
  const btnNext = q('.btn-next', calc);
  const btnSubmit = q('.btn-submit', calc);
  const errorMsg = q('.calc-error-msg', calc);
  const fileInput = q('#photo-file-input', calc);
  const uploadZone = q('#photo-upload-zone', calc);
  const fileTagContainer = q('#uploaded-files', calc);
  
  let formData = {
    service: '',
    size: '',
    sqft: '',
    condition: '',
    access: '',
    accessNotes: '',
    frequency: '',
    addons: [],
    name: '',
    phone: '',
    email: '',
    address: '',
    contactMethod: 'Email',
    serviceDate: '',
    photos: [], // contains { name, base64 }
    notes: ''
  };

  // Option select handlers
  qa('.option-card[data-service]').forEach(card => {
    card.addEventListener('click', () => {
      qa('.option-card[data-service]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      formData.service = card.dataset.service;
      btnNext.disabled = false;
    });
  });

  qa('.option-card[data-size]').forEach(card => {
    card.addEventListener('click', () => {
      qa('.option-card[data-size]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      formData.size = card.dataset.size;
      btnNext.disabled = false;
    });
  });

  // exact sqft handler
  const sqftInput = q('#exact-sqft');
  if (sqftInput) {
    sqftInput.addEventListener('input', () => {
      const val = parseInt(sqftInput.value.trim(), 10);
      if (!isNaN(val) && val > 0) {
        formData.sqft = val;
        // auto select size card
        let sizeCode = 'small';
        if (val >= 15000) sizeCode = 'xl';
        else if (val >= 7500) sizeCode = 'large';
        else if (val >= 2500) sizeCode = 'medium';
        
        qa('.option-card[data-size]').forEach(c => {
          if (c.dataset.size === sizeCode) {
            c.classList.add('selected');
            formData.size = sizeCode;
          } else {
            c.classList.remove('selected');
          }
        });
        btnNext.disabled = false;
      } else {
        formData.sqft = '';
      }
    });
  }

  qa('.option-card[data-condition]').forEach(card => {
    card.addEventListener('click', () => {
      qa('.option-card[data-condition]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      formData.condition = card.dataset.condition;
      btnNext.disabled = false;
    });
  });

  qa('.option-card[data-access]').forEach(card => {
    card.addEventListener('click', () => {
      qa('.option-card[data-access]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      formData.access = card.dataset.access;
      btnNext.disabled = false;
    });
  });

  qa('.option-card[data-frequency]').forEach(card => {
    card.addEventListener('click', () => {
      qa('.option-card[data-frequency]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      formData.frequency = card.dataset.frequency;
      btnNext.disabled = false;
    });
  });

  // Addon list multiple selection
  qa('.addon-item[data-addon]').forEach(item => {
    item.addEventListener('click', () => {
      const addon = item.dataset.addon;
      item.classList.toggle('selected');
      if (item.classList.contains('selected')) {
        if (!formData.addons.includes(addon)) formData.addons.push(addon);
      } else {
        formData.addons = formData.addons.filter(a => a !== addon);
      }
    });
  });

  // Photo uploading drag-and-drop
  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    });
    
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        handleFiles(fileInput.files);
      }
    });
  }

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        showError("Only image files are allowed.");
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        formData.photos.push({
          name: file.name,
          base64: reader.result
        });
        renderFileTags();
      };
    });
  }

  function renderFileTags() {
    if (!fileTagContainer) return;
    fileTagContainer.innerHTML = '';
    formData.photos.forEach((photo, idx) => {
      const tag = document.createElement('div');
      tag.className = 'uploaded-file-tag';
      tag.innerHTML = `
        <span>📸 ${photo.name}</span>
        <button class="uploaded-file-remove" type="button" data-index="${idx}">×</button>
      `;
      fileTagContainer.appendChild(tag);
    });
    
    // Add remove handlers
    qa('.uploaded-file-remove', fileTagContainer).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index, 10);
        formData.photos.splice(idx, 1);
        renderFileTags();
      });
    });
  }

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    }
  }

  function clearError() {
    if (errorMsg) {
      errorMsg.style.display = 'none';
    }
  }

  // Check validation for current step
  function validateStep(stepIdx) {
    clearError();
    if (stepIdx === 0 && !formData.service) {
      showError("Please select a service type.");
      return false;
    }
    if (stepIdx === 1 && !formData.size) {
      showError("Please select a property size or enter exact square footage.");
      return false;
    }
    if (stepIdx === 2 && !formData.condition) {
      showError("Please select the current yard condition.");
      return false;
    }
    if (stepIdx === 3 && !formData.access) {
      showError("Please select the access complexity.");
      return false;
    }
    if (stepIdx === 4 && !formData.frequency) {
      showError("Please select the service frequency.");
      return false;
    }
    if (stepIdx === 6) {
      // Step 7 (index 6): contact form validation
      const name = q('#cust-name').value.trim();
      const phone = q('#cust-phone').value.trim();
      const email = q('#cust-email').value.trim();
      const address = q('#cust-address').value.trim();
      const contactMethod = q('#contact-method').value;
      const serviceDate = q('#service-date').value;
      const notes = q('#special-notes').value.trim();
      
      if (!name || !phone || !email || !address) {
        showError("Please fill out all required fields (Name, Phone, Email, Address).");
        return false;
      }
      
      formData.name = name;
      formData.phone = phone;
      formData.email = email;
      formData.address = address;
      formData.contactMethod = contactMethod;
      formData.serviceDate = serviceDate;
      formData.notes = notes;
    }
    return true;
  }

  function updateStepView() {
    steps.forEach((step, idx) => {
      step.classList.toggle('active', idx === currentStep);
    });

    // Update progress bar
    const percent = ((currentStep + 1) / steps.length) * 100;
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `Step ${currentStep + 1} of ${steps.length}`;

    // Manage buttons
    if (currentStep === 0) {
      if (btnPrev) btnPrev.style.visibility = 'hidden';
    } else {
      if (btnPrev) btnPrev.style.visibility = 'visible';
    }

    if (currentStep === steps.length - 1) {
      if (btnNext) btnNext.style.display = 'none';
      if (btnSubmit) btnSubmit.style.display = 'inline-flex';
    } else {
      if (btnNext) btnNext.style.display = 'inline-flex';
      if (btnSubmit) btnSubmit.style.display = 'none';
      
      // Auto enable/disable based on choices
      let isStepCompleted = false;
      if (currentStep === 0 && formData.service) isStepCompleted = true;
      else if (currentStep === 1 && formData.size) isStepCompleted = true;
      else if (currentStep === 2 && formData.condition) isStepCompleted = true;
      else if (currentStep === 3 && formData.access) isStepCompleted = true;
      else if (currentStep === 4 && formData.frequency) isStepCompleted = true;
      else if (currentStep === 5) isStepCompleted = true; // Add-ons are optional
      
      if (btnNext) btnNext.disabled = !isStepCompleted;
    }
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        currentStep++;
        updateStepView();
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        updateStepView();
      }
    });
  }

  // Calculate pricing range
  function calculateEstimate() {
    const service = formData.service;
    const size = formData.size;
    
    const base = serviceBasePrices[service];
    if (!base) return { low: 0, high: 0, isCustom: true };
    
    const prices = base[size];
    if (!prices) return { low: 0, high: 0, isCustom: true }; // Custom quote if xl null
    
    let low = prices[0];
    let high = prices[1];
    
    // Multipliers
    const condMult = conditionMultipliers[formData.condition] || 1.0;
    const accessMult = accessMultipliers[formData.access] || 1.0;
    
    low *= condMult * accessMult;
    high *= condMult * accessMult;
    
    // Add-ons
    formData.addons.forEach(addonKey => {
      const addonBase = addonPrices[addonKey];
      if (addonBase) {
        const addonRange = addonBase[size] || addonBase['medium']; // fallback
        low += addonRange[0];
        high += addonRange[1];
      }
    });
    
    // Round to nearest $5
    low = Math.round(low / 5) * 5;
    high = Math.round(high / 5) * 5;
    
    return { low, high, isCustom: false };
  }

  // Form submission handler
  if (btnSubmit) {
    btnSubmit.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!validateStep(currentStep)) return;
      
      // Check honeypot spam protection
      const honeypot = q('#cust-honeypot', calc).value;
      if (honeypot) {
        console.warn("Honeypot filled, blocking submission.");
        showSuccessScreen({ low: 0, high: 0, isCustom: true });
        return;
      }
      
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Submitting Lead...";
      
      const pricing = calculateEstimate();
      formData.estimated_low = pricing.low;
      formData.estimated_high = pricing.high;
      formData.isCustom = pricing.isCustom;
      
      // Save accessNotes
      formData.accessNotes = q('#access-notes', calc).value.trim();
      
      try {
        await fetch('/api/landscaping-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        // Save submission to simulator localstorage
        const submissions = JSON.parse(localStorage.getItem('landscaping_leads') || '[]');
        submissions.push({
          ...formData,
          photosCount: formData.photos.length,
          photos: formData.photos.map(p => p.name), // save names only in logs to save space
          submission_date: new Date().toLocaleString()
        });
        localStorage.setItem('landscaping_leads', JSON.stringify(submissions));
        
        showSuccessScreen(pricing);
      } catch (err) {
        console.error("Submission failed:", err);
        showError("We encountered a network error. However, your estimate was calculated successfully below!");
        showSuccessScreen(pricing); // Still show estimate to preserve UX
      }
    });
  }

  function showSuccessScreen(pricing) {
    // Hide calculator wizard structure
    q('.calc-progress-container', calc).style.display = 'none';
    qa('.calc-step', calc).forEach(s => s.classList.remove('active'));
    q('.calc-nav-buttons', calc).style.display = 'none';
    
    // Show results step
    const resultStep = q('#calc-step-result', calc);
    resultStep.classList.add('active');
    
    // Render prices
    const rangeValEl = q('#price-range-value', resultStep);
    if (pricing.isCustom) {
      rangeValEl.textContent = "Custom Quote";
      rangeValEl.style.fontSize = "clamp(32px, 5vw, 56px)";
    } else {
      rangeValEl.textContent = `$${pricing.low} – $${pricing.high}`;
    }

    // Populate success lead summary on screen
    q('#sum-service').textContent = q('.option-card[data-service].selected .option-card-title').textContent;
    q('#sum-size').textContent = q('.option-card[data-size].selected .option-card-title').textContent + (formData.sqft ? ` (${formData.sqft} sq ft)` : '');
    q('#sum-condition').textContent = q('.option-card[data-condition].selected .option-card-title').textContent;
    q('#sum-frequency').textContent = q('.option-card[data-frequency].selected .option-card-title').textContent;
    q('#sum-estimate').textContent = pricing.isCustom ? "Custom Quote Required" : `$${pricing.low} – $${pricing.high}`;
    q('#sum-name').textContent = formData.name;
    q('#sum-phone').textContent = formData.phone;
    q('#sum-email').textContent = formData.email;
    q('#sum-address').textContent = formData.address;
    
    // Render leads simulation list if exists
    if (typeof renderSimulatedLeads === 'function') {
      renderSimulatedLeads();
    }
  }

  // Initialize
  updateStepView();
})();