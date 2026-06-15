/* ============================================================
   Kalléssia Leme — Psicóloga · site interativo
   Kairos Digital
   ============================================================ */
(() => {
  'use strict';

  /* ============================================================
     TRAVA DE DEMONSTRAÇÃO (kill switch)
     Mude para true e faça push para BLOQUEAR o site inteiro.
     (Para takedown total e instantâneo, delete o projeto na Vercel.)
     ============================================================ */
  const DEMO_LOCKED = false;
  if (DEMO_LOCKED) {
    document.documentElement.innerHTML =
      `<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#181210;color:#f3eae0;font-family:system-ui,sans-serif;text-align:center;padding:24px">
        <div>
          <div style="font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;color:#cda37c">Kairos Digital</div>
          <h1 style="font-weight:600;margin:14px 0;font-size:clamp(1.4rem,5vw,2.2rem)">Demonstração encerrada</h1>
          <p style="color:#b4a591;max-width:32ch;margin:0 auto">Esta apresentação não está mais disponível.</p>
        </div>
      </body>`;
    return;
  }

  const WHATS = '5562984004697';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- year ---------- */
  $('#yr').textContent = '2026';

  /* ---------- tema claro / escuro ---------- */
  const themeBtn = $('#themeToggle'), themeIco = $('#themeIco');
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    if (themeIco) themeIco.textContent = t === 'light' ? '☀️' : '🌙';
    if (themeBtn) themeBtn.title = t === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f6f0e6' : '#181210');
  }
  let theme = 'light';
  try { theme = localStorage.getItem('kl-theme') || 'light'; } catch (e) {}
  applyTheme(theme);
  themeBtn && themeBtn.addEventListener('click', () => {
    theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(theme);
    try { localStorage.setItem('kl-theme', theme); } catch (e) {}
  });

  /* ---------- spotlight + glow tracking ---------- */
  const spot = $('#spotlight');
  const glowCards = () => $$('.glow-card, [data-tilt]');
  let rafPending = false, mx = innerWidth / 2, my = innerHeight / 2;
  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      spot.style.setProperty('--mx', mx + 'px');
      spot.style.setProperty('--my', my + 'px');
      rafPending = false;
    });
  }, { passive: true });

  /* ---------- 3D tilt + per-card glow ---------- */
  function bindTilt(el) {
    const strength = 9;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--gx', (px * 100) + '%');
      el.style.setProperty('--gy', (py * 100) + '%');
      if (el.matches('[data-tilt], .tilt')) {
        el.style.transform =
          `perspective(900px) rotateY(${(px - .5) * strength}deg) rotateX(${(.5 - py) * strength}deg) translateY(-4px)`;
      }
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  }
  $$('.glow-card, [data-tilt], .tilt').forEach(bindTilt);

  /* ---------- nav scroll / progress / burger ---------- */
  const nav = $('#nav'), prog = $('#scrollProgress');
  addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 30);
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (scrollY / h * 100) + '%';
  }, { passive: true });
  const burger = $('#burger'), links = $('.nav__links');
  burger.addEventListener('click', () => links.classList.toggle('open'));
  $$('.nav__links a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Kairos ambient audio (WebAudio pad) ---------- */
  const mark = $('#kairosMark'), credit = $('#kairosCredit');
  let actx = null, audioOn = false, nodes = [];
  function buildPad() {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    const master = actx.createGain();
    master.gain.value = 0;
    master.connect(actx.destination);
    // soft evolving chord (A minor 9-ish) — calm, spa-like
    const freqs = [110, 164.81, 220, 277.18, 329.63];
    freqs.forEach((f, i) => {
      const o = actx.createOscillator();
      o.type = i % 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      const g = actx.createGain();
      g.gain.value = (i === 0 ? .16 : .07) / freqs.length;
      // gentle LFO for movement
      const lfo = actx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.013;
      const lg = actx.createGain();
      lg.gain.value = g.gain.value * 0.5;
      lfo.connect(lg).connect(g.gain);
      o.connect(g).connect(master);
      o.start(); lfo.start();
      nodes.push(o, lfo);
    });
    const filt = actx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 900;
    return master;
  }
  let master = null;
  function toggleAudio() {
    if (!actx) master = buildPad();
    if (actx.state === 'suspended') actx.resume();
    audioOn = !audioOn;
    const t = actx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.linearRampToValueAtTime(audioOn ? 0.5 : 0, t + (audioOn ? 1.6 : 0.6));
    mark.classList.toggle('on', audioOn);
    mark.title = audioOn ? 'Som ambiente ligado — Kairos' : 'Som ambiente — Kairos Digital';
  }
  mark.addEventListener('click', toggleAudio);
  credit.addEventListener('click', e => { e.preventDefault(); toggleAudio(); });

  /* =========================================================
     SINAIS — autoavaliação clicável + medidor
     ========================================================= */
  const signBtns = $$('.sign');
  const meterFill = $('#signsMeterFill'), signsCount = $('#signsCount'),
        signsLevel = $('#signsLevel'), signsMsg = $('#signsMsg'), signsActions = $('#signsActions');
  const LEVELS = [
    { lvl: 'Toque nos cartões acima',
      msg: 'Selecione os sinais que fazem sentido para você e eu te mostro o próximo passo.' },
    { lvl: 'Sinais leves ✦',
      msg: 'Você reconheceu 1 sinal. Pode ser sutil — mas se cuidar agora evita que ele cresça. Que tal uma conversa de acolhimento?' },
    { lvl: 'Atenção moderada ✦✦',
      msg: 'Dois sinais marcados. Eles costumam se reforçar entre si. Uma análise gratuita já te ajuda a enxergar com clareza.' },
    { lvl: 'Vale buscar apoio ✦✦✦',
      msg: 'Três sinais é um recado importante do seu emocional. Você não precisa lidar com isso sozinha — vamos conversar?' },
    { lvl: 'Hora de cuidar de você 💜',
      msg: 'Você se identificou com todos os sinais. Isso pede um cuidado de verdade, com método e acolhimento. Dê o primeiro passo hoje.' },
  ];
  function updateSigns() {
    const n = signBtns.filter(b => b.getAttribute('aria-pressed') === 'true').length;
    if (meterFill) meterFill.style.width = (n / 4 * 100) + '%';
    if (signsCount) signsCount.textContent = n;
    const L = LEVELS[n];
    if (signsLevel) signsLevel.textContent = L.lvl;
    if (signsMsg) signsMsg.textContent = L.msg;
    if (signsActions) signsActions.hidden = n === 0;
  }
  signBtns.forEach(b => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    updateSigns();
  }));
  updateSigns();

  /* =========================================================
     ANÁLISE GRATUITA — quiz
     ========================================================= */
  const QUESTIONS = [
    { q: 'Como anda a sua relação com você mesma hoje?',
      opts: [
        { t: 'Vivo me cobrando e nada que faço parece suficiente', k: 'auto' },
        { t: 'Me sinto perdida, não sei mais quem eu sou', k: 'ident' },
        { t: 'Estou bem, só quero me conhecer melhor', k: 'cresc' },
        { t: 'Ando exausta, sobrecarregada o tempo todo', k: 'limit' },
      ] },
    { q: 'O que mais pesa nos seus relacionamentos?',
      opts: [
        { t: 'Sinto que me anulo pelo outro', k: 'rel' },
        { t: 'Tenho medo do julgamento e da rejeição', k: 'auto' },
        { t: 'Não consigo dizer "não" nem impor limites', k: 'limit' },
        { t: 'Me sinto invisível, mesmo acompanhada', k: 'ident' },
      ] },
    { q: 'Com que frequência a ansiedade aparece?',
      opts: [
        { t: 'Quase todos os dias, pensamentos acelerados', k: 'ans' },
        { t: 'Em momentos de conflito ou cobrança', k: 'auto' },
        { t: 'Quando preciso decidir algo sobre a relação', k: 'rel' },
        { t: 'Raramente — busco autoconhecimento', k: 'cresc' },
      ] },
    { q: 'Se pudesse mudar UMA coisa agora, seria:',
      opts: [
        { t: 'Ter mais autoestima e me valorizar', k: 'auto' },
        { t: 'Conseguir colocar limites sem culpa', k: 'limit' },
        { t: 'Entender e curar minha relação', k: 'rel' },
        { t: 'Acalmar a mente e a ansiedade', k: 'ans' },
      ] },
    { q: 'Como você prefere ser acompanhada?',
      opts: [
        { t: 'Online, no conforto de casa', k: 'on' },
        { t: 'Presencial, olho no olho', k: 'pre' },
        { t: 'Tanto faz, quero começar logo', k: 'on' },
        { t: 'Quero entender melhor antes de decidir', k: 'on' },
      ] },
  ];
  const PROFILES = {
    auto:  { badge: 'Autoestima & Autoconfiança', title: 'Resgatar o seu valor', topic: 'Autoestima & autoconfiança',
      text: 'Sua leitura aponta uma autocrítica intensa. Um processo focado em autoestima vai silenciar essa voz dura e reconstruir uma imagem de valor sobre você — no seu ritmo, com acolhimento.' },
    rel:   { badge: 'Relacionamentos', title: 'Amar sem se perder', topic: 'Relacionamentos',
      text: 'Há padrões de relação te machucando. Vamos entender esses ciclos, recuperar a sua identidade dentro do vínculo e construir relações mais equilibradas e saudáveis.' },
    limit: { badge: 'Limites & Sobrecarga', title: 'Aprender a dizer "não"', topic: 'Limites & sobrecarga',
      text: 'Você carrega peso demais. O foco será estabelecer limites sem culpa, proteger a sua energia e devolver leveza ao seu dia a dia.' },
    ans:   { badge: 'Ansiedade & Autocrítica', title: 'Acalmar a mente', topic: 'Ansiedade & autocrítica',
      text: 'A ansiedade tem ocupado muito espaço. Vamos organizar os pensamentos acelerados e aliviar a cobrança, criando recursos práticos para o seu bem-estar.' },
    ident: { badge: 'Reconexão & Identidade', title: 'Reencontrar quem você é', topic: 'Autoestima & autoconfiança',
      text: 'Sentir-se invisível ou perdida pede um trabalho de reconexão. Juntas, vamos resgatar a sua voz, os seus desejos e a sua identidade.' },
    cresc: { badge: 'Autoconhecimento', title: 'Crescer com profundidade', topic: 'Ainda não sei dizer',
      text: 'Que lindo buscar autoconhecimento estando bem! A terapia será um espaço de aprofundamento, clareza e expansão pessoal.' },
  };

  const answers = [];
  let step = 0;
  const stage = $('#quizStage'), bar = $('#quizBar');

  function renderStep() {
    const Q = QUESTIONS[step];
    bar.style.width = (step / QUESTIONS.length * 100) + '%';
    stage.innerHTML = `
      <span class="quiz__step">Pergunta ${step + 1} de ${QUESTIONS.length}</span>
      <h3 class="quiz__q">${Q.q}</h3>
      <div class="quiz__opts">
        ${Q.opts.map((o, i) => `<button class="quiz__opt" data-k="${o.k}">
            <b>${String.fromCharCode(65 + i)}</b><span>${o.t}</span></button>`).join('')}
      </div>
      <div class="quiz__nav">
        ${step > 0 ? '<button class="quiz__back" id="qBack">‹ Voltar</button>' : '<span></span>'}
        <span class="muted" style="font-size:.8rem">Sem custo · 100% sigiloso</span>
      </div>`;
    $$('.quiz__opt', stage).forEach(b =>
      b.addEventListener('click', () => { answers[step] = b.dataset.k; step++; step < QUESTIONS.length ? renderStep() : renderResult(); }));
    const back = $('#qBack'); if (back) back.addEventListener('click', () => { step--; renderStep(); });
  }

  function tally() {
    const score = {};
    answers.forEach(k => { if (PROFILES[k]) score[k] = (score[k] || 0) + 1; });
    let best = 'auto', max = -1;
    Object.entries(score).forEach(([k, v]) => { if (v > max) { max = v; best = k; } });
    const modality = answers.includes('pre') ? 'Presencial' : 'Online';
    return { profile: PROFILES[best], modality };
  }

  function renderResult() {
    bar.style.width = '100%';
    const { profile, modality } = tally();
    stage.innerHTML = `
      <div class="quiz__result">
        <span class="badge">✦ ${profile.badge}</span>
        <h3>${profile.title}</h3>
        <p>${profile.text}</p>
        <div class="reco">
          <h4>Recomendação da Kalléssia</h4>
          <b>${profile.badge}</b>
          <p style="margin:.4rem 0 0">Modalidade sugerida: <strong style="color:var(--ink)">${modality}</strong>. O primeiro passo é uma conversa de acolhimento — gratuita e sem compromisso.</p>
        </div>
        <div class="actions">
          <a class="btn btn--solid btn--lg" id="quizToBook">Agendar minha conversa →</a>
          <button class="btn btn--glass" id="quizRestart">Refazer análise</button>
        </div>
      </div>`;
    // pré-preenche o agendamento
    const topicSel = $('#bkTopic');
    if (topicSel) [...topicSel.options].forEach(o => { if (o.value === profile.topic) topicSel.value = o.value; });
    setModality(modality);
    $('#quizRestart').addEventListener('click', () => { answers.length = 0; step = 0; renderStep(); });
    $('#quizToBook').addEventListener('click', () => $('#agenda').scrollIntoView({ behavior: 'smooth' }));
  }
  renderStep();

  /* =========================================================
     AGENDAMENTO — calendário + slots + WhatsApp
     ========================================================= */
  const state = { date: null, time: null, modality: 'Online' };
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DOW = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const SLOTS = ['08:00','09:00','10:00','14:00','15:00','16:00','17:00','19:00'];

  // base "today" — runtime clock for the calendar UI
  const today = new Date(); today.setHours(0,0,0,0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);

  const calGrid = $('#calGrid'), calLabel = $('#calLabel');
  function renderCal() {
    calLabel.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    let html = DOW.map(d => `<span class="dow">${d}</span>`).join('');
    const first = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let i = 0; i < first; i++) html += '<span class="cal-day empty"></span>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const dow = date.getDay();
      const past = date < today;
      const weekend = dow === 0; // domingo fechado
      const disabled = past || weekend;
      const sel = state.date && date.getTime() === state.date.getTime();
      html += `<button class="cal-day${sel ? ' sel' : ''}" data-d="${d}" ${disabled ? 'disabled' : ''}>${d}</button>`;
    }
    calGrid.innerHTML = html;
    $$('.cal-day[data-d]', calGrid).forEach(b => b.addEventListener('click', () => {
      state.date = new Date(view.getFullYear(), view.getMonth(), +b.dataset.d);
      renderCal(); renderSlots(); updateSummary();
    }));
  }
  $('#calPrev').addEventListener('click', () => {
    const prev = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    if (prev.getFullYear() < today.getFullYear() || (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())) return;
    view = prev; renderCal();
  });
  $('#calNext').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });

  const slotsEl = $('#bkSlots');
  function renderSlots() {
    slotsEl.innerHTML = SLOTS.map(s => `<button class="slot${state.time === s ? ' sel' : ''}" data-t="${s}">${s}</button>`).join('');
    $$('.slot', slotsEl).forEach(b => b.addEventListener('click', () => {
      state.time = b.dataset.t; renderSlots(); updateSummary();
    }));
  }
  renderCal(); renderSlots();

  /* modality segmented */
  function setModality(val) {
    state.modality = val;
    $$('#bkModality button').forEach(b => b.classList.toggle('active', b.dataset.val === val));
  }
  $$('#bkModality button').forEach(b => b.addEventListener('click', () => { setModality(b.dataset.val); updateSummary(); }));

  /* summary + send */
  const summary = $('#bkSummary'), sendBtn = $('#bkSend');
  function fmtDate(d) {
    return `${DOW[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
  }
  function updateSummary() {
    const name = $('#bkName').value.trim();
    if (state.date && state.time) {
      summary.innerHTML = `📅 <b>${fmtDate(state.date)}</b> · 🕐 <b>${state.time}</b> · ${state.modality}`;
      sendBtn.setAttribute('aria-disabled', 'false');
    } else {
      summary.textContent = 'Selecione data e horário para liberar o agendamento.';
      sendBtn.setAttribute('aria-disabled', 'true');
    }
    return name;
  }
  $('#bkName').addEventListener('input', updateSummary);

  sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (sendBtn.getAttribute('aria-disabled') === 'true') return;
    const name = $('#bkName').value.trim() || 'Não informado';
    const topic = $('#bkTopic').value;
    const msg =
`Olá Kalléssia! 💜 Vim pelo seu site e gostaria de agendar uma conversa.

*Nome:* ${name}
*Data desejada:* ${fmtDate(state.date)}
*Horário:* ${state.time}
*Modalidade:* ${state.modality}
*Assunto:* ${topic}

Pode confirmar para mim, por favor?`;
    window.open(`https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`, '_blank');
  });
})();
