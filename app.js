/* =====================================================================
   Portfolio Billal Kaamouchi
   1. Utilitaires      4. Gestionnaire de fenêtres
   2. Curseur          5. Applications
   3. Page             6. Démarrage
   ===================================================================== */
(() => {
'use strict';

/* ---------- 1. Utilitaires ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const isMobile = () => window.matchMedia('(max-width:760px)').matches;
const coarse   = () => window.matchMedia('(pointer:coarse)').matches;
const reduced  = () => window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

/* icône du jeu de symboles défini dans la page */
const ico = (name, cls = 'ico') =>
  `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

/* Deux clés seulement, décrites sur la page « Données personnelles ». */
const store = {
  get(k, d){ try { const v = localStorage.getItem('bk.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v){ try { localStorage.setItem('bk.' + k, JSON.stringify(v)); } catch {} }
};

const PROFILE = {
  mail:  'billalkaamouchi@gmail.com',
  tel:   '07 71 17 91 24',
  ville: 'Sevran (93), Île-de-France',
  cv:    'CV_Billal_KAAMOUCHI.pdf'
};

/* ---------- 2. Curseur ---------- */
/* Un anneau qui suit le pointeur avec un léger retard et réagit aux
   éléments interactifs. Le curseur du système reste visible : il porte la
   précision, l'anneau porte le mouvement. */
function cursorRing(){
  if(coarse() || reduced() || !store.get('anim', true)) return;

  const ring = document.createElement('div');
  ring.id = 'cursor-ring';
  document.body.appendChild(ring);

  const HOT = 'a, button, [data-app], [data-project], input, textarea, select, .p4-cell, .win__bar, .term-chip';
  let tx = innerWidth / 2, ty = innerHeight / 2;
  let x = tx, y = ty, raf = null, visible = false;

  const loop = () => {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    ring.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    if(Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(loop);
    else raf = null;
  };
  const kick = () => { if(!raf) raf = requestAnimationFrame(loop); };

  window.addEventListener('pointermove', (e) => {
    if(e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    if(!visible){ visible = true; ring.classList.add('on'); }
    ring.classList.toggle('hot', !!(e.target.closest && e.target.closest(HOT)));
    kick();
  }, { passive: true });

  window.addEventListener('pointerdown', () => ring.classList.add('press'));
  window.addEventListener('pointerup',   () => ring.classList.remove('press'));
  document.addEventListener('mouseleave', () => { visible = false; ring.classList.remove('on'); });
  document.addEventListener('mouseenter', () => { visible = true;  ring.classList.add('on'); });
}

/* ---------- 3. Page ---------- */
function applyTheme(name){
  const t = name === 'sombre' ? 'sombre' : 'clair';
  document.documentElement.dataset.theme = t;
  store.set('theme', t);
  const meta = $('meta[name="theme-color"]');
  if(meta) meta.content = t === 'sombre' ? '#1d2022' : '#f7f6f2';
  const btn = $('#theme-toggle');
  if(btn){
    btn.innerHTML = ico(t === 'sombre' ? 'sun' : 'moon');
    btn.setAttribute('aria-label', t === 'sombre' ? 'Passer au thème clair' : 'Passer au thème sombre');
  }
  return t;
}

function themeToggle(){
  const btn = $('#theme-toggle');
  if(btn) btn.addEventListener('click', () =>
    applyTheme(document.documentElement.dataset.theme === 'sombre' ? 'clair' : 'sombre'));
}

function trackTabs(){
  const tabs = $$('.track-tab');
  if(!tabs.length) return;
  const select = (tab) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); select(next);
    });
  });
}

function mailto(name, subject, message){
  const body = message + (name ? '\n\n' + name : '');
  return `mailto:${PROFILE.mail}?subject=${encodeURIComponent(subject || 'Contact')}&body=${encodeURIComponent(body)}`;
}

function contactForm(){
  const f = $('#contact-form');
  if(!f) return;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    window.location.href = mailto($('#cf-name').value.trim(), $('#cf-subject').value.trim(), $('#cf-message').value.trim());
  });
}

/* ---------- 4. Gestionnaire de fenêtres ---------- */
const WM = (() => {
  const layer   = $('#win-layer');
  const overlay = $('#win-overlay');
  const open = new Map();
  let z = 100, cascade = 0;

  function syncChrome(){
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
    w.el.remove();
    open.delete(id);
    syncChrome();
  }

  function place(el, width, height){
    const vw = innerWidth, vh = innerHeight;
    const w = Math.min(width, vw - 40);
    const h = Math.min(height, vh - 150);
    const off = (cascade++ % 5) * 26;
    el.style.width  = w + 'px';
    el.style.height = h + 'px';
    el.style.left   = Math.max(16, Math.round((vw - w) / 2) + off - 52) + 'px';
    el.style.top    = Math.max(70, Math.round((vh - h) / 2) + off - 36) + 'px';
  }

  function makeDraggable(el, handle){
    let sx, sy, sl, st, on = false;
    handle.addEventListener('pointerdown', (e) => {
      /* les boutons de la barre gardent leur clic : la capture du pointeur
         le leur volerait */
      if(e.target.closest('.win__btns') || isMobile() || el.classList.contains('maximized')) return;
      on = true; sx = e.clientX; sy = e.clientY; sl = el.offsetLeft; st = el.offsetTop;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if(!on) return;
      el.style.left = Math.min(innerWidth - 80, Math.max(-el.offsetWidth + 110, sl + e.clientX - sx)) + 'px';
      el.style.top  = Math.min(innerHeight - 56, Math.max(4, st + e.clientY - sy)) + 'px';
    });
    const stop = (e) => { if(!on) return; on = false; try { handle.releasePointerCapture(e.pointerId); } catch {} };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  function makeResizable(el, grip){
    let sx, sy, sw, sh, on = false;
    grip.addEventListener('pointerdown', (e) => {
      if(isMobile()) return;
      on = true; sx = e.clientX; sy = e.clientY; sw = el.offsetWidth; sh = el.offsetHeight;
      grip.setPointerCapture(e.pointerId); e.preventDefault();
    });
    grip.addEventListener('pointermove', (e) => {
      if(!on) return;
      el.style.width  = Math.max(290, sw + e.clientX - sx) + 'px';
      el.style.height = Math.max(180, sh + e.clientY - sy) + 'px';
    });
    const stop = (e) => { on = false; try { grip.releasePointerCapture(e.pointerId); } catch {} };
    grip.addEventListener('pointerup', stop);
    grip.addEventListener('pointercancel', stop);
  }

  function launch(id){
    if(open.has(id)){ focus(id); return open.get(id).el; }
    const app = APPS[id];
    if(!app) return null;
    const cfg = app();

    const el = document.createElement('section');
    el.className = 'win';
    el.dataset.win = id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', cfg.title);
    el.innerHTML = `
      <header class="win__bar">
        <h2 class="win__title">${ico(cfg.icon)}${esc(cfg.title)}</h2>
        <div class="win__btns">
          <button class="wb-min"   title="Réduire"  aria-label="Réduire la fenêtre">${ico('minus')}</button>
          <button class="wb-max"   title="Agrandir" aria-label="Agrandir la fenêtre">${ico('square')}</button>
          <button class="wb-close" title="Fermer la fenêtre, ou touche Échap" aria-label="Fermer la fenêtre">${ico('x')}</button>
        </div>
      </header>
      <div class="win__body${cfg.flush ? ' flush' : ''}"></div>
      <div class="win__resize" title="Redimensionner"></div>`;

    place(el, cfg.w || 620, cfg.h || 480);
    el.style.zIndex = ++z;
    layer.appendChild(el);

    const body = $('.win__body', el);
    const cleanup = cfg.render(body, { close: () => close(id), el }) || null;
    open.set(id, { el, cleanup });

    $('.wb-close', el).addEventListener('click', () => close(id));
    $('.wb-min',   el).addEventListener('click', () => el.classList.add('minimized'));
    $('.wb-max',   el).addEventListener('click', () => el.classList.toggle('maximized'));
    el.addEventListener('pointerdown', () => focus(id), true);
    makeDraggable(el, $('.win__bar', el));
    makeResizable(el, $('.win__resize', el));
    syncChrome();
    return el;
  }

  overlay.addEventListener('click', () => [...open.keys()].forEach(close));
  window.addEventListener('keydown', (e) => {
    if(e.key !== 'Escape' || !open.size) return;
    const top = [...open.entries()].sort((a, b) => +b[1].el.style.zIndex - +a[1].el.style.zIndex)[0];
    if(top) close(top[0]);
  });

  return { launch, close, focus, isOpen: (id) => open.has(id) };
})();

/* ---------- 5. Applications ---------- */

/* --- 5.a Terminal --- */
function terminalApp(){
  return {
    title: 'Terminal', icon: 'terminal', w: 640, h: 430, flush: true,
    render(body){
      body.innerHTML = `
        <div class="term">
          <div class="term-body" id="t-body"></div>
          <div class="term-chips">
            ${['whoami','competences','projets','stage','ping 8.8.8.8','help'].map(c =>
              `<button class="term-chip" data-cmd="${c}">${c}</button>`).join('')}
          </div>
          <div class="term-inrow">
            <span class="term-prompt">billal@portfolio:~$</span>
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
        help: () => say(`commandes : ${Object.keys(CMD).concat(['ping','open','theme','echo'])
          .sort().map(c => `<b>${c}</b>`).join(', ')}`),
        whoami: () => say(`<b>Billal Kaamouchi</b>, étudiant en BTS SIO option SISR.<br>
          Objectif : administrateur réseau ou analyste en cybersécurité.<br>
          <span class="ok">Disponible</span> pour un stage de 8 semaines à partir de janvier 2027.`),
        competences: () => say(`<b>reseaux</b>   Windows Server, Active Directory, TCP/IP, VLAN, DHCP, DNS<br>
          <b>securite</b>  TryHackMe, test d'intrusion, durcissement, pare-feu<br>
          <b>dev</b>       Java, SQL, HTML, CSS, JavaScript, Git<br>
          <b>materiel</b>  montage, diagnostic, installation de systèmes`),
        projets: () => say(`1. <b>Puissance 4 en Java</b>, programmation orientée objet<br>
          2. <b>Site vitrine Wix Studio</b>, conception et mise en ligne<br>
          3. <b>Montage et maintenance PC</b>, depuis 2022<br>
          Les fiches détaillées sont dans la section Projets de la page.`),
        stage: () => say(`recherche : <b>stage de 8 semaines</b><br>
          domaine ... réseau ou cybersécurité<br>
          période ... à partir de janvier 2027<br>
          zone ...... Île-de-France, permis B et véhicule<br>
          contact ... <b>${PROFILE.mail}</b>`),
        contact: () => say(`${PROFILE.mail}<br>${PROFILE.tel}<br>${PROFILE.ville}`),
        certifs: () => say(`<span class="ok">ok</span> Introduction to Cybersecurity, Cisco<br>
          <span class="ok">ok</span> Ethical Hacker, Cisco`),
        langues: () => say(`français langue maternelle, arabe B2, anglais B1`),
        cv: () => { window.open(PROFILE.cv, '_blank', 'noopener'); say(`ouverture de <b>${PROFILE.cv}</b>`); },
        ls: () => say(`competences/  projets/  parcours/  certifications/  cv.pdf  contact.txt`),
        date: () => say(new Date().toLocaleString('fr-FR')),
        rgpd: () => { window.location.href = 'rgpd.html'; },
        sudo: () => say(`<span class="err">billal n'est pas dans le fichier sudoers.</span> Cet incident sera signalé.`),
        clear: () => { out.innerHTML = ''; },
        exit: () => WM.close('terminal')
      };

      let pingTimer = null;
      function ping(host){
        clearInterval(pingTimer);
        const target = host || '8.8.8.8';
        say(`PING ${esc(target)} : 56 octets de données`);
        let n = 0;
        pingTimer = setInterval(() => {
          const ms = (Math.random() * 18 + 6).toFixed(1);
          print(`<div class="term-out">64 octets depuis ${esc(target)} : icmp_seq=${++n} ttl=117 temps=${ms} ms</div>`);
          if(n === 4){
            clearInterval(pingTimer); pingTimer = null;
            say(`statistiques ${esc(target)} : 4 paquets transmis, 4 reçus, <span class="ok">0% de perte</span>`);
          }
        }, 360);
      }

      const EXTRA = ['ping','open','theme','echo'];

      function run(raw){
        const line = raw.trim();
        print(`<span class="term-prompt">billal@portfolio:~$</span> ${esc(raw)}`);
        if(!line) return;
        history.unshift(line); hIdx = -1;
        const [cmd, ...args] = line.split(/\s+/);
        const c = cmd.toLowerCase();

        if(CMD[c]) return CMD[c]();
        /* ni dans « help », ni dans l'autocomplétion : c'est le principe */
        if(c === 'jeu' || c === 'invaders'){ say('lancement de Space Invaders'); return WM.launch('invaders'); }
        if(c === 'p4'){ say('lancement du Puissance 4'); return WM.launch('puissance4'); }
        if(c === 'ping')  return ping(args[0]);
        if(c === 'echo')  return say(esc(args.join(' ')));
        if(c === 'theme'){
          const t = (args[0] || '').toLowerCase();
          if(t === 'clair' || t === 'sombre'){ applyTheme(t); return say(`thème <b>${t}</b> appliqué`); }
          return say(`<span class="err">thèmes disponibles : clair, sombre</span>`);
        }
        if(c === 'open'){
          const alias = { ip:'subnet', subnet:'subnet', cv:'cv', contact:'contact',
                          reglages:'settings', settings:'settings',
                          p4:'proj-puissance4', puissance4:'proj-puissance4',
                          wix:'proj-wix', montage:'proj-montage' };
          const app = alias[(args[0] || '').toLowerCase()];
          if(app){ WM.launch(app); return say(`ouverture de <b>${esc(args[0])}</b>`); }
          return say(`<span class="err">cible inconnue.</span> essayez : subnet, cv, contact, settings, p4, wix, montage`);
        }
        say(`<span class="err">commande introuvable : ${esc(cmd)}</span>, tapez <b>help</b>`);
      }

      input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter'){ const v = input.value; input.value = ''; run(v); }
        else if(e.key === 'ArrowUp'){ e.preventDefault(); if(hIdx < history.length - 1) input.value = history[++hIdx]; }
        else if(e.key === 'ArrowDown'){ e.preventDefault(); input.value = hIdx > 0 ? history[--hIdx] : (hIdx = -1, ''); }
        else if(e.key === 'Tab'){
          e.preventDefault();
          const all = Object.keys(CMD).concat(EXTRA);
          const m = all.filter(c => c.startsWith(input.value.toLowerCase()));
          if(m.length === 1) input.value = m[0];
          else if(m.length > 1) say(m.join('  '));
        }
        e.stopPropagation();
      });
      $$('.term-chip', body).forEach(b => b.addEventListener('click', () => { run(b.dataset.cmd); input.focus(); }));
      body.addEventListener('click', (e) => { if(!e.target.closest('button')) input.focus(); });

      say(`Terminal du portfolio. Tapez <b>help</b> pour la liste des commandes.`);
      CMD.whoami();
      setTimeout(() => input.focus(), 50);

      return () => clearInterval(pingTimer);
    }
  };
}

/* --- 5.b Calculateur d'adressage --- */
function subnetApp(){
  return {
    title: "Calculateur d'adressage IPv4", icon: 'network', w: 580, h: 540,
    render(body){
      body.innerHTML = `
        <p>Saisissez une adresse IPv4 et un préfixe. L'outil calcule l'adresse réseau, le broadcast,
        la plage utilisable et le type d'adresse, comme en travaux pratiques.</p>
        <div class="tool-form">
          <label class="field"><span>Adresse IPv4</span>
            <input type="text" id="sn-ip" value="192.168.10.42" inputmode="decimal">
          </label>
          <label class="field"><span>Préfixe CIDR</span><select id="sn-cidr"></select></label>
          <button class="btn btn-primary" id="sn-go" type="button" style="justify-self:start">Calculer</button>
        </div>
        <p id="sn-err" style="color:var(--clay);font-family:var(--mono);font-size:.82rem;margin-top:12px"></p>
        <div class="res-grid" id="sn-res"></div>`;

      const sel = $('#sn-cidr', body);
      const maskOf = (c) => (0xffffffff << (32 - c)) >>> 0;
      const toIp = (n) => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');
      const toInt = (ip) => ip.split('.').reduce((a, o) => ((a << 8) >>> 0) + (+o), 0) >>> 0;

      for(let i = 8; i <= 32; i++){
        const o = document.createElement('option');
        o.value = i; o.textContent = `/${i}  (${toIp(maskOf(i))})`;
        if(i === 24) o.selected = true;
        sel.appendChild(o);
      }

      function kind(ip){
        const [a, b] = ip.split('.').map(Number);
        if(a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return 'Privée, RFC 1918';
        if(a === 127) return 'Boucle locale';
        if(a === 169 && b === 254) return 'Lien-local, APIPA';
        if(a >= 224 && a <= 239) return 'Multidiffusion';
        return 'Publique';
      }
      const klass = (a) => a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : a < 240 ? 'D' : 'E';

      function calc(){
        const ip = $('#sn-ip', body).value.trim(), cidr = +sel.value;
        const err = $('#sn-err', body), res = $('#sn-res', body);
        const parts = ip.split('.');
        if(!(parts.length === 4 && parts.every(p => /^\d{1,3}$/.test(p) && +p <= 255))){
          err.textContent = 'Adresse IPv4 invalide, par exemple 192.168.1.10';
          res.innerHTML = ''; return;
        }
        err.textContent = '';
        const mask = maskOf(cidr);
        const net = (toInt(ip) & mask) >>> 0;
        const bcast = (net | (~mask >>> 0)) >>> 0;
        const total = Math.pow(2, 32 - cidr);
        const usable = cidr >= 31 ? (cidr === 32 ? 1 : 2) : total - 2;
        const rows = [
          ['Adresse réseau', toIp(net)],
          ['Broadcast', cidr >= 31 ? 'sans objet' : toIp(bcast)],
          ['Masque', toIp(mask)],
          ['Masque générique', toIp(~mask >>> 0)],
          ['Premier hôte', cidr >= 31 ? toIp(net) : toIp(net + 1)],
          ['Dernier hôte', cidr >= 31 ? toIp(bcast) : toIp(bcast - 1)],
          ['Hôtes utilisables', usable.toLocaleString('fr-FR')],
          ['Adresses totales', total.toLocaleString('fr-FR')],
          ['Classe historique', klass(+parts[0])],
          ['Type', kind(ip)]
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

/* --- 5.c CV, message, réglages --- */
const cvApp = () => ({
  title: 'CV', icon: 'doc', w: 720, h: 640, flush: true,
  render(body){
    body.innerHTML = `
      <div style="display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid var(--line);flex-wrap:wrap">
        <a class="btn btn-primary btn-mini" href="${PROFILE.cv}" download>${ico('download')}Télécharger</a>
        <a class="btn btn-ghost btn-mini" href="${PROFILE.cv}" target="_blank" rel="noopener">${ico('arrow-ur')}Ouvrir dans un onglet</a>
      </div>
      <iframe src="${PROFILE.cv}" title="CV de Billal Kaamouchi"
        style="width:100%;height:calc(100% - 58px);border:none;background:#fff"></iframe>`;
  }
});

const contactApp = () => ({
  title: 'Nouveau message', icon: 'mail', w: 540, h: 540,
  render(body){
    body.innerHTML = `
      <p>Ce formulaire prépare l'e-mail dans votre messagerie. Aucune donnée ne transite par ce site.</p>
      <form id="wc-form" style="margin-top:16px">
        <label class="field"><span>De la part de</span><input type="text" id="wc-name" required></label>
        <label class="field"><span>Objet</span><input type="text" id="wc-subject" value="Proposition de stage, réseau ou cybersécurité"></label>
        <label class="field"><span>Message</span><textarea id="wc-msg" required></textarea></label>
        <button class="btn btn-primary" type="submit" style="justify-self:start">${ico('mail')}Ouvrir ma messagerie</button>
      </form>
      <div class="callout">
        <b>Direct :</b> ${PROFILE.mail}, ${PROFILE.tel}<br>${PROFILE.ville}
      </div>`;
    $('#wc-form', body).addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = mailto($('#wc-name', body).value.trim(),
        $('#wc-subject', body).value.trim(), $('#wc-msg', body).value.trim());
    });
    body.addEventListener('keydown', e => e.stopPropagation());
  }
});

const settingsApp = () => ({
  title: 'Réglages', icon: 'sliders', w: 460, h: 440,
  render(body){
    const dark = document.documentElement.dataset.theme === 'sombre';
    body.innerHTML = `
      <h4 style="margin-top:0">Affichage</h4>
      <div class="switch-row">
        <div><strong>Thème sombre</strong><p>Un gris chaud, pour la lecture de nuit.</p></div>
        <div class="switch" id="sw-theme" role="switch" tabindex="0" aria-checked="${dark}" aria-label="Thème sombre"></div>
      </div>
      <div class="switch-row">
        <div><strong>Animation du curseur</strong><p>L'anneau qui suit le pointeur. Sans effet sur les écrans tactiles.</p></div>
        <div class="switch" id="sw-anim" role="switch" tabindex="0" aria-checked="${store.get('anim', true)}" aria-label="Animation du curseur"></div>
      </div>
      <h4>Raccourcis clavier</h4>
      <div class="kbd-list">
        <div><kbd>T</kbd> ouvrir le terminal</div>
        <div><kbd>I</kbd> calculateur d'adressage</div>
        <div><kbd>C</kbd> écrire un message</div>
        <div><kbd>Échap</kbd> fermer la fenêtre active</div>
      </div>
      <h4>Vos données</h4>
      <p style="font-size:.86rem">
        Ce site enregistre vos deux préférences ci-dessus dans votre navigateur, rien d'autre.
        <a href="rgpd.html" style="color:var(--accent);text-decoration:underline">Tout est détaillé ici.</a>
      </p>`;

    const bind = (el, onChange) => {
      const flip = () => {
        const next = el.getAttribute('aria-checked') !== 'true';
        el.setAttribute('aria-checked', String(next));
        onChange(next);
      };
      el.addEventListener('click', flip);
      el.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); }
      });
    };
    bind($('#sw-theme', body), (on) => applyTheme(on ? 'sombre' : 'clair'));
    bind($('#sw-anim', body),  (on) => {
      store.set('anim', on);
      const ring = $('#cursor-ring');
      if(!on && ring) ring.remove();
      if(on && !$('#cursor-ring')) cursorRing();
    });
  }
});

/* --- 5.d Fiches projet --- */
const PROJECTS = {
  puissance4: {
    title: 'Puissance 4 en Java', icon: 'code', page: 'puissance4.html',
    tags: ['Java', 'IntelliJ', 'POO', 'IUT Montreuil'],
    html: `
      <p><strong>Contexte.</strong> Projet de première année de BUT informatique à l'IUT de Montreuil.
      L'objectif était de mettre en pratique la programmation orientée objet sur un jeu complet,
      sans interface graphique.</p>
      <h4>Fonctionnalités</h4>
      <ul>
        <li>Plateau 7 colonnes sur 6 lignes, géré en ligne de commande</li>
        <li>Alternance des tours et validation de chaque coup joué</li>
        <li>Détection des alignements horizontaux, verticaux et diagonaux</li>
        <li>Gestion du match nul et des saisies invalides</li>
        <li>Découpage en classes : <code>Plateau</code>, <code>Joueur</code>, <code>Jeu</code></li>
      </ul>
      <h4>Ce que j'en retiens</h4>
      <p>La séparation des responsabilités entre classes, et la logique de détection d'alignements
      dans les quatre directions, qui reste la partie la plus délicate du programme.</p>
      <div class="callout"><b>Compétence clé :</b> conception orientée objet, gestion d'états, algorithmique.</div>`
  },
  wix: {
    title: 'Site vitrine Wix Studio', icon: 'globe', page: 'wix-studio.html',
    tags: ['Wix Studio', 'Design', 'Adaptatif', 'IUT Montreuil'],
    live: 'https://kleyerfinn.wixstudio.com/inspirationjo2028la',
    html: `
      <p><strong>Contexte.</strong> Conception et mise en ligne d'un site vitrine complet avec Wix Studio,
      de la maquette jusqu'à la publication. Le site est en ligne et consultable.</p>
      <h4>Ce que j'ai fait</h4>
      <ul>
        <li>Arborescence des pages et structure de navigation</li>
        <li>Choix graphiques : typographies, palette, hiérarchie visuelle</li>
        <li>Adaptation aux écrans mobiles, tablettes et ordinateurs</li>
        <li>Mise en ligne et réglages de référencement de base</li>
      </ul>
      <h4>Ce que j'en retiens</h4>
      <p>Un site ne se juge pas à son apparence sur grand écran : la contrainte du mobile et la clarté
      du message comptent davantage. Une leçon que j'ai appliquée à ce portfolio.</p>
      <div class="callout"><b>Compétence clé :</b> conception web, design adaptatif, mise en production.</div>`
  },
  montage: {
    title: 'Montage et maintenance PC', icon: 'wrench', page: 'montage-pc.html',
    tags: ['Matériel', 'Windows', 'Diagnostic', 'BIOS et UEFI'],
    html: `
      <p><strong>Contexte.</strong> Depuis 2022, je monte, répare et fais évoluer des ordinateurs pour
      mon entourage. C'est de là qu'est venue mon envie de travailler dans l'informatique.</p>
      <h4>Interventions courantes</h4>
      <ul>
        <li>Assemblage complet : carte mère, processeur, refroidissement, mémoire, stockage, alimentation</li>
        <li>Installation et configuration de Windows, pilotes et outils</li>
        <li>Diagnostic de pannes : écran noir, surchauffe, disque corrompu, mémoire défectueuse</li>
        <li>Mises à niveau ciblées et optimisation thermique</li>
        <li>Réglages BIOS et UEFI, ordre de démarrage, profils mémoire</li>
      </ul>
      <h4>Ce que j'en retiens</h4>
      <p>Une méthode : isoler, tester composant par composant, ne changer qu'une variable à la fois.
      C'est exactement la démarche que j'applique au dépannage réseau.</p>
      <div class="callout"><b>Compétence clé :</b> diagnostic méthodique, support utilisateur, matériel.</div>`
  }
};

function projectApp(key){
  const p = PROJECTS[key];
  return {
    title: p.title, icon: p.icon, w: 640, h: 560,
    render(body){
      body.innerHTML = `
        <div class="chips" style="margin-bottom:18px">${p.tags.map(t => `<span class="chip">${t}</span>`).join('')}</div>
        ${p.live ? `<p><a class="btn btn-primary btn-mini" href="${p.live}" target="_blank" rel="noopener">${ico('arrow-ur')}Voir le site en ligne</a></p>` : ''}
        ${p.html}
        <div class="win-actions">
          <a class="btn btn-ghost btn-mini" href="${p.page}">${ico('doc')}Page complète</a>
          <button class="btn btn-ghost btn-mini" data-app="contact" type="button">${ico('mail')}En parler</button>
        </div>`;
    }
  };
}


/* --- 5.e Jeux, volontairement non référencés dans l'interface ---
   Accessibles par la commande « jeu » ou « p4 » du terminal, la touche P,
   et le code Konami. Rien dans le dock ni dans la section Outils. */
function puissance4App(){
  const R = 6, C = 7;
  return {
    title: 'Puissance 4', icon: 'grid', w: 500, h: 600,
    render(body, win){
      body.innerHTML = `
        <div class="btn-row" style="margin-bottom:14px">
          <label class="field" style="flex-direction:row;align-items:center;gap:8px">
            <span>Niveau</span>
            <select id="p4-level" style="width:auto">
              <option value="1">facile</option>
              <option value="3" selected>moyen</option>
              <option value="5">difficile</option>
            </select>
          </label>
          <button class="btn btn-ghost btn-mini" id="p4-new" type="button">${ico('refresh')}Nouvelle partie</button>
        </div>
        <div class="p4-board" id="p4-board"></div>
        <p class="p4-status" id="p4-status" style="margin-top:14px"></p>
        <p class="p4-note" id="p4-note"></p>
        <p style="font-size:.82rem;text-align:center;margin-top:6px">
          Vous jouez les pions verts, l'ordinateur les pions rouges.
          Portage de mon projet Java, avec une recherche minimax.
        </p>`;

      const boardEl = $('#p4-board', body), statusEl = $('#p4-status', body), noteEl = $('#p4-note', body);
      let grid, over, busy, closeTimer = null;

      function cancelAutoClose(){
        if(closeTimer){ clearInterval(closeTimer); closeTimer = null; }
        noteEl.textContent = '';
      }
      function scheduleAutoClose(){
        cancelAutoClose();
        let n = 5;
        noteEl.innerHTML = `la fenêtre se ferme dans <b id="p4-cd">${n}</b> s, relancez pour continuer`;
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
        statusEl.textContent = 'À vous de jouer, choisissez une colonne.';
      }

      function draw(highlight){
        boardEl.innerHTML = '';
        for(let r = 0; r < R; r++) for(let c = 0; c < C; c++){
          const d = document.createElement('div');
          d.className = 'p4-cell' + (grid[r][c] ? ' p' + grid[r][c] : '');
          d.dataset.col = c;
          if(highlight && highlight.some(([hr, hc]) => hr === r && hc === c)) d.classList.add('win');
          boardEl.appendChild(d);
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

      const WINDOWS = (() => {
        const w = [];
        for(let r = 0; r < R; r++) for(let c = 0; c < C; c++){
          if(c + 3 < C) w.push([[r,c],[r,c+1],[r,c+2],[r,c+3]]);
          if(r + 3 < R) w.push([[r,c],[r+1,c],[r+2,c],[r+3,c]]);
          if(r + 3 < R && c + 3 < C) w.push([[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]]);
          if(r + 3 < R && c - 3 >= 0) w.push([[r,c],[r+1,c-1],[r+2,c-2],[r+3,c-3]]);
        }
        return w;
      })();

      function score(g, p){
        const opp = p === 1 ? 2 : 1;
        let s = 0;
        for(const w of WINDOWS){
          const vals = w.map(([r, c]) => g[r][c]);
          const me = vals.filter(v => v === p).length;
          const him = vals.filter(v => v === opp).length;
          const empty = 4 - me - him;
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
        statusEl.textContent = p === 1
          ? 'Gagné, vous avez battu l’ordinateur.'
          : 'Perdu. Réessayez, ou baissez d’un niveau.';
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
        if(!moves(grid).length){ over = true; statusEl.textContent = 'Match nul, le plateau est plein.'; scheduleAutoClose(); return; }

        busy = true;
        statusEl.textContent = 'L’ordinateur réfléchit.';
        setTimeout(() => {
          const depth = +$('#p4-level', body).value;
          const opts = moves(grid);
          const [chosen] = minimax(grid, depth, -Infinity, Infinity, true);
          const col2 = chosen === null || chosen === undefined ? opts[0] : chosen;
          grid[freeRow(grid, col2)][col2] = 2;
          draw();
          busy = false;
          const w2 = winCells(grid, 2);
          if(w2) return finish(2, w2);
          if(!moves(grid).length){ over = true; statusEl.textContent = 'Match nul, le plateau est plein.'; scheduleAutoClose(); return; }
          statusEl.textContent = 'À vous de jouer.';
        }, 240);
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

function invadersApp(){
  return {
    title: 'Space Invaders', icon: 'grid', w: 560, h: 500, flush: true,
    render(body, ctxWin){
      body.innerHTML = `
        <div class="game-wrap">
          <canvas class="game" id="inv-cv" width="520" height="340" tabindex="0"
                  aria-label="Space Invaders, flèches pour bouger, espace pour tirer"></canvas>
          <div class="btn-row">
            <button class="btn btn-ghost btn-mini" id="inv-left" type="button">${ico('chev-l')}</button>
            <button class="btn btn-primary btn-mini" id="inv-fire" type="button">Tirer</button>
            <button class="btn btn-ghost btn-mini" id="inv-right" type="button">${ico('chev-r')}</button>
            <button class="btn btn-ghost btn-mini" id="inv-restart" type="button">${ico('refresh')}</button>
          </div>
          <p class="game-hint">Flèches pour bouger, espace pour tirer. Les boutons marchent au doigt.</p>
          <p class="game-hint" id="inv-note"></p>
        </div>`;

      const cv = $('#inv-cv', body), ctx = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      const css = getComputedStyle(document.documentElement);
      const GREEN = css.getPropertyValue('--accent').trim() || '#15654a';
      const CLAY  = css.getPropertyValue('--clay').trim() || '#a8492f';
      const BG = '#14171a', PALE = '#e9e7e2';

      const noteEl = $('#inv-note', body);
      let player, bullets, foes, foeShots, score, lives, state, frame, raf;
      let offX, offY, dir, speed, closeTimer = null;
      const keys = {};

      function cancelAutoClose(){
        if(closeTimer){ clearInterval(closeTimer); closeTimer = null; }
        noteEl.textContent = '';
      }
      function scheduleAutoClose(){
        cancelAutoClose();
        let n = 5;
        noteEl.innerHTML = `la fenêtre se ferme dans <b id="inv-cd">${n}</b> s, relancez pour continuer`;
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
        for(let r = 0; r < 4; r++) for(let c = 0; c < 8; c++)
          foes.push({ bx: 34 + c * 56, by: 34 + r * 38, w: 26, h: 18, alive: true });
        offX = 0; offY = 0; dir = 1; speed = 1;
        score = 0; lives = 3; frame = 0; state = 'ready';
        drawReady();
      }

      function drawFoe(x, y, w, h){
        ctx.fillStyle = GREEN;
        ctx.fillRect(x + w * .15, y, w * .7, h * .45);
        ctx.fillRect(x, y + h * .45, w, h * .35);
        ctx.fillRect(x + w * .05, y + h * .8, w * .18, h * .2);
        ctx.fillRect(x + w * .77, y + h * .8, w * .18, h * .2);
        ctx.fillStyle = BG;
        ctx.fillRect(x + w * .26, y + h * .15, w * .16, h * .16);
        ctx.fillRect(x + w * .58, y + h * .15, w * .16, h * .16);
      }

      function drawReady(){
        ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = GREEN; ctx.font = 'bold 21px ui-monospace, monospace';
        ctx.fillText('SPACE INVADERS', W / 2, 124);
        ctx.fillStyle = '#9aa2aa'; ctx.font = '13px ui-monospace, monospace';
        ctx.fillText('flèches pour bouger, espace pour tirer', W / 2, 172);
        ctx.fillText('cliquez ou appuyez sur une touche', W / 2, 198);
        ctx.textAlign = 'left';
      }

      function begin(){ if(state !== 'ready') return; state = 'playing'; loop(); }
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
        ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        foes.forEach(f => { if(f.alive) drawFoe(f.bx + offX, f.by + offY, f.w, f.h); });
        ctx.fillStyle = PALE;
        ctx.fillRect(player.x + player.w * .4, player.y, player.w * .2, player.h * .5);
        ctx.fillRect(player.x, player.y + player.h * .5, player.w, player.h * .5);
        ctx.fillStyle = PALE; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.fillStyle = CLAY; foeShots.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.fillStyle = PALE; ctx.font = 'bold 13px ui-monospace, monospace';
        ctx.fillText('SCORE ' + score, 10, 20);
        ctx.fillStyle = CLAY; ctx.fillText('VIES ' + Math.max(0, lives), W - 76, 20);
      }

      function endScreen(){
        ctx.fillStyle = 'rgba(20,23,26,.85)'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = state === 'win' ? GREEN : CLAY;
        ctx.font = 'bold 24px ui-monospace, monospace';
        ctx.fillText(state === 'win' ? 'VICTOIRE' : 'PARTIE TERMINÉE', W / 2, H / 2 - 8);
        ctx.fillStyle = PALE; ctx.font = '14px ui-monospace, monospace';
        ctx.fillText('score : ' + score, W / 2, H / 2 + 20);
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
      cv.addEventListener('click', () => {
        if(state === 'ready') begin();
        else if(state !== 'playing'){ cancelAnimationFrame(raf); reset(); }
      });

      reset();
      /* sans cela le champ du terminal garde le clavier et le joueur ne bouge pas */
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

const APPS = {
  terminal: terminalApp,
  subnet:   subnetApp,
  cv:       cvApp,
  contact:  contactApp,
  settings: settingsApp,
  puissance4: puissance4App,
  invaders:   invadersApp,
  'proj-puissance4': () => projectApp('puissance4'),
  'proj-wix':        () => projectApp('wix'),
  'proj-montage':    () => projectApp('montage')
};

/* ---------- 6. Démarrage ---------- */
function wireLaunchers(){
  document.addEventListener('click', (e) => {
    const appBtn = e.target.closest('[data-app]');
    if(appBtn){ WM.launch(appBtn.dataset.app); return; }
    const proj = e.target.closest('[data-project]');
    if(proj) WM.launch('proj-' + proj.dataset.project);
  });
  document.addEventListener('keydown', (e) => {
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const proj = e.target.closest && e.target.closest('[data-project]');
    if(proj){ e.preventDefault(); WM.launch('proj-' + proj.dataset.project); }
  });
}

function shortcuts(){
  const map = { t: 'terminal', i: 'subnet', c: 'contact', p: 'puissance4' };
  window.addEventListener('keydown', (e) => {
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const app = map[e.key.toLowerCase()];
    if(app){ e.preventDefault(); WM.launch(app); }
  });
}

/* haut haut bas bas gauche droite gauche droite B A */
function konami(){
  const seq = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  let i = 0;
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    i = k === seq[i] ? i + 1 : (k === seq[0] ? 1 : 0);
    if(i === seq.length){ i = 0; WM.launch('invaders'); }
  });
}

applyTheme(store.get('theme', 'clair'));
themeToggle();
cursorRing();
trackTabs();
contactForm();
wireLaunchers();
shortcuts();
konami();

const wanted = new URLSearchParams(location.search).get('app');
if(wanted && APPS[wanted]) WM.launch(wanted);

})();
