/**
 * ═══════════════════════════════════════════════════════════
 *  GESTOR · EXPENSE TRACKER — Main Application Logic
 *  May 2026 – December 2027
 * ═══════════════════════════════════════════════════════════
 */

'use strict';

// ─────────────────────────────
//  FIREBASE CONFIG (Compat)
// ─────────────────────────────
const firebaseConfig = {
  projectId: "gestorgt-1776720646",
  appId: "1:404817943311:web:10b141bb3d5269d1fb7c7a",
  storageBucket: "gestorgt-1776720646.firebasestorage.app",
  apiKey: "AIzaSyB3zegEcGBBZ5Pm_D_Yu8oM4iTON_hjoSQ",
  authDomain: "gestorgt-1776720646.firebaseapp.com",
  messagingSenderId: "404817943311",
  projectNumber: "404817943311",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;

// ─────────────────────────────
//  CONSTANTS
// ─────────────────────────────

/** All 20 tracking months */
const MONTHS = [
  { i:0,  name:'Mayo',       y:2026, s:'May' },
  { i:1,  name:'Junio',      y:2026, s:'Jun' },
  { i:2,  name:'Julio',      y:2026, s:'Jul' },
  { i:3,  name:'Agosto',     y:2026, s:'Ago' },
  { i:4,  name:'Septiembre', y:2026, s:'Sep' },
  { i:5,  name:'Octubre',    y:2026, s:'Oct' },
  { i:6,  name:'Noviembre',  y:2026, s:'Nov' },
  { i:7,  name:'Diciembre',  y:2026, s:'Dic' },
  { i:8,  name:'Enero',      y:2027, s:'Ene' },
  { i:9,  name:'Febrero',    y:2027, s:'Feb' },
  { i:10, name:'Marzo',      y:2027, s:'Mar' },
  { i:11, name:'Abril',      y:2027, s:'Abr' },
  { i:12, name:'Mayo',       y:2027, s:'May' },
  { i:13, name:'Junio',      y:2027, s:'Jun' },
  { i:14, name:'Julio',      y:2027, s:'Jul' },
  { i:15, name:'Agosto',     y:2027, s:'Ago' },
  { i:16, name:'Septiembre', y:2027, s:'Sep' },
  { i:17, name:'Octubre',    y:2027, s:'Oct' },
  { i:18, name:'Noviembre',  y:2027, s:'Nov' },
  { i:19, name:'Diciembre',  y:2027, s:'Dic' },
];

/** Category emoji map */
const CAT_EMOJIS = {
  Vivienda:      '🏠',
  Alimentación:  '🍔',
  Transporte:    '🚗',
  Salud:         '💊',
  Entretenimiento:'🎮',
  Servicios:     '💡',
  Educación:     '📚',
  Ropa:          '👕',
  Tecnología:    '💻',
  Otro:          '📌',
};

const STORAGE_KEY = 'gestor_tracker_2627';

// ─────────────────────────────
//  STATE
// ─────────────────────────────

/** Application state (persisted to localStorage) */
let S = {
  blue:        1180,         // ARS per USD (blue rate)
  blueUpdated: null,         // human-readable last update time
  yearView:    2026,         // currently visible year tab
  monthIdx:    0,            // currently selected month (0–19)
  data:        {},           // keyed by String(monthIndex)
};

let editingIdx = null;       // null = new expense; number = index in month array
let _toastTimer = null;      // toast auto-hide timer

// ─────────────────────────────
//  PERSISTENCE (FIREBASE)
// ─────────────────────────────

/** Initialise & return data for a given month index */
function md(idx) {
  const k = String(idx);
  if (!S.data[k]) S.data[k] = { income: 0, savings: 0, expenses: [] };
  return S.data[k];
}

/** Persist full state to Cloud Firestore */
async function save() {
  if (!currentUser) return;
  try { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); // local backup
    await db.collection('users').doc(currentUser.uid).set(S);
  } catch (e) {
    console.error("Error al guardar en la nube:", e);
    toast("⚠️ Error subiendo datos");
  }
}

/** Restore state from Firestore (or local backup pending connection) */
async function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) S = { ...S, ...JSON.parse(raw) }; // Instant local load
    
    if (currentUser) {
      const doc = await db.collection('users').doc(currentUser.uid).get();
      if (doc.exists) {
        S = { ...S, ...doc.data() };
      }
    }
  } catch (e) { 
    console.error("No se pudo cargar de Firestore", e);
  }
}

// ─────────────────────────────
//  AUTH LOGIC
// ─────────────────────────────

function handleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isInAppBrowser = (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || 
                         (ua.indexOf("Instagram") > -1) || (ua.indexOf("WhatsApp") > -1) ||
                         (ua.indexOf("Line") > -1);

  if (isInAppBrowser) {
    document.getElementById('loginMsg').innerHTML = `
      <div style="background: rgba(255,59,48,0.1); color: #ff3b30; padding: 12px; border-radius: 8px; font-weight: 500;">
        ⚠️ Estás usando el navegador de WhatsApp/Instagram.<br><br>
        Por cuestiones de seguridad de Google, para iniciar sesión debés abrir esta página en tu navegador principal.<br><br>
        <b>Tocá el ícono de los 3 puntos (o el de compartir) arriba y elegí "Abrir en el navegador" o "Abrir en Safari/Chrome".</b>
      </div>
    `;
    return;
  }

  // Use redirect on mobile for better UX, popup on desktop
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  document.getElementById('loginMsg').textContent = "Conectando...";

  if (isMobile) {
    auth.signInWithRedirect(provider).catch(err => showError(err));
  } else {
    auth.signInWithPopup(provider).catch(err => showError(err));
  }
}

// Global redirect result handler for mobile
auth.getRedirectResult().catch(err => showError(err));

function showError(err) {
  console.error("Auth error", err);
  if (err.code === 'auth/operation-not-allowed') {
    document.getElementById('loginMsg').innerHTML = `
      El inicio con Google no está activado en tu Firebase Console.<br>
      1. Entra a Firebase > Authentication > Sign in method.<br>
      2. Activa "Google" y guarda.<br>
      3. Recarga la página.`;
  } else {
    document.getElementById('loginMsg').textContent = "Error al iniciar sesión: " + err.message;
  }
}

function handleLogout() {
  auth.signOut().then(() => {
    S.data = {}; // clear local memory var
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });
}

auth.onAuthStateChanged(async (user) => {
  const overlay = document.getElementById('loginOverlay');
  const mainApp = document.getElementById('mainApp');
  
  if (user) {
    currentUser = user;
    overlay.style.display = 'none';
    mainApp.style.display = 'block';
    
    await loadData();
    
    // Sync initial UI state after loading remote data
    document.getElementById('dolarInput').value = S.blue;
    document.getElementById('dolarUpdated').textContent = S.blueUpdated ? 'Actualizado: ' + S.blueUpdated : 'Actualizando…';
    document.querySelectorAll('.year-tab').forEach(t => t.classList.toggle('active', +t.dataset.y === S.yearView));
    
    render();
    fetchDolar();
  } else {
    currentUser = null;
    overlay.style.display = 'flex';
    mainApp.style.display = 'none';
  }
});

// ─────────────────────────────
//  FORMATTERS / CONVERTERS
// ─────────────────────────────

const fmtARS = new Intl.NumberFormat('es-AR');

/** Format number as ARS string (e.g. "$ 1.234.567") */
function fARS(n) { return '$\u202f' + fmtARS.format(Math.round(n)); }

/** Format as USD string  */
function fUSD(n) { return 'USD\u202f' + Math.round(n).toLocaleString('es-AR'); }

/** Convert amount to ARS */
function toARS(amount, currency) { return currency === 'USD' ? amount * S.blue : amount; }

/** Convert ARS to USD */
function toUSD(ars) { return ars / S.blue; }

/** Shorten large numbers for axis labels */
function shortNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return Math.round(n);
}

/** Escape HTML special characters */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Generate a short unique ID */
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

// ─────────────────────────────
//  DÓLAR BLUE API
// ─────────────────────────────

/**
 * Fetch the Dólar Blue sell rate from dolarapi.com.
 * Falls back gracefully (keeps last known value).
 */
async function fetchDolar() {
  try {
    const res  = await fetch('https://dolarapi.com/v1/dolares/blue', { signal: AbortSignal.timeout(7000) });
    const data = await res.json();
    const rate = data.venta ?? data.compra;

    if (rate && rate > 0) {
      S.blue        = rate;
      S.blueUpdated = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      document.getElementById('dolarInput').value           = rate;
      document.getElementById('dolarUpdated').textContent   = 'Actualizado: ' + S.blueUpdated;
      document.getElementById('liveDot').className          = 'live-dot';
      save();
      render();
    }
  } catch (e) {
    document.getElementById('dolarUpdated').textContent = 'Sin conexión · editá el valor manual';
    document.getElementById('liveDot').className        = 'live-dot error';
  }
}

/** Trigger a manual rate refresh with visual feedback */
function refreshDolar() {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spin');
  setTimeout(() => btn.classList.remove('spin'), 600);
  document.getElementById('dolarUpdated').textContent = 'Actualizando…';
  fetchDolar();
}

/** Called when user manually types a rate */
function setDolar(value) {
  const n = parseFloat(value);
  if (n > 0) { S.blue = n; save(); render(); }
}

// ─────────────────────────────
//  NAVIGATION
// ─────────────────────────────

/** Switch Year view */
function selectYear(year) {
  S.yearView = year;
  const first = MONTHS.find(m => m.y === year);
  S.monthIdx  = first.i;
  document.querySelectorAll('.year-tab').forEach(t =>
    t.classList.toggle('active', +t.dataset.y === year)
  );
  save();
  render();
}

/** Switch month */
function selectMonth(i) {
  S.monthIdx = i;
  save();
  render();
}

// ─────────────────────────────
//  CARD INPUTS
// ─────────────────────────────

function setIncome(v)  { md(S.monthIdx).income  = parseFloat(v) || 0; save(); updateCards(); updateProgress(); renderChart(); }
function setSavings(v) { md(S.monthIdx).savings = parseFloat(v) || 0; save(); }

// ─────────────────────────────
//  EXPENSE ACTIONS
// ─────────────────────────────

/** Cycle expense status: pending → paid → upcoming → pending */
function cycleStatus(idx) {
  const exp   = md(S.monthIdx).expenses[idx];
  const cycle = { pending: 'paid', paid: 'upcoming', upcoming: 'pending' };
  exp.status  = cycle[exp.status] || 'pending';
  save();
  renderTable();
  updateCards();
  updateProgress();
}

/** Delete an expense at index */
function delExpense(idx) {
  md(S.monthIdx).expenses.splice(idx, 1);
  save();
  render();
  toast('🗑️ Gasto eliminado');
}

/** Start inline amount editing (double-click) */
function startInlineEdit(idx) {
  const exp  = md(S.monthIdx).expenses[idx];
  const cell = document.getElementById('amtCell_' + idx);

  cell.innerHTML = `<input class="inline-inp" id="iinp_${idx}" type="number"
    value="${exp.amount}" step="0.01" min="0" />`;

  const inp = document.getElementById('iinp_' + idx);
  inp.focus();
  inp.select();

  const commit = () => {
    const val = parseFloat(inp.value);
    if (!isNaN(val) && val >= 0) exp.amount = val;
    save();
    renderTable();
    updateCards();
    updateProgress();
    renderChart();
  };

  inp.addEventListener('blur',    commit);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { renderTable(); }
  });
}

// ─────────────────────────────
//  MODAL
// ─────────────────────────────

/** Open the add/edit modal. idx = null for new expense. */
function openModal(idx = null) {
  editingIdx = idx;
  const isEdit = idx !== null;

  document.getElementById('modalTitle').textContent      = isEdit ? 'Editar Gasto' : 'Nuevo Gasto';
  document.getElementById('repeatWrap').style.display    = isEdit ? 'none' : '';

  if (isEdit) {
    const exp = md(S.monthIdx).expenses[idx];
    document.getElementById('fName').value    = exp.name;
    document.getElementById('fAmount').value  = exp.amount;
    document.getElementById('fCurrency').value= exp.currency;
    document.getElementById('fCat').value     = exp.category;
    document.getElementById('fStatus').value  = exp.status;
    document.getElementById('fNote').value    = exp.note || '';
  } else {
    document.getElementById('expForm').reset();
    document.getElementById('fCurrency').value = 'ARS';
    document.getElementById('fStatus').value   = 'pending';
    document.getElementById('fRepeat').value   = 'once';
  }

  updateArsPreview();
  document.getElementById('overlay').classList.add('open');
  setTimeout(() => document.getElementById('fName').focus(), 120);
}

/** Close the modal */
function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  editingIdx = null;
}

/** Close when clicking the overlay backdrop */
function overlayClick(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

/** Update the ARS equivalent preview inside the modal */
function updateArsPreview() {
  const cur  = document.getElementById('fCurrency').value;
  const wrap = document.getElementById('arsPreviewWrap');
  if (cur === 'USD') {
    wrap.style.display = '';
    const amt = parseFloat(document.getElementById('fAmount').value) || 0;
    document.getElementById('arsPreview').textContent = fARS(amt * S.blue);
  } else {
    wrap.style.display = 'none';
  }
}

// ─────────────────────────────
//  SAVE EXPENSE
// ─────────────────────────────

/** Handle form submit — create or update expense(s) */
function saveExpense(e) {
  e.preventDefault();

  const name     = document.getElementById('fName').value.trim();
  const amount   = parseFloat(document.getElementById('fAmount').value);
  const currency = document.getElementById('fCurrency').value;
  const category = document.getElementById('fCat').value;
  const status   = document.getElementById('fStatus').value;
  const note     = document.getElementById('fNote').value.trim();
  const repeat   = document.getElementById('fRepeat').value;

  if (!name || isNaN(amount) || amount <= 0) return;

  const base = { id: genId(), name, amount, currency, category, status, note };

  if (editingIdx !== null) {
    // ── EDIT existing ──
    const old = md(S.monthIdx).expenses[editingIdx];
    md(S.monthIdx).expenses[editingIdx] = { ...base, id: old.id };
    toast('✏️ Gasto actualizado');
  } else {
    // ── NEW expense — propagate per repeat setting ──
    const targets = getTargetMonths(repeat);
    targets.forEach(mi => md(mi).expenses.push({ ...base, id: genId() }));
    const label = targets.length > 1
      ? `Agregado en ${targets.length} meses`
      : 'Gasto agregado';
    toast('✅ ' + label);
  }

  save();
  closeModal();
  render();
}

/**
 * Return the month indices to which this expense should be added,
 * based on the repeat option.
 */
function getTargetMonths(repeat) {
  const cur = S.monthIdx;
  const all = MONTHS.map(m => m.i);
  switch (repeat) {
    case 'rest-year':  return MONTHS.filter(m => m.y === S.yearView && m.i >= cur).map(m => m.i);
    case 'all':        return all.filter(i => i >= cur);
    case 'bimonthly':  return all.filter(i => i >= cur).filter((_, j) => j % 2 === 0);
    default:           return [cur];
  }
}

// ─────────────────────────────
//  RENDER ORCHESTRATOR
// ─────────────────────────────

/** Full re-render */
function render() {
  renderTabs();
  renderTable();
  updateCards();
  updateProgress();
  renderChart();

  const m = MONTHS[S.monthIdx];
  document.getElementById('monthLabel').textContent = `${m.name} ${m.y}`;
  document.getElementById('chartYearLbl').textContent = S.yearView;
}

// ─────────────────────────────
//  TABS
// ─────────────────────────────

function renderTabs() {
  const mths = MONTHS.filter(m => m.y === S.yearView);
  document.getElementById('monthTabs').innerHTML = mths
    .map(m => `<button class="month-tab ${m.i === S.monthIdx ? 'active' : ''}"
                 onclick="selectMonth(${m.i})">${m.name}</button>`)
    .join('');
}

// ─────────────────────────────
//  EXPENSE TABLE
// ─────────────────────────────

function renderTable() {
  const { expenses } = md(S.monthIdx);
  const tbody = document.getElementById('tbody');
  const tfoot = document.getElementById('tfoot');

  if (!expenses.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
      <span class="ei">📭</span>
      <p>No hay gastos este mes todavía</p>
      <small>Clickeá "Agregar gasto" para empezar</small>
    </div></td></tr>`;
    tfoot.innerHTML = '';
    return;
  }

  const STATUS_CLASS = { paid: 's-paid', pending: 's-pending', upcoming: 's-upcoming' };
  const STATUS_LABEL = { paid: '✓ Pagado', pending: '⏳ Pendiente', upcoming: '📅 Próximo' };

  tbody.innerHTML = expenses.map((exp, i) => {
    const arsAmt = toARS(exp.amount, exp.currency);
    const isUSD  = exp.currency === 'USD';
    const monto  = isUSD ? `USD ${exp.amount.toLocaleString('es-AR')}` : fARS(exp.amount);
    const convARS= isUSD ? fARS(arsAmt) : '—';

    return `<tr class="erow${exp.status === 'paid' ? ' paid' : ''}">
      <td><div class="name-cell">
        <div class="cat-badge">${CAT_EMOJIS[exp.category] || '📌'}</div>
        <div>
          <div class="ename">${esc(exp.name)}</div>
          ${exp.note ? `<span class="enote">${esc(exp.note)}</span>` : ''}
        </div>
      </div></td>
      <td>
        <span class="monto" id="amtCell_${i}"
              ondblclick="startInlineEdit(${i})"
              title="Doble clic para editar el monto">
          ${monto}<span class="edit-hint">✎</span>
        </span>
      </td>
      <td class="col-conv">${convARS}</td>
      <td class="col-usd"><span>≈ ${fUSD(toUSD(arsAmt))}</span></td>
      <td>
        <button class="sbtn ${STATUS_CLASS[exp.status]}"
                onclick="cycleStatus(${i})">
          ${STATUS_LABEL[exp.status]}
        </button>
      </td>
      <td>
        <button class="abtn" onclick="openModal(${i})" title="Editar">✏️</button>
        <button class="abtn" onclick="delExpense(${i})"  title="Eliminar">🗑️</button>
      </td>
    </tr>`;
  }).join('');

  // Total footer row
  const total = expenses.reduce((s, e) => s + toARS(e.amount, e.currency), 0);
  tfoot.innerHTML = `<tr class="tfoot-row">
    <td colspan="2">Total del mes</td>
    <td>${fARS(total)}</td>
    <td class="col-usd"><span>≈ ${fUSD(toUSD(total))}</span></td>
    <td colspan="2"></td>
  </tr>`;
}

// ─────────────────────────────
//  SUMMARY CARDS
// ─────────────────────────────

function updateCards() {
  const { expenses, income } = md(S.monthIdx);
  const total = expenses.reduce((s, e) => s + toARS(e.amount, e.currency), 0);
  const avail = income - total;

  document.getElementById('incomeInp').value  = income  || '';
  document.getElementById('savingsInp').value = md(S.monthIdx).savings || '';
  document.getElementById('totalGastos').textContent = fARS(total);
  document.getElementById('totalUSD').textContent    = '≈ ' + fUSD(toUSD(total));

  const dEl = document.getElementById('disponible');
  dEl.textContent = fARS(avail);
  dEl.className   = 'card-val ' + (avail >= 0 ? 'pos' : 'neg');
  document.getElementById('disponibleUSD').textContent = '≈ ' + fUSD(toUSD(Math.abs(avail)));
}

// ─────────────────────────────
//  PROGRESS BAR
// ─────────────────────────────

function updateProgress() {
  const { expenses, income } = md(S.monthIdx);
  const total = expenses.reduce((s, e) => s + toARS(e.amount, e.currency), 0);
  const pct   = income > 0 ? Math.min((total / income) * 100, 100) : 0;
  const cls   = pct > 90 ? 'pf-bad' : pct > 70 ? 'pf-warn' : 'pf-ok';

  document.getElementById('progBar').style.width = pct + '%';
  document.getElementById('progBar').className   = 'progress-fill ' + cls;
  document.getElementById('progPct').textContent = pct.toFixed(1) + '%';
  document.getElementById('progDetail').textContent = income > 0
    ? `${fARS(total)} de ${fARS(income)} comprometidos`
    : 'Sin ingresos cargados';
}

// ─────────────────────────────
//  CANVAS CHART
// ─────────────────────────────

/**
 * Draw an animated bar chart on <canvas id="chart">.
 * Shows income (faint) and expense (vibrant) bars for each month.
 */
function renderChart() {
  const canvas = document.getElementById('chart');
  if (!canvas) return;

  canvas.width  = canvas.offsetWidth  || 300;
  canvas.height = canvas.offsetHeight || 220;

  const ctx  = canvas.getContext('2d');
  const W    = canvas.width;
  const H    = canvas.height;
  const mths = MONTHS.filter(m => m.y === S.yearView);

  const pad     = { t: 18, r: 16, b: 38, l: 58 };
  const cW      = W - pad.l - pad.r;
  const cH      = H - pad.t - pad.b;
  const totals  = mths.map(m => md(m.i).expenses.reduce((s, e) => s + toARS(e.amount, e.currency), 0));
  const incomes = mths.map(m => md(m.i).income || 0);
  const maxVal  = Math.max(...totals, ...incomes, 1);
  const gw      = cW / mths.length;
  const bw      = gw * 0.38;
  const activei = mths.findIndex(m => m.i === S.monthIdx);

  ctx.clearRect(0, 0, W, H);

  // Grid lines + Y axis labels
  for (let g = 0; g <= 4; g++) {
    const y = pad.t + cH - (g / 4) * cH;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth   = 1;
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + cW, y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(120,119,116,0.7)';
    ctx.font      = '10px DM Sans, Helvetica Neue, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(shortNum(maxVal * g / 4), pad.l - 6, y + 3);
  }

  // Animate bars with rAF
  let frame      = 0;
  const FRAMES   = 22;
  function drawFrame() {
    ctx.clearRect(pad.l, pad.t, cW, cH + 1);

    // Redraw grid (cleared above)
    for (let g = 0; g <= 4; g++) {
      const y = pad.t + cH - (g / 4) * cH;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth   = 1;
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + cW, y);
      ctx.stroke();
    }

    const progress = frame >= FRAMES ? 1 : easeOutCubic(frame / FRAMES);

    mths.forEach((m, j) => {
      const cx     = pad.l + gw * j + gw / 2;
      const active = j === activei;

      // Income bar (faint background)
      if (incomes[j] > 0) {
        const ih = (incomes[j] / maxVal) * cH * progress;
        const gI = ctx.createLinearGradient(0, pad.t + cH - ih, 0, pad.t + cH);
        gI.addColorStop(0, 'rgba(0,0,0,0.10)');
        gI.addColorStop(1, 'rgba(0,0,0,0.02)');
        ctx.fillStyle = gI;
        ctx.fillRect(cx - bw, pad.t + cH - ih, bw * 0.9, ih);
      }

      // Expense bar (vibrant)
      if (totals[j] > 0) {
        const th = (totals[j] / maxVal) * cH * progress;
        ctx.fillStyle = active ? '#111111' : 'rgba(0,0,0,0.22)';
        drawRoundBar(ctx, cx + bw * 0.1, pad.t + cH - th, bw * 0.85, th, 4);
        ctx.fill();
      }

      // Month label
      ctx.fillStyle = active ? '#111111' : 'rgba(120,119,116,0.6)';
      ctx.font      = `${active ? '600 ' : ''}10px DM Sans, Helvetica Neue, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(m.s, cx + bw * 0.5 - bw * 0.05, pad.t + cH + 18);
    });

    if (frame < FRAMES) { frame++; requestAnimationFrame(drawFrame); }
  }

  drawFrame();
}

/** Rounded-top rectangle path */
function drawRoundBar(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, Math.max(h, 0) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Easing function for chart animation */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

// ─────────────────────────────
//  TOAST NOTIFICATION
// ─────────────────────────────

/**
 * Show a toast notification.
 * @param {string} msg - Message to display (can include emoji)
 */
function toast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ─────────────────────────────
//  INITIALISATION
// ─────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  
  // Auth bindings
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Note: loadData() and render() are now triggered by onAuthStateChanged!

  // 6. Close modal on Escape key
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // 7. Redraw chart on container resize
  const chartEl = document.getElementById('chart');
  if (chartEl && window.ResizeObserver) {
    new ResizeObserver(() => renderChart()).observe(chartEl.parentElement);
  }

  // 8. Wire up form submission
  document.getElementById('expForm').addEventListener('submit', saveExpense);
});
