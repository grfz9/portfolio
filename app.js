/* =====================================================================
   BK/OS — moteur du portfolio
   Billal Kaamouchi
   1. Utilitaires        5. Gestionnaire de fenêtres
   2. Démarrage          6. Applications
   3. Décor animé        7. Raccourcis clavier
   4. Animations page
   ===================================================================== */
(() => {
'use strict';

/* ---------- 1. Utilitaires ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const isMobile = () => window.matchMedia('(max-width:760px)').matches;
const reduced  = () => window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

const store = {
  get(k, d){ try { const v = localStorage.getItem('bkos.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v){ try { localStorage.setItem('bkos.' + k, JSON.stringify(v)); } catch {} }
};

const PROFILE = {
  mail:  'billalkaamouchi@gmail.com',
  tel:   '+33 7 71 17 91 24',
  ville: 'Sevran (93) · Île-de-France',
  cv:    'CV_Billal_KAAMOUCHI.pdf'
};

/* ---------- 2. Séquence de démarrage ---------- */
function boot(){
  const el = $('#boot'), log = $('#bootlog'), bar = $('#bootbar'), skip = $('#bootskip');
  if(!el) return;
  const seen = store.get('booted', false);
  const end = () => {
    el.classList.add('done');
    setTimeout(() => el.remove(), 600);
    store.set('booted', true);
  };
  if(seen || reduced()){ el.remove(); return; }

  const steps = [
    'init bkos kernel 2.6 ................ <b>ok</b>',
    'mount /home/billal .................. <b>ok</b>',
    'load profil: BTS SIO · SISR ......... <b>ok</b>',
    'check certifications cisco (2) ...... <b>ok</b>',
    'start window-manager ................ <b>ok</b>',
    'status stage 8 semaines ............. <b>ouvert</b>'
  ];
  let i = 0;
  const tick = () => {
    if(i >= steps.length){ setTimeout(end, 380); return; }
    log.insertAdjacentHTML('beforeend', `<div>${steps[i]}</div>`);
    bar.style.width = Math.round(((i + 1) / steps.length) * 100) + '%';
    i++;
    setTimeout(tick, 210);
  };
  setTimeout(tick, 250);
  el.addEventListener('click', end);
  skip.addEventListener('click', end);
}

/* ---------- 3. Décor animé : maillage réseau ---------- */
function networkBackground(){
  const cv = $('#bg-canvas');
  if(!cv || reduced()) return;
  const ctx = cv.getContext('2d');
  let w, h, nodes = [], raf = null;

  const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--c1').trim() || '#2ee6b6';

  function size(){
    w = cv.width  = window.innerWidth;
    h = cv.height = window.innerHeight;
    const count = Math.min(64, Math.round(w * h / 26000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
      r: Math.random() * 1.6 + .9
    }));
  }

  function frame(){
    ctx.clearRect(0, 0, w, h);
    const col = accent();
    for(const n of nodes){
      n.x += n.vx; n.y += n.vy;
      if(n.x < 0 || n.x > w) n.vx *= -1;
      if(n.y < 0 || n.y > h) n.vy *= -1;
    }
    ctx.lineWidth = 1;
    for(let i = 0; i < nodes.length; i++){
      for(let j = i + 1; j < nodes.length; j++){
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if(d < 138){
          ctx.strokeStyle = col;
          ctx.globalAlpha = (1 - d / 138) * .22;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = .55;
    ctx.fillStyle = col;
    for(const n of nodes){
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  size();
  frame();
  window.addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){ cancelAnimationFrame(raf); raf = null; }
    else if(!raf && !document.body.classList.contains('no-fx')) frame();
  });
}

function spotlight(){
  if(isMobile()) return;
  window.addEventListener('pointermove', (e) => {
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });
}

/* ---------- 4. Animations de page ---------- */
function revealOnScroll(){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(!en.isIntersecting) return;
      en.target.classList.add('visible');
      io.unobserve(en.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // décalage progressif des enfants d'un conteneur .stagger
  const so = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(!en.isIntersecting) return;
      Array.from(en.target.children).forEach((c, i) => { c.style.transitionDelay = (i * 85) + 'ms'; });
      en.target.classList.add('visible');
      so.unobserve(en.target);
    });
  }, { threshold: .1 });
  $$('.stagger').forEach(el => so.observe(el));
}

function animateMeters(){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(!en.isIntersecting) return;
      const i = en.target;
      setTimeout(() => { i.style.width = i.dataset.fill + '%'; }, 120);
      io.unobserve(i);
    });
  }, { threshold: .4 });
  $$('.meter-bar i[data-fill]').forEach(el => io.observe(el));
}

function animateCounters(){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(!en.isIntersecting) return;
      const el = en.target, target = +el.dataset.count;
      let cur = 0;
      const step = Math.max(1, Math.round(target / 22));
      const t = setInterval(() => {
        cur = Math.min(target, cur + step);
        el.textContent = cur;
        if(cur >= target) clearInterval(t);
      }, 45);
      io.unobserve(el);
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach(el => io.observe(el));
}

function typeRoles(){
  const el = $('#roletext');
  if(!el) return;
  const roles = [
    'Administrateur réseau en devenir',
    'Étudiant en cybersécurité',
    'Technicien systèmes & support',
    'Ethical Hacker certifié Cisco'
  ];
  if(reduced()){ el.textContent = roles[0]; return; }
  let r = 0, i = 0, deleting = false;
  (function tick(){
    const full = roles[r];
    i += deleting ? -1 : 1;
    el.innerHTML = esc(full.slice(0, i)).replace(/(réseau|cybersécurité|systèmes|Hacker)/, '<b>$1</b>');
    let delay = deleting ? 35 : 58;
    if(!deleting && i === full.length){ delay = 1700; deleting = true; }
    else if(deleting && i === 0){ deleting = false; r = (r + 1) % roles.length; delay = 320; }
    setTimeout(tick, delay);
  })();
}

function trackTabs(){
  $$('.track-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.track-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $$('.tl-panel').forEach(p => p.classList.remove('active'));
      $('#track-' + tab.dataset.track).classList.add('active');
    });
  });
}

function contactForm(){
  const f = $('#contact-form');
  if(!f) return;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#cf-name').value.trim();
    const subj = $('#cf-subject').value.trim() || 'Contact depuis le portfolio';
    const msg  = $('#cf-message').value.trim();
    const body = `${msg}\n\n— ${name}`;
    window.location.href = `mailto:${PROFILE.mail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  });
}

/* ---------- 5. Gestionnaire de fenêtres ---------- */
const WM = (() => {
  const layer   = $('#win-layer');
  const overlay = $('#win-overlay');
  const open = new Map();          // id -> { el, app, cleanup }
  let z = 100, cascade = 0;

  function syncDock(){
    $$('.dock-item').forEach(d => d.classList.toggle('running', open.has(d.dataset.app)));
    overlay.classList.toggle('show', isMobile() && open.size > 0);
  }

  function focus(id){
    const w = open.get(id);
    if(!w) return;
    w.el.style.zIndex = ++z;
    w.el.classList.remove('minimized');
  }

  function close(id){
    const w = open.get(id);
    if(!w) return;
    try { w.cleanup && w.cleanup(); } catch {}
    w.el.classList.add('closing');
    setTimeout(() => w.el.remove(), 200);
    open.delete(id);
    syncDock();
  }

  function place(el, width, height){
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(width, vw - 40);
    const h = Math.min(height, vh - 150);
    const off = (cascade++ % 5) * 30;
    el.style.width  = w + 'px';
    el.style.height = h + 'px';
    el.style.left   = Math.max(16, Math.round((vw - w) / 2) + off - 60) + 'px';
    el.style.top    = Math.max(74, Math.round((vh - h) / 2) + off - 40) + 'px';
  }

  function makeDraggable(el, handle){
    let sx, sy, sl, st, dragging = false;
    handle.addEventListener('pointerdown', (e) => {
      if(e.target.closest('.win__dots') || isMobile() || el.classList.contains('maximized')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      sl = el.offsetLeft; st = el.offsetTop;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if(!dragging) return;
      const nl = sl + (e.clientX - sx);
      const nt = st + (e.clientY - sy);
      el.style.left = Math.min(window.innerWidth - 80, Math.max(-el.offsetWidth + 110, nl)) + 'px';
      el.style.top  = Math.min(window.innerHeight - 60, Math.max(4, nt)) + 'px';
    });
    const stop = (e) => {
      if(!dragging) return;
      dragging = false;
      try { handle.releasePointerCapture(e.pointerId); } catch {}
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  function makeResizable(el, grip){
    let sx, sy, sw, sh, active = false;
    grip.addEventListener('pointerdown', (e) => {
      if(isMobile()) return;
      active = true; sx = e.clientX; sy = e.clientY;
      sw = el.offsetWidth; sh = el.offsetHeight;
      grip.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    grip.addEventListener('pointermove', (e) => {
      if(!active) return;
      el.style.width  = Math.max(290, sw + (e.clientX - sx)) + 'px';
      el.style.height = Math.max(180, sh + (e.clientY - sy)) + 'px';
      el.dispatchEvent(new CustomEvent('win:resize'));
    });
    const stop = (e) => { active = false; try { grip.releasePointerCapture(e.pointerId); } catch {} };
    grip.addEventListener('pointerup', stop);
    grip.addEventListener('pointercancel', stop);
  }

  function launch(id){
    if(open.has(id)){ focus(id); return open.get(id).el; }
    const app = APPS[id];
    if(!app) return null;
    const cfg = typeof app === 'function' ? app() : app;

    const el = document.createElement('section');
    el.className = 'win';
    el.dataset.win = id;   // pas « app » : réservé aux lanceurs, sinon tout clic dans la fenêtre la relance
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', cfg.title);
    if(cfg.accent) el.style.setProperty('--ac', cfg.accent);
    el.innerHTML = `
      <header class="win__bar">
        <div class="win__dots">
          <button class="wd-close" title="Fermer" aria-label="Fermer la fenêtre">✕</button>
          <button class="wd-min"   title="Réduire" aria-label="Réduire la fenêtre">–</button>
          <button class="wd-max"   title="Agrandir" aria-label="Agrandir la fenêtre">▢</button>
        </div>
        <div class="win__title">${cfg.icon || ''} <b>${esc(cfg.title)}</b></div>
        <div style="width:56px"></div>
      </header>
      <div class="win__body${cfg.flush ? ' flush' : ''}"></div>
      <div class="win__resize" title="Redimensionner"></div>`;

    place(el, cfg.w || 620, cfg.h || 480);
    el.style.zIndex = ++z;
    layer.appendChild(el);

    const body = $('.win__body', el);
    const cleanup = cfg.render(body, { close: () => close(id), el }) || null;
    open.set(id, { el, cleanup });

    $('.wd-close', el).addEventListener('click', () => close(id));
    $('.wd-min',   el).addEventListener('click', () => el.classList.add('minimized'));
    $('.wd-max',   el).addEventListener('click', () => {
      el.classList.toggle('maximized');
      el.dispatchEvent(new CustomEvent('win:resize'));
    });
    el.addEventListener('pointerdown', () => focus(id), true);
    makeDraggable(el, $('.win__bar', el));
    makeResizable(el, $('.win__resize', el));
    syncDock();
    return el;
  }

  overlay.addEventListener('click', () => { [...open.keys()].forEach(close); });
  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && open.size){
      const last = [...open.entries()].sort((a, b) => +b[1].el.style.zIndex - +a[1].el.style.zIndex)[0];
      if(last && !last[1].el.dataset.keepEsc) close(last[0]);
    }
  });

  return { launch, close, focus, isOpen: (id) => open.has(id) };
})();

/* ---------- 6. Applications ---------- */

/* --- 6.a Terminal --- */
function terminalApp(){
  return {
    title: 'billal@bkos: ~', icon: '▶_', w: 660, h: 440, flush: true, accent: 'var(--c1)',
    render(body){
      body.innerHTML = `
        <div class="term">
          <div class="term-body" id="t-body"></div>
          <div class="term-chips">
            ${['whoami','skills','projets','stage','ping 8.8.8.8','neofetch','help'].map(c =>
              `<button class="term-chip" data-cmd="${c}">${c}</button>`).join('')}
          </div>
          <div class="term-inrow">
            <span class="term-prompt"><span class="u">billal</span>@bkos:~$</span>
            <input id="t-input" type="text" autocomplete="off" spellcheck="false" aria-label="Ligne de commande">
          </div>
        </div>`;

      const out = $('#t-body', body), input = $('#t-input', body);
      const history = []; let hIdx = -1;

      const print = (html, cls = '') => {
        const d = document.createElement('div');
        d.className = 'term-line ' + cls;
        d.innerHTML = html;
        out.appendChild(d);
        out.scrollTop = out.scrollHeight;
      };
      const say = (html) => print(`<div class="term-out">${html}</div>`);

      const CMD = {
        // « jeu » n'est volontairement listé nulle part : c'est l'easter egg
        help: () => say(`commandes : ${Object.keys(CMD).concat(['ping','open','theme','echo'])
          .sort().map(c => `<b>${c}</b>`).join(' · ')}`),
        whoami: () => say(`<b>Billal Kaamouchi</b> — étudiant BTS SIO option SISR.<br>
          Objectif : administrateur réseau / analyste cybersécurité.<br>
          <span class="ok">●</span> disponible pour un stage de 8 semaines dès janvier 2027.`),
        skills: () => say(`<b>réseaux</b>    Windows Server · Active Directory · TCP/IP · VLAN · DHCP/DNS<br>
          <b>sécurité</b>   TryHackMe · ethical hacking · durcissement · pare-feu<br>
          <b>dev</b>        Java · SQL · HTML/CSS/JS · Git<br>
          <b>matériel</b>   montage PC · diagnostic · déploiement d'OS`),
        projets: () => say(`1. <b>Puissance 4 en Java</b> — POO, détection d'alignements → <i>open puissance4</i><br>
          2. <b>Site vitrine Wix Studio</b> — conception + mise en ligne<br>
          3. <b>Montage &amp; maintenance PC</b> — depuis 2022<br>
          <span class="warn">astuce :</span> <b>open p4</b> pour jouer contre l'IA.`),
        stage: () => say(`🔎 <b>recherche : stage de 8 semaines</b><br>
          domaine ... réseau / cybersécurité<br>
          période ... à partir de janvier 2027<br>
          zone ...... Île-de-France (permis B + véhicule)<br>
          contact ... <b>${PROFILE.mail}</b>`),
        contact: () => say(`📧 ${PROFILE.mail}<br>☎️ ${PROFILE.tel}<br>📍 ${PROFILE.ville}`),
        certifs: () => say(`<span class="ok">✔</span> Introduction to Cybersecurity — Cisco<br>
          <span class="ok">✔</span> Ethical Hacker — Cisco`),
        langues: () => say(`français C2 · arabe B2 · anglais B1`),
        cv: () => { window.open(PROFILE.cv, '_blank', 'noopener'); say(`ouverture de <b>${PROFILE.cv}</b>…`); },
        ls: () => say(`competences/  projets/  parcours/  certifications/  cv.pdf  contact.txt`),
        date: () => say(new Date().toLocaleString('fr-FR')),
        neofetch: () => say(`<pre style="margin:0;color:var(--c1)">   ____  _  __  ____  _____
  | __ )| |/ / / __ \\/ ___/
  |  _ \\| ' / / / / /\\__ \\
  | |_) | . \\/ /_/ /___/ /
  |____/|_|\\_\\____//____/ </pre>
          <b>user</b> ...... billal@bkos<br>
          <b>formation</b> . BTS SIO · SISR — Lycée Voillaume<br>
          <b>shell</b> ..... bksh 1.0<br>
          <b>thème</b> ..... ${document.documentElement.dataset.theme}<br>
          <b>uptime</b> .... en formation depuis 2023`),
        sudo: () => say(`<span class="err">billal n'est pas dans le fichier sudoers. Cet incident sera signalé.</span> 😉`),
        clear: () => { out.innerHTML = ''; },
        exit: () => WM.close('terminal')
      };

      function ping(host){
        const target = host || '8.8.8.8';
        say(`PING ${esc(target)} : 56 octets de données`);
        let n = 0;
        const t = setInterval(() => {
          const ms = (Math.random() * 18 + 6).toFixed(1);
          print(`<div class="term-out">64 octets depuis ${esc(target)} : icmp_seq=${++n} ttl=117 temps=${ms} ms</div>`);
          if(n === 4){
            clearInterval(t);
            say(`--- statistiques ${esc(target)} ---<br>4 paquets transmis, 4 reçus, <span class="ok">0% de perte</span>`);
          }
        }, 380);
      }

      function run(raw){
        const line = raw.trim();
        print(`<span class="term-prompt"><span class="u">billal</span>@bkos:~$</span> ${esc(raw)}`);
        if(!line) return;
        history.unshift(line); hIdx = -1;
        const [cmd, ...args] = line.split(/\s+/);
        const c = cmd.toLowerCase();

        if(CMD[c]) return CMD[c]();
        if(c === 'ping')  return ping(args[0]);
        if(c === 'echo')  return say(esc(args.join(' ')));
        if(c === 'theme') return applyTheme(args[0]) ? say(`thème <b>${esc(args[0])}</b> appliqué`) :
                                 say(`<span class="err">thèmes : cyber · aurora · solar · light</span>`);
        if(c === 'jeu' || c === 'invaders'){ say('🎮 lancement de Space Invaders…'); return WM.launch('invaders'); }
        if(c === 'open'){
          const alias = { p4: 'puissance4', puissance4: 'puissance4', ip: 'subnet', subnet: 'subnet',
                          cv: 'cv', contact: 'contact', reglages: 'settings', settings: 'settings',
                          wix: 'proj-wix', montage: 'proj-montage' };
          const app = alias[(args[0] || '').toLowerCase()];
          if(app){ WM.launch(app); return say(`ouverture de <b>${esc(args[0])}</b>…`); }
          return say(`<span class="err">cible inconnue.</span> essayez : p4 · subnet · cv · contact · settings`);
        }
        say(`<span class="err">commande introuvable : ${esc(cmd)}</span> — tapez <b>help</b>`);
      }

      input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter'){ const v = input.value; input.value = ''; run(v); }
        else if(e.key === 'ArrowUp'){ e.preventDefault(); if(hIdx < history.length - 1) input.value = history[++hIdx]; }
        else if(e.key === 'ArrowDown'){ e.preventDefault(); input.value = hIdx > 0 ? history[--hIdx] : (hIdx = -1, ''); }
        else if(e.key === 'Tab'){
          e.preventDefault();
          const all = Object.keys(CMD).concat(['ping','open','theme','echo']);
          const m = all.filter(c => c.startsWith(input.value.toLowerCase()));
          if(m.length === 1) input.value = m[0];
          else if(m.length > 1) say(m.join('  '));
        }
        e.stopPropagation();
      });
      $$('.term-chip', body).forEach(b => b.addEventListener('click', () => { run(b.dataset.cmd); input.focus(); }));
      body.addEventListener('click', (e) => { if(!e.target.closest('button')) input.focus(); });

      say(`<b>BK/OS shell 1.0</b> — tapez <b>help</b> pour la liste des commandes.`);
      CMD.whoami();
      setTimeout(() => input.focus(), 60);
    }
  };
}

/* --- 6.b Calculateur IP / CIDR --- */
function subnetApp(){
  return {
    title: 'Calculateur IP / CIDR', icon: '🖧', w: 580, h: 520, accent: 'var(--c2)',
    render(body){
      body.innerHTML = `
        <p style="margin-bottom:16px">Entrez une adresse IPv4 et un préfixe. L'outil calcule l'adresse réseau,
        le broadcast, la plage utilisable et le type d'adresse — comme en TP de réseau.</p>
        <div class="tool-form">
          <label class="field">Adresse IPv4
            <input type="text" id="sn-ip" value="192.168.10.42" placeholder="192.168.1.1" inputmode="decimal">
          </label>
          <label class="field">Préfixe (CIDR)
            <select id="sn-cidr"></select>
          </label>
          <button class="btn btn-primary" id="sn-go" type="button">Calculer</button>
        </div>
        <div id="sn-err" style="color:var(--c-danger);font-family:var(--mono);font-size:.8rem;margin-top:12px"></div>
        <div class="res-grid" id="sn-res"></div>`;

      const sel = $('#sn-cidr', body);
      for(let i = 8; i <= 32; i++){
        const o = document.createElement('option');
        o.value = i; o.textContent = `/${i}  (${cidrToMask(i)})`;
        if(i === 24) o.selected = true;
        sel.appendChild(o);
      }

      function cidrToMask(c){
        const m = (0xffffffff << (32 - c)) >>> 0;
        return [24, 16, 8, 0].map(s => (m >>> s) & 255).join('.');
      }
      const toInt = (ip) => ip.split('.').reduce((a, o) => (a << 8 >>> 0) + (+o), 0) >>> 0;
      const toIp  = (n) => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');

      function kind(ip){
        const [a, b] = ip.split('.').map(Number);
        if(a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return ['Privée (RFC 1918)', 'var(--c1)'];
        if(a === 127) return ['Loopback', 'var(--c4)'];
        if(a === 169 && b === 254) return ['APIPA / lien-local', 'var(--c4)'];
        if(a >= 224 && a <= 239) return ['Multicast', 'var(--c5)'];
        return ['Publique', 'var(--c3)'];
      }
      const klass = (a) => a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : a < 240 ? 'D' : 'E';

      function calc(){
        const ip = $('#sn-ip', body).value.trim();
        const cidr = +sel.value;
        const err = $('#sn-err', body), res = $('#sn-res', body);
        const parts = ip.split('.');
        const valid = parts.length === 4 && parts.every(p => /^\d{1,3}$/.test(p) && +p <= 255);
        if(!valid){ err.textContent = '✕ adresse IPv4 invalide (ex. 192.168.1.10)'; res.innerHTML = ''; return; }
        err.textContent = '';

        const maskInt = (0xffffffff << (32 - cidr)) >>> 0;
        const net  = (toInt(ip) & maskInt) >>> 0;
        const bcast = (net | (~maskInt >>> 0)) >>> 0;
        const total = Math.pow(2, 32 - cidr);
        const usable = cidr >= 31 ? (cidr === 32 ? 1 : 2) : total - 2;
        const [type, col] = kind(ip);
        const rows = [
          ['Adresse réseau', toIp(net)],
          ['Broadcast', cidr >= 31 ? '—' : toIp(bcast)],
          ['Masque', cidrToMask(cidr)],
          ['Masque générique', toIp(~maskInt >>> 0)],
          ['Premier hôte', cidr >= 31 ? toIp(net) : toIp(net + 1)],
          ['Dernier hôte', cidr >= 31 ? toIp(bcast) : toIp(bcast - 1)],
          ['Hôtes utilisables', usable.toLocaleString('fr-FR')],
          ['Adresses totales', total.toLocaleString('fr-FR')],
          ['Classe historique', klass(+parts[0])],
          ['Type', `<span style="color:${col}">${type}</span>`]
        ];
        res.innerHTML = rows.map(([k, v]) => `<div class="res-item"><b>${k}</b><span>${v}</span></div>`).join('');
      }

      $('#sn-go', body).addEventListener('click', calc);
      $('#sn-ip', body).addEventListener('keydown', (e) => { e.stopPropagation(); if(e.key === 'Enter') calc(); });
      sel.addEventListener('change', calc);
      calc();
    }
  };
}

/* --- 6.c Puissance 4 contre une IA minimax --- */
function puissance4App(){
  const R = 6, C = 7;
  return {
    title: 'Puissance 4 — vs IA', icon: '♟️', w: 520, h: 610, accent: 'var(--c4)',
    render(body, win){
      body.innerHTML = `
        <div class="p4-bar" style="margin-bottom:14px">
          <label class="field" style="flex-direction:row;align-items:center;gap:8px">Niveau
            <select id="p4-level" style="width:auto">
              <option value="1">facile</option>
              <option value="3" selected>moyen</option>
              <option value="5">difficile</option>
            </select>
          </label>
          <button class="btn btn-ghost btn-mini" id="p4-new" type="button">↻ Nouvelle partie</button>
        </div>
        <div class="p4-board" id="p4-board"></div>
        <div class="p4-status" id="p4-status" style="margin-top:14px"></div>
        <div class="p4-status" id="p4-note" style="color:var(--text-faint);font-size:.78rem;min-height:1.4em"></div>
        <p style="font-size:.8rem;text-align:center;margin-top:8px">
          Vous jouez les <b style="color:var(--c4)">jaunes</b>, l'IA les <b style="color:var(--c5)">roses</b>.
          Portage web de mon projet Java — même logique de détection d'alignements.
        </p>`;

      const boardEl = $('#p4-board', body), statusEl = $('#p4-status', body), noteEl = $('#p4-note', body);
      let grid, over, busy, closeTimer = null;

      // en fin de partie la fenêtre se referme seule ; ↻ annule le décompte
      function cancelAutoClose(){
        if(closeTimer){ clearInterval(closeTimer); closeTimer = null; }
        noteEl.textContent = '';
      }

      function scheduleAutoClose(){
        cancelAutoClose();
        let n = 5;
        noteEl.innerHTML = `la fenêtre se ferme dans <b id="p4-cd">${n}</b> s · ↻ pour rejouer`;
        const cd = $('#p4-cd', noteEl);
        closeTimer = setInterval(() => {
          if(--n <= 0){ cancelAutoClose(); win.close(); return; }
          cd.textContent = n;
        }, 1000);
      }

      function reset(){
        cancelAutoClose();
        grid = Array.from({ length: R }, () => Array(C).fill(0));
        over = false; busy = false;
        draw();
        statusEl.innerHTML = 'À vous de jouer — choisissez une colonne.';
      }

      function draw(highlight){
        boardEl.innerHTML = '';
        for(let r = 0; r < R; r++){
          for(let c = 0; c < C; c++){
            const d = document.createElement('div');
            d.className = 'p4-cell' + (grid[r][c] ? ' p' + grid[r][c] : '');
            d.dataset.col = c;
            if(highlight && highlight.some(([hr, hc]) => hr === r && hc === c)) d.classList.add('win');
            boardEl.appendChild(d);
          }
        }
      }

      const freeRow = (g, c) => { for(let r = R - 1; r >= 0; r--) if(!g[r][c]) return r; return -1; };
      const moves = (g) => { const m = []; for(let c = 0; c < C; c++) if(!g[0][c]) m.push(c); return m; };

      function winCells(g, p){
        const dirs = [[0,1],[1,0],[1,1],[1,-1]];
        for(let r = 0; r < R; r++) for(let c = 0; c < C; c++){
          if(g[r][c] !== p) continue;
          for(const [dr, dc] of dirs){
            const cells = [[r, c]];
            for(let k = 1; k < 4; k++){
              const nr = r + dr * k, nc = c + dc * k;
              if(nr < 0 || nr >= R || nc < 0 || nc >= C || g[nr][nc] !== p) break;
              cells.push([nr, nc]);
            }
            if(cells.length === 4) return cells;
          }
        }
        return null;
      }

      function score(g, p){
        const opp = p === 1 ? 2 : 1;
        let s = 0;
        const windows = [];
        for(let r = 0; r < R; r++) for(let c = 0; c < C; c++){
          if(c + 3 < C) windows.push([[r,c],[r,c+1],[r,c+2],[r,c+3]]);
          if(r + 3 < R) windows.push([[r,c],[r+1,c],[r+2,c],[r+3,c]]);
          if(r + 3 < R && c + 3 < C) windows.push([[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]]);
          if(r + 3 < R && c - 3 >= 0) windows.push([[r,c],[r+1,c-1],[r+2,c-2],[r+3,c-3]]);
        }
        for(const w of windows){
          const vals = w.map(([r, c]) => g[r][c]);
          const me = vals.filter(v => v === p).length;
          const him = vals.filter(v => v === opp).length;
          const empty = vals.filter(v => v === 0).length;
          if(me && him) continue;
          if(me === 3 && empty === 1) s += 60;
          else if(me === 2 && empty === 2) s += 8;
          else if(him === 3 && empty === 1) s -= 75;
          else if(him === 2 && empty === 2) s -= 9;
        }
        for(let r = 0; r < R; r++) if(g[r][3] === p) s += 4;
        return s;
      }

      function minimax(g, depth, alpha, beta, maximizing){
        if(winCells(g, 2)) return [null,  100000 + depth];
        if(winCells(g, 1)) return [null, -100000 - depth];
        const opts = moves(g);
        if(!opts.length) return [null, 0];
        if(depth === 0) return [null, score(g, 2)];

        let best = opts[Math.floor(Math.random() * opts.length)];
        if(maximizing){
          let val = -Infinity;
          for(const c of opts){
            const r = freeRow(g, c);
            g[r][c] = 2;
            const v = minimax(g, depth - 1, alpha, beta, false)[1];
            g[r][c] = 0;
            if(v > val){ val = v; best = c; }
            alpha = Math.max(alpha, val);
            if(alpha >= beta) break;
          }
          return [best, val];
        }
        let val = Infinity;
        for(const c of opts){
          const r = freeRow(g, c);
          g[r][c] = 1;
          const v = minimax(g, depth - 1, alpha, beta, true)[1];
          g[r][c] = 0;
          if(v < val){ val = v; best = c; }
          beta = Math.min(beta, val);
          if(alpha >= beta) break;
        }
        return [best, val];
      }

      function finish(p, cells){
        over = true;
        draw(cells);
        statusEl.innerHTML = p === 1
          ? '🏆 <b style="color:var(--c1)">Gagné !</b> Vous avez battu l\'IA.'
          : '💀 <b style="color:var(--c5)">L\'IA remporte la partie.</b> Réessayez en montant d\'un cran.';
        scheduleAutoClose();
      }

      function play(col){
        if(over || busy) return;
        const r = freeRow(grid, col);
        if(r < 0) return;
        grid[r][col] = 1;
        draw();
        const w1 = winCells(grid, 1);
        if(w1) return finish(1, w1);
        if(!moves(grid).length){ over = true; statusEl.textContent = '🤝 Match nul — plateau plein.'; scheduleAutoClose(); return; }

        busy = true;
        statusEl.innerHTML = '<span style="color:var(--c5)">L\'IA réfléchit…</span>';
        setTimeout(() => {
          const depth = +$('#p4-level', body).value;
          const [col2] = minimax(grid, depth, -Infinity, Infinity, true);
          const r2 = freeRow(grid, col2 ?? moves(grid)[0]);
          grid[r2][col2 ?? moves(grid)[0]] = 2;
          draw();
          busy = false;
          const w2 = winCells(grid, 2);
          if(w2) return finish(2, w2);
          if(!moves(grid).length){ over = true; statusEl.textContent = '🤝 Match nul — plateau plein.'; scheduleAutoClose(); return; }
          statusEl.innerHTML = 'À vous de jouer.';
        }, 260);
      }

      boardEl.addEventListener('click', (e) => {
        const cell = e.target.closest('.p4-cell');
        if(cell) play(+cell.dataset.col);
      });
      $('#p4-new', body).addEventListener('click', reset);
      reset();
      return cancelAutoClose;
    }
  };
}

/* --- 6.d Space Invaders --- */
function invadersApp(){
  return {
    title: 'Space Invaders', icon: '👾', w: 560, h: 500, flush: true, accent: 'var(--c5)',
    render(body, ctxWin){
      body.innerHTML = `
        <div class="game-wrap">
          <canvas class="game" id="inv-cv" width="520" height="340" tabindex="0"
                  aria-label="Space Invaders — flèches pour bouger, espace pour tirer"></canvas>
          <div class="p4-bar">
            <button class="btn btn-ghost btn-mini" id="inv-left" type="button">◀</button>
            <button class="btn btn-primary btn-mini" id="inv-fire" type="button">TIR</button>
            <button class="btn btn-ghost btn-mini" id="inv-right" type="button">▶</button>
            <button class="btn btn-ghost btn-mini" id="inv-restart" type="button">↻</button>
          </div>
          <div class="game-hint">← → pour bouger · Espace pour tirer · les boutons marchent aussi au doigt</div>
          <div class="game-hint" id="inv-note" style="min-height:1.3em"></div>
        </div>`;

      const cv = $('#inv-cv', body), ctx = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      const css = getComputedStyle(document.documentElement);
      const C1 = css.getPropertyValue('--c1').trim() || '#2ee6b6';
      const C4 = css.getPropertyValue('--c4').trim() || '#ffb340';
      const C5 = css.getPropertyValue('--c5').trim() || '#ff5c93';

      const noteEl = $('#inv-note', body);
      let player, bullets, foes, foeShots, score, lives, state, frame, raf;
      let offX, offY, dir, speed, closeTimer = null;
      const keys = {};

      // la partie terminée, la fenêtre se referme seule ; ↻ annule le décompte
      function cancelAutoClose(){
        if(closeTimer){ clearInterval(closeTimer); closeTimer = null; }
        noteEl.textContent = '';
      }

      function scheduleAutoClose(){
        cancelAutoClose();
        let n = 5;
        noteEl.innerHTML = `la fenêtre se ferme dans <b id="inv-cd">${n}</b> s · ↻ pour rejouer`;
        const cd = $('#inv-cd', noteEl);
        closeTimer = setInterval(() => {
          if(--n <= 0){ cancelAutoClose(); ctxWin.close(); return; }
          cd.textContent = n;
        }, 1000);
      }

      function reset(){
        cancelAutoClose();
        player = { x: W / 2 - 16, y: H - 26, w: 32, h: 12, s: 5 };
        bullets = []; foeShots = []; foes = [];
        const cols = 8, rows = 4;
        for(let r = 0; r < rows; r++)
          for(let c = 0; c < cols; c++)
            foes.push({ bx: 34 + c * 56, by: 34 + r * 38, w: 26, h: 18, alive: true });
        offX = 0; offY = 0; dir = 1; speed = 1;
        score = 0; lives = 3; frame = 0; state = 'ready';
        drawReady();
      }

      function drawFoe(x, y, w, h){
        ctx.fillStyle = C1;
        ctx.fillRect(x + w * .15, y, w * .7, h * .45);
        ctx.fillRect(x, y + h * .45, w, h * .35);
        ctx.fillRect(x + w * .05, y + h * .8, w * .18, h * .2);
        ctx.fillRect(x + w * .77, y + h * .8, w * .18, h * .2);
        ctx.fillStyle = '#04060c';
        ctx.fillRect(x + w * .26, y + h * .15, w * .16, h * .16);
        ctx.fillRect(x + w * .58, y + h * .15, w * .16, h * .16);
      }

      function drawReady(){
        ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = C1; ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText('SPACE INVADERS', W / 2, 120);
        ctx.fillStyle = '#8d9ab6'; ctx.font = '13px "JetBrains Mono", monospace';
        ctx.fillText('← →  bouger   ·   ESPACE  tirer', W / 2, 168);
        ctx.fillText('cliquez ou appuyez sur une touche', W / 2, 200);
        ctx.textAlign = 'left';
      }

      function begin(){
        if(state !== 'ready') return;
        state = 'playing';
        loop();
      }

      function shoot(){
        if(state === 'ready') return begin();
        if(state === 'playing' && bullets.length < 3)
          bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 10 });
      }

      function update(){
        frame++;
        if(keys.ArrowLeft)  player.x -= player.s;
        if(keys.ArrowRight) player.x += player.s;
        player.x = Math.max(0, Math.min(W - player.w, player.x));

        bullets.forEach(b => b.y -= 7);
        bullets = bullets.filter(b => b.y > -12);
        foeShots.forEach(b => b.y += 4);
        foeShots = foeShots.filter(b => b.y < H + 12);

        const alive = foes.filter(f => f.alive);
        speed = 1 + (1 - alive.length / foes.length) * 2.4;

        let minX = Infinity, maxX = -Infinity;
        alive.forEach(f => { minX = Math.min(minX, f.bx + offX); maxX = Math.max(maxX, f.bx + offX + f.w); });
        const step = dir * speed;
        if(minX + step < 8 || maxX + step > W - 8){ dir *= -1; offY += 13; }
        else offX += step;

        if(alive.length && frame % Math.max(16, 66 - (foes.length - alive.length)) === 0){
          const s = alive[Math.floor(Math.random() * alive.length)];
          foeShots.push({ x: s.bx + offX + s.w / 2 - 2, y: s.by + offY + s.h, w: 4, h: 10 });
        }

        bullets.forEach(b => foes.forEach(f => {
          if(!f.alive) return;
          const fx = f.bx + offX, fy = f.by + offY;
          if(b.x < fx + f.w && b.x + b.w > fx && b.y < fy + f.h && b.y + b.h > fy){
            f.alive = false; b.y = -100; score += 10;
          }
        }));
        foeShots.forEach(b => {
          if(b.x < player.x + player.w && b.x + b.w > player.x && b.y < player.y + player.h && b.y + b.h > player.y){
            b.y = H + 100; lives--;
            if(lives <= 0) state = 'over';
          }
        });
        if(alive.some(f => f.by + offY + f.h >= player.y)) state = 'over';
        if(foes.every(f => !f.alive)) state = 'win';
      }

      function render(){
        ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, W, H);
        foes.forEach(f => { if(f.alive) drawFoe(f.bx + offX, f.by + offY, f.w, f.h); });
        ctx.fillStyle = '#e8edf8';
        ctx.fillRect(player.x + player.w * .4, player.y, player.w * .2, player.h * .5);
        ctx.fillRect(player.x, player.y + player.h * .5, player.w, player.h * .5);
        ctx.fillStyle = C4; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.fillStyle = C5; foeShots.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.fillStyle = '#e8edf8'; ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.fillText('SCORE ' + score, 10, 20);
        ctx.fillStyle = C5; ctx.fillText('♥'.repeat(Math.max(0, lives)), W - 70, 20);
      }

      function endScreen(){
        ctx.fillStyle = 'rgba(4,6,12,.82)'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = state === 'win' ? C1 : C5;
        ctx.font = 'bold 26px "JetBrains Mono", monospace';
        ctx.fillText(state === 'win' ? 'VICTOIRE !' : 'GAME OVER', W / 2, H / 2 - 8);
        ctx.fillStyle = '#e8edf8'; ctx.font = '15px "JetBrains Mono", monospace';
        ctx.fillText('score : ' + score, W / 2, H / 2 + 22);
        ctx.fillStyle = '#8d9ab6'; ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText('↻ pour rejouer', W / 2, H / 2 + 48);
        ctx.textAlign = 'left';
      }

      function loop(){
        if(state !== 'playing'){ endScreen(); return; }
        update(); render();
        if(state !== 'playing'){ endScreen(); scheduleAutoClose(); return; }
        raf = requestAnimationFrame(loop);
      }

      const onKeyDown = (e) => {
        if(!ctxWin.el.isConnected) return;
        if(['ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
        if(e.key === ' ') shoot();
        else if(state === 'ready') begin();
        keys[e.key] = true;
      };
      const onKeyUp = (e) => { keys[e.key] = false; };
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);

      const hold = (el, key) => {
        el.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[key] = true; if(state === 'ready') begin(); });
        ['pointerup','pointerleave','pointercancel'].forEach(ev => el.addEventListener(ev, () => { keys[key] = false; }));
      };
      hold($('#inv-left', body), 'ArrowLeft');
      hold($('#inv-right', body), 'ArrowRight');
      $('#inv-fire', body).addEventListener('click', shoot);
      $('#inv-restart', body).addEventListener('click', () => { cancelAnimationFrame(raf); reset(); });
      cv.addEventListener('click', () => { if(state === 'ready') begin(); else if(state !== 'playing'){ cancelAnimationFrame(raf); reset(); } });

      reset();
      // on retire le clavier au terminal, sinon son champ intercepte tout
      if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
      cv.focus({ preventScroll: true });

      return () => {
        cancelAnimationFrame(raf);
        cancelAutoClose();
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
      };
    }
  };
}

/* --- 6.e CV, contact, réglages --- */
const cvApp = () => ({
  title: 'CV — Billal Kaamouchi', icon: '📄', w: 720, h: 640, flush: true, accent: 'var(--c3)',
  render(body){
    body.innerHTML = `
      <div style="display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <a class="btn btn-primary btn-mini" href="${PROFILE.cv}" download>⬇ Télécharger</a>
        <a class="btn btn-ghost btn-mini" href="${PROFILE.cv}" target="_blank" rel="noopener">Ouvrir dans un onglet ↗</a>
      </div>
      <iframe src="${PROFILE.cv}" title="CV de Billal Kaamouchi"
        style="width:100%;height:calc(100% - 58px);border:none;background:#fff"></iframe>`;
  }
});

const contactApp = () => ({
  title: 'Nouveau message', icon: '✉️', w: 540, h: 540, accent: 'var(--c1)',
  render(body){
    body.innerHTML = `
      <p>Un stage, une question, une mission ? Ce formulaire prépare simplement l'e-mail dans votre messagerie.</p>
      <form id="wc-form" style="margin-top:16px">
        <label class="field">De la part de<input type="text" id="wc-name" placeholder="Nom / entreprise" required></label>
        <label class="field">Objet<input type="text" id="wc-subject" value="Proposition de stage — réseau / cybersécurité"></label>
        <label class="field">Message<textarea id="wc-msg" placeholder="Bonjour Billal, …" required></textarea></label>
        <button class="btn btn-primary" type="submit" style="align-self:flex-start">Ouvrir dans ma messagerie →</button>
      </form>
      <div class="callout" style="margin-top:18px">
        <b>Direct :</b> ${PROFILE.mail} · ${PROFILE.tel}<br>${PROFILE.ville}
      </div>`;
    $('#wc-form', body).addEventListener('submit', (e) => {
      e.preventDefault();
      const n = $('#wc-name', body).value.trim();
      const s = $('#wc-subject', body).value.trim() || 'Contact';
      const m = $('#wc-msg', body).value.trim();
      window.location.href = `mailto:${PROFILE.mail}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(m + '\n\n— ' + n)}`;
    });
    body.addEventListener('keydown', e => e.stopPropagation());
  }
});

const THEMES = [
  { id: 'cyber',  name: 'Cyber',  sw: ['#2ee6b6','#8b6cff','#4d9dff','#06080f'] },
  { id: 'aurora', name: 'Aurora', sw: ['#41e5ff','#b06bff','#ff5fa8','#080614'] },
  { id: 'solar',  name: 'Solar',  sw: ['#ffb340','#ff7a5c','#ffd166','#0d0704'] },
  { id: 'light',  name: 'Clair',  sw: ['#00997a','#6d3fe0','#1f6fe0','#eef1f8'] }
];

function applyTheme(id){
  if(!THEMES.some(t => t.id === id)) return false;
  document.documentElement.dataset.theme = id;
  store.set('theme', id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.content = THEMES.find(t => t.id === id).sw[3];
  return true;
}

const settingsApp = () => ({
  title: 'Apparence & réglages', icon: '◐', w: 480, h: 500, accent: 'var(--c2)',
  render(body){
    body.innerHTML = `
      <h4 style="margin-top:0">Thème</h4>
      <div class="theme-grid">
        ${THEMES.map(t => `
          <button class="theme-opt${document.documentElement.dataset.theme === t.id ? ' active' : ''}" data-theme="${t.id}" type="button">
            <span class="theme-swatch">${t.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span>
            <b>${t.name}</b>
          </button>`).join('')}
      </div>
      <h4>Effets</h4>
      <div class="switch-row">
        <div><b>Animations de fond</b><p>Maillage réseau, halos colorés et halo de souris.</p></div>
        <div class="switch${document.body.classList.contains('no-fx') ? '' : ' on'}" id="sw-fx" role="switch" tabindex="0"></div>
      </div>
      <h4>Raccourcis clavier</h4>
      <div style="font-family:var(--mono);font-size:.8rem;color:var(--text-dim);display:grid;gap:7px">
        <div><b style="color:var(--c1)">T</b> — ouvrir le terminal</div>
        <div><b style="color:var(--c1)">I</b> — calculateur IP</div>
        <div><b style="color:var(--c1)">C</b> — écrire un message</div>
        <div><b style="color:var(--c1)">Échap</b> — fermer la fenêtre active</div>
      </div>`;

    $$('.theme-opt', body).forEach(b => b.addEventListener('click', () => {
      applyTheme(b.dataset.theme);
      $$('.theme-opt', body).forEach(x => x.classList.toggle('active', x === b));
    }));
    const sw = $('#sw-fx', body);
    const toggle = () => {
      const off = document.body.classList.toggle('no-fx');
      sw.classList.toggle('on', !off);
      store.set('fx', !off);
    };
    sw.addEventListener('click', toggle);
    sw.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); } });
  }
});

/* --- 6.f Fiches projet --- */
const PROJECTS = {
  puissance4: {
    title: 'Puissance 4 en Java', icon: '♟️', accent: 'var(--c4)', page: 'puissance4.html',
    tags: ['Java', 'IntelliJ', 'POO', 'IUT Montreuil'],
    play: 'puissance4',
    html: `
      <p><b>Contexte —</b> projet de première année de BUT Informatique à l'IUT de Montreuil.
      L'objectif : mettre en pratique la programmation orientée objet sur un jeu complet, sans interface graphique.</p>
      <h4>Fonctionnalités</h4>
      <ul>
        <li>Plateau 7×6 entièrement géré en ligne de commande</li>
        <li>Alternance des tours et validation de chaque coup joué</li>
        <li>Détection automatique des alignements horizontaux, verticaux et diagonaux</li>
        <li>Gestion du match nul et des saisies invalides</li>
        <li>Découpage en classes : <code>Plateau</code>, <code>Joueur</code>, <code>Jeu</code></li>
      </ul>
      <h4>Ce que j'en retiens</h4>
      <p>La séparation des responsabilités entre classes, et surtout la logique de détection d'alignements
      dans les quatre directions — que j'ai reprise telle quelle pour la version jouable de ce site.</p>
      <div class="callout"><b>Compétence clé :</b> conception orientée objet, gestion d'états de jeu, algorithmique.</div>`
  },
  wix: {
    title: 'Site vitrine Wix Studio', icon: '🌐', accent: 'var(--c3)', page: 'wix-studio.html',
    tags: ['Wix Studio', 'Web design', 'Responsive', 'IUT Montreuil'],
    html: `
      <p><b>Contexte —</b> conception et mise en ligne d'un site vitrine professionnel complet avec Wix Studio,
      de la maquette jusqu'à la publication.</p>
      <h4>Ce que j'ai fait</h4>
      <ul>
        <li>Structure des pages et arborescence de navigation</li>
        <li>Choix graphiques : typographies, palette, hiérarchie visuelle</li>
        <li>Adaptation responsive mobile / tablette / desktop</li>
        <li>Mise en ligne, nom de domaine et réglages de référencement de base</li>
      </ul>
      <h4>Ce que j'en retiens</h4>
      <p>Un site ne se juge pas à son apparence sur grand écran : la contrainte du mobile et la clarté
      du message comptent davantage. Une leçon que j'ai appliquée à ce portfolio.</p>
      <div class="callout"><b>Compétence clé :</b> conception web, design responsive, mise en production.</div>`
  },
  montage: {
    title: 'Montage & maintenance PC', icon: '🔧', accent: 'var(--c1)', page: 'montage-pc.html',
    tags: ['Hardware', 'Windows', 'Diagnostic', 'BIOS/UEFI'],
    html: `
      <p><b>Contexte —</b> depuis 2022, je monte, répare et fais évoluer des PC pour mon entourage.
      C'est là qu'est née mon envie de travailler dans l'informatique.</p>
      <h4>Interventions courantes</h4>
      <ul>
        <li>Assemblage complet : carte mère, CPU, refroidissement, RAM, stockage, alimentation</li>
        <li>Installation et configuration de Windows, pilotes et outils</li>
        <li>Diagnostic de pannes : écran noir, surchauffe, corruption de disque, RAM défectueuse</li>
        <li>Upgrades ciblés (SSD, RAM, GPU) et optimisation thermique</li>
        <li>Réglages BIOS/UEFI, ordre de démarrage, XMP</li>
      </ul>
      <h4>Ce que j'en retiens</h4>
      <p>Une méthode : isoler, tester composant par composant, ne changer qu'une variable à la fois.
      C'est exactement la démarche que j'applique aujourd'hui au dépannage réseau.</p>
      <div class="callout"><b>Compétence clé :</b> diagnostic méthodique, support utilisateur, matériel.</div>`
  }
};

function projectApp(key){
  const p = PROJECTS[key];
  return {
    title: p.title, icon: p.icon, w: 640, h: 560, accent: p.accent,
    render(body){
      body.innerHTML = `
        <div class="tags" style="margin-bottom:18px">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        ${p.html}
        <div class="win-actions">
          ${p.play ? `<button class="btn btn-primary btn-mini" data-play="${p.play}" type="button">▶ Jouer maintenant</button>` : ''}
          <a class="btn btn-ghost btn-mini" href="${p.page}">Page complète ↗</a>
          <button class="btn btn-ghost btn-mini" data-app="contact" type="button">En parler ✉️</button>
        </div>`;
      const play = $('[data-play]', body);
      if(play) play.addEventListener('click', () => WM.launch(play.dataset.play));
    }
  };
}

/* --- Registre des applications --- */
const APPS = {
  terminal:   terminalApp,
  subnet:     subnetApp,
  puissance4: puissance4App,
  invaders:   invadersApp,
  cv:         cvApp,
  contact:    contactApp,
  settings:   settingsApp,
  'proj-puissance4': () => projectApp('puissance4'),
  'proj-wix':        () => projectApp('wix'),
  'proj-montage':    () => projectApp('montage')
};

/* ---------- 7. Câblage & raccourcis ---------- */
function wireLaunchers(){
  document.addEventListener('click', (e) => {
    const appBtn = e.target.closest('[data-app]');
    if(appBtn){ WM.launch(appBtn.dataset.app); return; }
    const proj = e.target.closest('[data-project]');
    if(proj) WM.launch('proj-' + proj.dataset.project);
  });
}

function shortcuts(){
  const map = { t: 'terminal', p: 'puissance4', i: 'subnet', c: 'contact' };
  window.addEventListener('keydown', (e) => {
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const app = map[e.key.toLowerCase()];
    if(app){ e.preventDefault(); WM.launch(app); }
  });
}

// ↑ ↑ ↓ ↓ ← → ← → B A — l'autre façon de tomber sur Space Invaders
function konami(){
  const seq = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  let i = 0;
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    i = k === seq[i] ? i + 1 : (k === seq[0] ? 1 : 0);
    if(i === seq.length){ i = 0; WM.launch('invaders'); }
  });
}

function restorePrefs(){
  const t = store.get('theme', 'cyber');
  applyTheme(t);
  if(store.get('fx', true) === false) document.body.classList.add('no-fx');
}

/* ---------- Démarrage ---------- */
restorePrefs();
boot();
networkBackground();
spotlight();
revealOnScroll();
animateMeters();
animateCounters();
typeRoles();
trackTabs();
contactForm();
wireLaunchers();
shortcuts();
konami();

// lancement direct via ?app=… (utilisé par les pages projet)
const wanted = new URLSearchParams(location.search).get('app');
if(wanted && APPS[wanted]) setTimeout(() => WM.launch(wanted), 700);

console.log('%cBK/OS','background:#2ee6b6;color:#04140f;padding:2px 8px;border-radius:4px;font-weight:bold',
  'Curieux du code ? github.com/grfz9/portfolio — tapez « help » dans le terminal.');

})();
