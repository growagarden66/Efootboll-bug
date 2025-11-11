/* script.js - eFootboll Bug (SPA) 
   Tudo local: storage, login, IA offline, fórum, ranking, achievements, theme.
*/

/* ================== CONFIG / DATA ================== */

/* Usuários iniciais (seed) */
const INITIAL_USERS = {
  'davi': { user:'Davi', display:'Davi', passPlain:'davi2025' },
  'otto': { user:'Otto', display:'Otto', passPlain:'otto777' },
  'antheos': { user:'Antheos', display:'Antheos', passPlain:'antheos999' },
  'arthur': { user:'Arthur', display:'Arthur', passPlain:'arthur555' }
};

/* Curiosidades (editáveis) */
const curiosidades = [
  "O primeiro jogo com regras organizadas aconteceu em 1863, na Inglaterra.",
  "O maior público num jogo oficial foi de mais de 199.000 espectadores.",
  "Messi e Maradona são lendas do futebol argentino.",
  "eFootball e FIFA são franquias populares que evoluíram muito em mecânica."
];

/* Notícias (manual) */
const newsData = [
  { title: "Patch de balanceamento lançado", date:"2025-11-09", text:"Correções e ajustes em modos online." },
  { title: "Evento: Campeonato Digital", date:"2025-11-01", text:"Torneio teste em dezembro com prêmios." }
];

/* Updates log */
const updatesData = [
  { ver:"v2.0", date:"2025-11-12", text:"Sistema completo: login, IA offline, fórum, ranking, conquistas." },
  { ver:"v1.1", date:"2025-11-10", text:"Login real, suporte IA local, termos e UI neon." }
];

/* Storage keys */
const KEYS = {
  USERS: 'efb_users_v2',
  SESSION: 'efb_session_v2',
  FORUM: 'efb_forum_v2'
};

/* ================== UTIL / STORAGE ================== */

/* Hash helper (simple hash for offline) */
async function hashString(str){
  if(window.crypto && crypto.subtle){
    const enc = new TextEncoder();
    const data = enc.encode(str);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
  } else {
    // fallback simple (not cryptographically secure)
    let h = 2166136261;
    for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); }
    return (h>>>0).toString(16);
  }
}

function loadUsers(){
  try { return JSON.parse(localStorage.getItem(KEYS.USERS) || '{}'); }
  catch(e){ return {}; }
}
function saveUsers(obj){ localStorage.setItem(KEYS.USERS, JSON.stringify(obj)); }
function ensureSeedUsers(){
  const users = loadUsers();
  let changed = false;
  for(const k in INITIAL_USERS){
    if(!users[k]){
      const o = INITIAL_USERS[k];
      // create user with hashed password (store hash)
      hashString(o.passPlain).then(h=>{
        const cur = loadUsers();
        cur[k] = { user:o.user, display:o.display, passHash:h, points:0, achievements:[] };
        saveUsers(cur);
      });
      changed = true;
    }
  }
  return changed;
}

/* Session helpers */
function setSession(key){ localStorage.setItem(KEYS.SESSION, key); }
function getSession(){ return localStorage.getItem(KEYS.SESSION); }
function clearSession(){ localStorage.removeItem(KEYS.SESSION); }

/* Forum */
function loadForum(){ return JSON.parse(localStorage.getItem(KEYS.FORUM) || '[]'); }
function saveForum(arr){ localStorage.setItem(KEYS.FORUM, JSON.stringify(arr)); }

/* ================== UI / NAV ================== */

/* Pages nav */
document.querySelectorAll('.nav-btn').forEach(b=>{
  b.addEventListener('click', ()=> {
    document.querySelectorAll('.nav-btn').forEach(n=>n.classList.remove('active'));
    b.classList.add('active');
    showPage(b.dataset.target);
  });
});

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
}

/* Quick actions */
document.getElementById('btnMessi')?.addEventListener('click', ()=> window.open('https://pt.wikipedia.org/wiki/Lionel_Messi','_blank'));
document.getElementById('btnCurioQuick')?.addEventListener('click', showRandomCurio);
document.getElementById('newCurio')?.addEventListener('click', ()=> {
  showRandomCurio();
  // reward points to logged user
  const cur = currentUser();
  if(cur) addPoints(cur._key, 5);
});

/* Render curiosidade */
function showRandomCurio(){
  const idx = Math.floor(Math.random()*curiosidades.length);
  const box = document.getElementById('curioBox');
  const quick = document.getElementById('quickCurio');
  if(box){ box.textContent = curiosidades[idx]; box.classList.remove('hidden'); }
  if(quick){ quick.textContent = curiosidades[idx]; quick.classList.remove('hidden'); }
}

/* Render news */
function renderNews(){
  const root = document.getElementById('newsList'); if(!root) return;
  root.innerHTML = '';
  newsData.forEach(n=>{
    const div = document.createElement('div'); div.className = 'card';
    div.innerHTML = `<h4>${n.title}</h4><small>${n.date}</small><p>${n.text}</p>`;
    root.appendChild(div);
  });
}

/* Render updates */
function renderUpdates(){
  const root = document.getElementById('updateList'); if(!root) return;
  root.innerHTML = '';
  updatesData.forEach(u=>{
    const li = document.createElement('li');
    li.innerHTML = `<strong>${u.ver}</strong> — <em>${u.date}</em>: ${u.text}`;
    root.appendChild(li);
  });
}

/* Forum render */
function renderForum(){
  const root = document.getElementById('forumList'); if(!root) return;
  const posts = loadForum();
  root.innerHTML = '';
  posts.forEach(p=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<small>${new Date(p.when).toLocaleString()}</small><p><b>${escapeHtml(p.author)}:</b> ${escapeHtml(p.text)}</p>`;
    root.appendChild(card);
  });
}

/* forum post */
document.getElementById('forumPost')?.addEventListener('click', ()=>{
  const txt = document.getElementById('forumText').value.trim();
  const cur = currentUser();
  if(!cur){ alert('Faça login para postar no fórum.'); return; }
  if(!txt){ alert('Digite uma mensagem.'); return; }
  const posts = loadForum();
  posts.unshift({ id:Date.now(), author:cur.display||cur.user, text:txt, when:new Date().toISOString() });
  saveForum(posts);
  document.getElementById('forumText').value = '';
  renderForum();
  addPoints(cur._key,10); // reward
});

/* forum refresh */
document.getElementById('forumRefresh')?.addEventListener('click', renderForum);

/* ================== AUTH: register / login / profile ================== */

/* Check seed users and populate their hashed passwords */
ensureSeedUsers();

/* Register */
document.getElementById('registerOpen')?.addEventListener('click', ()=> {
  document.getElementById('registerModal').classList.remove('hidden');
  document.getElementById('regMsg').textContent = '';
});
document.getElementById('regCancel')?.addEventListener('click', ()=> document.getElementById('registerModal').classList.add('hidden'));

document.getElementById('regCreate')?.addEventListener('click', async ()=>{
  const u = (document.getElementById('regUser')?.value||'').trim();
  const d = (document.getElementById('regDisplay')?.value||'').trim();
  const p = (document.getElementById('regPass')?.value||'');
  const msgEl = document.getElementById('regMsg');
  if(!u || !p){ msgEl.textContent='Preencha usuário e senha.'; msgEl.style.color='#ff8b8b'; return; }
  const users = loadUsers();
  if(users[u.toLowerCase()]){ msgEl.textContent='Nome já em uso.'; msgEl.style.color='#ff8b8b'; return; }
  const h = await hashString(p);
  users[u.toLowerCase()] = { user:u, display: d || u, passHash:h, points:0, achievements:[] };
  saveUsers(users);
  msgEl.textContent='Conta criada! Faça login.'; msgEl.style.color='#9df7c7';
  setTimeout(()=> { document.getElementById('registerModal').classList.add('hidden'); }, 900);
});

/* Modal login handlers */
document.getElementById('loginOpen')?.addEventListener('click', ()=> {
  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('modalMsg').textContent = '';
});
document.getElementById('modalClose')?.addEventListener('click', ()=> document.getElementById('loginModal').classList.add('hidden'));

/* modal login button */
document.getElementById('modalLoginBtn')?.addEventListener('click', async ()=>{
  const user = (document.getElementById('modalUser')?.value||'').trim();
  const pass = (document.getElementById('modalPass')?.value||'');
  const msg = document.getElementById('modalMsg');
  if(!user || !pass){ msg.textContent='Preencha usuário e senha.'; msg.style.color='#ff8b8b'; return; }
  const users = loadUsers();
  const k = user.toLowerCase();
  if(!users[k]){ msg.textContent='Usuário não encontrado.'; msg.style.color='#ff8b8b'; return; }
  const h = await hashString(pass);
  if(h !== users[k].passHash){ msg.textContent='Senha incorreta.'; msg.style.color='#ff8b8b'; return; }
  // success
  setSession(k);
  msg.textContent = `✅ Bem-vindo, ${users[k].display || users[k].user}!`;
  msg.style.color = '#9df7c7';
  setTimeout(()=> {
    document.getElementById('loginModal').classList.add('hidden');
    refreshAuthUI();
    // open loading in new tab and it will redirect to home
    window.open('loading.html','_blank');
  }, 700);
});

/* dedicated login page (if present) - kept compatible */
document.getElementById('loginBtn')?.addEventListener('click', async ()=>{
  const inUser = document.getElementById('username');
  const inPass = document.getElementById('password');
  const outMsg = document.getElementById('errorMsg') || document.getElementById('loginMsg') || document.getElementById('msg');
  if(!inUser || !inPass) return;
  const u = (inUser.value||'').trim(), p = inPass.value||'';
  const users = loadUsers(); const k = u.toLowerCase();
  if(!users[k]){ if(outMsg){ outMsg.textContent='Usuário não encontrado.'; outMsg.style.color='#ff7b7b'; } return; }
  const h = await hashString(p);
  if(h !== users[k].passHash){ if(outMsg){ outMsg.textContent='Senha incorreta.'; outMsg.style.color='#ff7b7b'; } return; }
  setSession(k);
  if(outMsg){ outMsg.textContent=`✅ Bem-vindo, ${users[k].display||users[k].user}!`; outMsg.style.color='#9df7c7'; }
  setTimeout(()=> window.location.href='loading.html', 900);
});

/* Logout / Profile UI */
document.getElementById('logoutBtn')?.addEventListener('click', ()=> { clearSession(); refreshAuthUI(); });
document.getElementById('profileBtn')?.addEventListener('click', ()=> {
  const user = currentUser(); if(!user) return; alert(`Perfil\nUsuário: ${user.user}\nNome: ${user.display}\nPontos: ${user.points}\nConquistas: ${user.achievements.join(', ') || 'Nenhuma'}`);
});

/* current user helper */
function currentUser(){
  const s = getSession(); if(!s) return null;
  const users = loadUsers(); if(!users[s]) return null;
  return Object.assign({_key:s}, users[s]);
}

/* update auth UI */
function refreshAuthUI(){
  const cur = currentUser();
  const profileBtn = document.getElementById('profileBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginOpen = document.getElementById('loginOpen');
  const registerOpen = document.getElementById('registerOpen');
  if(cur){
    profileBtn.classList.remove('hidden'); profileBtn.textContent = cur.display || cur.user;
    logoutBtn.classList.remove('hidden');
    loginOpen.classList.add('hidden'); registerOpen.classList.add('hidden');
    // fill profile panel
    document.getElementById('profilePanel')?.classList.remove('hidden');
    document.getElementById('pfName').textContent = `Nome: ${cur.display}`;
    document.getElementById('pfUser').textContent = `Usuário: ${cur.user}`;
    document.getElementById('pfPoints').textContent = `Pontos: ${cur.points || 0}`;
    document.getElementById('pfAch').textContent = `Conquistas: ${ (cur.achievements && cur.achievements.length) || 0 }`;
  } else {
    profileBtn.classList.add('hidden'); logoutBtn.classList.add('hidden');
    loginOpen.classList.remove('hidden'); registerOpen.classList.remove('hidden');
    document.getElementById('profilePanel')?.classList.add('hidden');
  }
}

/* ================== POINTS / ACHIEVEMENTS / RANKING ================== */
function saveUserObject(key, obj){
  const users = loadUsers(); users[key] = obj; saveUsers(users);
}
function addPoints(key, pts){
  const users = loadUsers(); if(!users[key]) return false;
  users[key].points = (users[key].points||0) + pts; saveUsers(users); if(getSession()===key) refreshAuthUI(); return true;
}
function addAchievement(key, ach){
  const users = loadUsers(); if(!users[key]) return false;
  users[key].achievements = users[key].achievements || [];
  if(!users[key].achievements.includes(ach)){ users[key].achievements.push(ach); saveUsers(users); if(getSession()===key) refreshAuthUI(); return true; }
  return false;
}

/* ranking render (top 5) */
function renderRanking(){
  const root = document.getElementById('rankingBox'); if(!root) return;
  const users = Object.values(loadUsers() || {});
  users.sort((a,b)=> (b.points||0) - (a.points||0));
  const list = users.slice(0,5);
  root.innerHTML = list.map(u=>`<div><b>${escapeHtml(u.display||u.user)}</b> — ${u.points||0} pts</div>`).join('') || '<div>Nenhum usuário registrado.</div>';
}

/* ================== AI: advanced offline features ================== */

/* Helpers for AI features */
function generateTactic(formation='4-3-3'){
  const parts = formation.split('-').map(n=>parseInt(n)||0);
  let s = `Formação ${formation}: ${parts[0]||4} defesa, ${parts[1]||3} meio, ${parts[2]||3} ataque. `;
  const dicas = ['Pressão alta', 'Laterais ofensivos', 'Marcação por zona', 'Trocas rápidas de ala'];
  s += 'Sugestão: ' + dicas[Math.floor(Math.random()*dicas.length)];
  return s;
}

function commentMatch(a,b,teams=''){
  const score = `${a} x ${b}`;
  let out = `Resultado: ${score}. `;
  if(a>b) out += 'Vitória dominante do primeiro time.';
  else if(a<b) out += 'Virada ou vitória do segundo time.';
  else out += 'Empate acirrado. ';
  if(teams) out += ` Equipes: ${teams}.`;
  out += ' Resumo: ritmo alto, destaque para a finalização.';
  return out;
}

function detectPromisingPlayer(){
  const nomes = ['Lucas Silva','Mateus Costa','Rafael Gomes','Pedro Alves','Thiago Rocha'];
  const n = nomes[Math.floor(Math.random()*nomes.length)];
  const score = Math.floor(70 + Math.random()*30);
  return `Detectei ${n} (índice: ${score}/100). Recomenda-se observação.`;
}

function generateTeamNames(seed){
  const seeds = ['Neon','Lobos','Tigers','Kings','Celestials','Vortex'];
  const base = seed ? seed.split(/\s+/)[0] : seeds[Math.floor(Math.random()*seeds.length)];
  const endings = ['FC','United','Crew','Legion','Squad'];
  return `${base} ${endings[Math.floor(Math.random()*endings.length)]}`;
}

function analyzeProfile(userObj){
  const pts = userObj.points || 0;
  let level = 'Bronze';
  if(pts>100) level='Prata';
  if(pts>300) level='Ouro';
  if(pts>700) level='Lenda';
  return `Perfil de ${userObj.display||userObj.user}: Nível ${level} — ${pts} pontos.`;
}

/* Chat reply generator */
function generateAIReplyAdvanced(msg){
  const m = msg.toLowerCase();
  if(m.includes('tática') || m.includes('formação') || m.includes('formacao')) {
    const match = m.match(/(\d-\d-\d)/) || m.match(/(\d:\d:\d)/);
    const formation = match ? match[0].replace(':','-') : '4-3-3';
    return generateTactic(formation);
  }
  if(m.startsWith('comentar') || m.includes('comente')) {
    const rx = m.match(/(\d+)\s*[x×]\s*(\d+)\s*(.*)/);
    if(rx){ return commentMatch(parseInt(rx[1]), parseInt(rx[2]), rx[3] || ''); }
    return 'Formato para comentar: "comentar 3x2 Brasil Argentina"';
  }
  if(m.includes('detector') || m.includes('promissor')) return detectPromisingPlayer();
  if(m.includes('nome de time') || m.includes('criar nome')) return generateTeamNames(m.split(' ')[0]||'Neon');
  if(m.includes('analisar perfil') || m.includes('meu perfil')){
    const cur = currentUser(); if(!cur) return 'Faça login para eu analisar seu perfil.'; return analyzeProfile(cur);
  }
  if(m.includes('o que é efootboll')) return 'O eFootboll Bug é um projeto digital criado por Antheos para o mundo do futebol virtual. ⚽';
  if(m.includes('quem criou')) return 'O criador do eFootboll Bug é Antheos.';
  if(m.includes('olá') || m.includes('oi')) return 'Olá! 👋 Em que posso ajudar?';
  if(m.includes('curiosidade')) { showRandomCurio(); return 'Mostrei uma curiosidade na seção Curiosidades!'; }
  if(m.includes('notícia')||m.includes('noticias')) return 'Veja a aba Notícias — atualize o conteúdo manualmente no script.';
  if(m.includes('moderador')||m.includes('moderar')) return 'Modo moderador: mensagens com palavrões são bloqueadas automaticamente.';
  return 'Desculpe, ainda estou aprendendo. Tente: "Tática 4-3-3", "Comentar 2x1 timeA timeB", "Detector", "Gerar nome de time".';
}

/* ================== CHAT UI INTEGRATION ================== */

function escapeHtml(s){ return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function addChatMessage(sender, text, cls='ai', temp=false){
  const box = document.getElementById('chatMessages');
  if(!box) return;
  const div = document.createElement('div'); div.className = 'chat-msg ' + (cls==='user' ? 'user' : 'ai');
  if(temp) div.dataset.temp = '1';
  div.innerHTML = `<b>${escapeHtml(sender)}:</b> ${escapeHtml(text)}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

document.getElementById('chatOpen')?.addEventListener('click', ()=>{
  document.getElementById('chatWidget')?.classList.remove('hidden');
  document.getElementById('chatOpen')?.classList.add('hidden');
});
document.getElementById('chatClose')?.addEventListener('click', ()=>{
  document.getElementById('chatWidget')?.classList.add('hidden');
  document.getElementById('chatOpen')?.classList.remove('hidden');
});
document.getElementById('chatSend')?.addEventListener('click', handleChatSendIntegrated);
document.getElementById('chatInput')?.addEventListener('keypress', e=> { if(e.key==='Enter') handleChatSendIntegrated(); });

function handleChatSendIntegrated(){
  const input = document.getElementById('chatInput'); if(!input) return;
  const text = input.value.trim(); if(!text) return;
  addChatMessage('Você', text, 'user');
  input.value = '';
  addChatMessage('IA', 'digitando...', 'ai', true);
  setTimeout(()=>{
    const msgs = document.querySelectorAll('#chatMessages .chat-msg'); if(msgs.length){ const last = msgs[msgs.length-1]; if(last && last.dataset && last.dataset.temp==='1') last.remove(); }
    const reply = generateAIReplyAdvanced(text);
    addChatMessage('IA', reply, 'ai');
    // reward small points for interacting
    const cur = currentUser(); if(cur) addPoints(cur._key, 2);
  }, 700);
}

/* ================== MODERATION (simple) ================== */
const bannedWords = ['palavrão1','palavrão2']; // substitua por palavras reais se quiser
function moderateText(s){
  const low = s.toLowerCase();
  for(const b of bannedWords){ if(b && low.includes(b)) return false; }
  return true;
}

/* ================== THEME toggle ================== */
document.getElementById('themeToggle')?.addEventListener('click', ()=>{
  const body = document.body;
  if(body.classList.contains('theme-light')){ body.classList.remove('theme-light'); localStorage.setItem('efb_theme','dark'); }
  else { body.classList.add('theme-light'); localStorage.setItem('efb_theme','light'); }
});
if(localStorage.getItem('efb_theme')==='light') document.body.classList.add('theme-light');

/* ================== DEV PANEL (5 clicks bottom-left) ================== */
let devClicks = 0;
document.addEventListener('click', e=> {
  if(e.clientX < 120 && e.clientY > (window.innerHeight - 120)){ devClicks++; if(devClicks>=5){ document.getElementById('devPanel')?.classList.remove('hidden'); devClicks=0; } }
});
document.getElementById('devClose')?.addEventListener('click', ()=> document.getElementById('devPanel')?.classList.add('hidden'));
document.getElementById('devClearUsers')?.addEventListener('click', ()=> { if(confirm('A
