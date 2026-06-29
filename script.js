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
q('#contact-form').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.currentTarget),subject=encodeURIComponent('DreamSites project inquiry — '+d.get('service')),body=encodeURIComponent('Name: '+d.get('name')+'\nEmail: '+d.get('email')+'\nService: '+d.get('service')+'\n\nAbout the project:\n'+d.get('message'));q('.form-status').textContent='Opening your email app and redirecting…';window.location.href='mailto:hello@dreamsites.pro?subject='+subject+'&body='+body;setTimeout(()=>{window.location.href='thanks.html'},1200)});
let lastScroll=0;window.addEventListener('scroll',()=>{const currentScroll=window.pageYOffset||document.documentElement.scrollTop,nav=q('.nav');if(!nav)return;const menuExpanded=q('.menu')&&q('.menu').getAttribute('aria-expanded')==='true';if(menuExpanded)return;if(currentScroll<=0){nav.classList.remove('nav-hidden');return}if(currentScroll>lastScroll&&currentScroll>120&&!nav.classList.contains('nav-hidden')){nav.classList.add('nav-hidden')}else if(currentScroll<lastScroll&&nav.classList.contains('nav-hidden')){nav.classList.remove('nav-hidden')}lastScroll=currentScroll});