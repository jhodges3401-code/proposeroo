// Proposeroo: original code, no dependencies, no network calls. All data lives in localStorage.
import { PRESETS, rates, itemAmount, quoteTotals, fmt } from './calc.js';
// Live Gumroad listings.
export const PRO_URL = 'https://jhodges6.gumroad.com/l/kzjcwp?utm_source=proposeroo';      // $12 single license
export const PRO_TEAM_URL = 'https://jhodges6.gumroad.com/l/ekunvc?utm_source=proposeroo'; // $49 team of 5
const UNLOCK_CODES = { 'ROO-PRO-2026': 'single', 'ROO-TEAM5-2026': 'team' }; // honor-system codes shown on the Gumroad content page
const KEY = 'proposeroo_v1';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const uid = p => p + '_' + Math.random().toString(36).slice(2, 9);
const today = (d = 0) => { const t = new Date(); t.setDate(t.getDate() + d); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const get = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const set = (o, p, v) => { const k = p.split('.'); const last = k.pop(); k.reduce((a, x) => a[x] ??= {}, o)[last] = v; };

const DEFAULT_TERMS = ['Source files / raw project files not included unless listed as a deliverable.',
  'Unlimited revisions are not included. Scope includes the revision rounds listed above.',
  'Third-party costs (stock, plugins, ads, hosting) billed separately unless noted.',
  'Work pauses if invoice is unpaid >7 days past due.',
  'Timeline assumes client feedback within 3 business days per round.'].map(t => '• ' + t).join('\n');
const ACME = [['Discovery & brief', 4, 'Kickoff, research, requirements'], ['Design concepts', 12, '2 concepts + 1 revision round'], ['Build / implementation', 20, 'Dev or production work'], ['Revisions & QA', 6, 'Client feedback cycles'], ['Launch & handoff', 3, 'Docs, training, go-live']];
function newQuote(n) {
  return { id: uid('q'), number: `Q-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`, status: 'draft',
    client: { name: 'Jordan Lee', company: 'Acme Co', email: '' }, project: 'Website redesign', issueDate: today(), validUntil: today(14), template: 'clean',
    sections: { intro: 'Thanks for the chance to quote on this project. Below is the scope, timeline and price we discussed.', scope: 'Web design + build of a 5-page marketing site.', deliverables: ['Homepage + 4 inner pages', 'Responsive build', 'Launch checklist and handoff doc'], timeline: 'About 4 weeks from deposit.', terms: DEFAULT_TERMS, acceptance: 'To accept, reply "Approved" to this email or sign and return this PDF. Work starts once the deposit is received.' },
    items: ACME.map(([label, qty, notes]) => ({ id: uid('li'), label, notes, qty, unit: 'hour', price: null, usesRate: true, optional: false })),
    adjust: { contingencyPct: 0.15, rushPct: 0, expenses: 150, discountPct: 0, taxPct: 0, depositPct: 0.4 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}
function fresh() {
  const q = newQuote(1);
  return { schemaVersion: 1, profile: { businessName: 'Your Studio', email: 'you@example.com', address: '', logoDataUrl: '', accent: '#1f6feb', currency: 'USD', locale: 'en-US' },
    rate: { preset: 'Designer', ...PRESETS.Designer }, services: ACME.map(([name, defaultQty, notes]) => ({ id: uid('svc'), name, unit: 'hour', defaultQty, defaultPrice: null, notes })),
    quotes: [q], currentId: q.id, counter: 1, license: { code: '', tier: null, verifiedAt: null } };
}
export function validate(s) {
  if (!s || s.schemaVersion !== 1 || !Array.isArray(s.quotes) || !s.profile || !s.rate) throw new Error('Not a Proposeroo backup file');
  return s;
}
let S, isNew = false; try { S = validate(JSON.parse(localStorage.getItem(KEY))); } catch { S = fresh(); isNew = true; }
const isPro = () => !!S.license?.tier;
const Q = () => S.quotes.find(q => q.id === S.currentId) || S.quotes[0];
const save = () => { Q().updatedAt = new Date().toISOString(); localStorage.setItem(KEY, JSON.stringify(S)); };
const money = v => fmt(v, S.profile.currency, S.profile.locale);

function canAddQuote() { if (isPro() || S.quotes.length < 1) return true; $('#upsell').showModal(); return false; }
function addQuote(q) { S.quotes.push(q); S.currentId = q.id; save(); bindAll(); }

function renderItems() {
  const q = Q();
  $('#items').innerHTML = q.items.map((it, i) => `<tr data-i="${i}"><td><input data-k="label" value="${esc(it.label)}"></td>
  <td><input type="number" data-k="qty" value="${it.qty}"></td><td><select data-k="unit">${['hour', 'flat', 'item'].map(u => `<option ${u === it.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></td>
  <td><input type="number" data-k="price" value="${it.price ?? ''}" ${it.usesRate ? 'disabled' : ''}></td><td><input type="checkbox" data-k="usesRate" ${it.usesRate ? 'checked' : ''}></td>
  <td><input type="checkbox" data-k="optional" ${it.optional ? 'checked' : ''}></td><td><button data-del="${i}" aria-label="Remove">✕</button></td></tr>`).join('');
}
function renderDoc() {
  const q = Q(), p = S.profile, t = quoteTotals(q, S.rate), doc = $('#doc');
  doc.className = 'doc ' + q.template; doc.style.setProperty('--accent', p.accent || '#1f6feb');
  const rows = q.items.map(it => { const price = it.usesRate ? t.rate : +it.price || 0;
    return `<tr><td>${esc(it.label)}${it.optional ? ' <span class="muted">(optional, not in total)</span>' : ''}${it.notes ? `<div class="muted">${esc(it.notes)}</div>` : ''}</td><td class="r">${it.qty} ${it.unit === 'hour' ? 'h' : ''}</td><td class="r">${money(price)}</td><td class="r">${money(itemAmount(it, t.rate))}</td></tr>`; }).join('');
  const line = (l, v, c = '') => v ? `<tr class="${c}"><td colspan="3" class="r">${l}</td><td class="r">${money(v)}</td></tr>` : '';
  const sec = (h, b) => b ? `<section><h3>${h}</h3><div>${esc(b).replace(/\n/g, '<br>')}</div></section>` : '';
  doc.innerHTML = `${isPro() ? '' : '<div class="watermark" id="wm">Made with Proposeroo Free</div>'}
  <div class="head"><div>${p.logoDataUrl ? `<img class="logo" id="docLogo" src="${p.logoDataUrl}" alt="logo"><br>` : ''}<b>${esc(p.businessName)}</b><div class="muted">${esc(p.email)} ${esc(p.address)}</div></div>
  <div style="text-align:right"><h1>Proposal & Quote</h1><div>${esc(q.number)}</div><div class="muted">Issued ${esc(q.issueDate)} · Valid until ${esc(q.validUntil)}</div></div></div>
  <p><b>Prepared for:</b> ${esc(q.client.name)}${q.client.company ? ', ' + esc(q.client.company) : ''}<br><b>Project:</b> ${esc(q.project)}</p>
  ${sec('Introduction', q.sections.intro)}${sec('Scope', q.sections.scope)}
  ${q.sections.deliverables?.filter(Boolean).length ? `<section><h3>Deliverables</h3><ul>${q.sections.deliverables.filter(Boolean).map(d => `<li>${esc(d)}</li>`).join('')}</ul></section>` : ''}
  <section><h3>Investment</h3><table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody>
  <tbody class="tot">${line('Subtotal', t.base)}${line('Contingency', t.contingency)}${line('Rush', t.rush)}${line('Expenses', t.expenses)}
  ${q.adjust.discountPct ? line(`Discount (${Math.round(q.adjust.discountPct * 100)}%)`, -(t.base + t.contingency + t.rush + t.expenses) * q.adjust.discountPct) : ''}${line('Tax', t.tax)}
  <tr class="grand"><td colspan="3" class="r">Total</td><td class="r" id="docTotal">${money(t.grand)}</td></tr>
  <tr><td colspan="3" class="r">Deposit due to start (${Math.round((q.adjust.depositPct ?? .4) * 100)}%)</td><td class="r" id="docDeposit">${money(t.deposit)}</td></tr>
  <tr><td colspan="3" class="r">Balance on delivery</td><td class="r">${money(t.balance)}</td></tr></tbody></table></section>
  ${sec('Timeline', q.sections.timeline)}${sec('Terms', q.sections.terms)}${sec('How to accept', q.sections.acceptance)}
  <div class="foot">This document is a quote, not a tax or legal opinion.${isPro() ? '' : ' · Made with Proposeroo'}</div>`;
  const b = $('#floorBadge');
  if (t.clearsFloor === null) { b.className = 'badge'; b.textContent = 'No hourly items'; }
  else { b.className = 'badge ' + (t.clearsFloor ? 'ok' : 'bad'); b.textContent = `${t.clearsFloor ? 'Clears' : 'Below'} floor · ${money(t.effectiveHourly)}/hr vs ${money(t.floor)}/hr`; }
  const r = rates(S.rate);
  $('#rateOut').textContent = `Survival (floor) ${money(r.survival)}/hr · Recommended ${money(r.recommended)}/hr · Day ${money(r.day)} · ${Math.round(r.hours)} billable h/yr`;
}
function renderLists() {
  $('#quotePick').innerHTML = S.quotes.map(q => `<option value="${q.id}" ${q.id === S.currentId ? 'selected' : ''}>${esc(q.number)} · ${esc(q.client.company || q.client.name)}</option>`).join('');
  $('#qList').innerHTML = S.quotes.map(q => `<li>${esc(q.number)} – ${esc(q.project)} (${money(quoteTotals(q, S.rate).grand)})</li>`).join('');
  $('#svcList').innerHTML = S.services.map((s, i) => `<li>${esc(s.name)} · ${s.defaultQty} ${s.unit} · ${s.defaultPrice == null ? 'my rate' : money(s.defaultPrice)} <button data-sdel="${i}">✕</button></li>`).join('');
  $('#addSvc').innerHTML = '<option value="">+ From library…</option>' + S.services.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  $('#proState').textContent = isPro() ? `Pro unlocked (${S.license.tier === 'team' ? 'team of 5' : 'single license'}). Thank you!` : 'Free plan: watermark on PDF, 1 saved quote.';
}
function bindFields() {
  const q = Q();
  $$('[data-f]').forEach(el => { const v = get(q, el.dataset.f); el.value = el.hasAttribute('data-pct') ? +((v || 0) * 100).toFixed(4) : (v ?? ''); });
  $$('[data-r]').forEach(el => { const v = S.rate[el.dataset.r]; el.value = el.hasAttribute('data-pct') ? +(v * 100).toFixed(4) : v; });
  $$('[data-p]').forEach(el => el.value = S.profile[el.dataset.p] ?? '');
  $('#preset').value = S.rate.preset; $('#deliv').value = (q.sections.deliverables || []).join('\n');
}
function bindAll() { bindFields(); renderItems(); renderLists(); renderDoc(); }
const refresh = () => { save(); renderLists(); renderDoc(); };

// wiring
$('#preset').innerHTML = Object.keys(PRESETS).map(k => `<option>${k}</option>`).join('');
$('#preset').onchange = e => { S.rate = { preset: e.target.value, ...PRESETS[e.target.value] }; bindFields(); refresh(); };
document.addEventListener('input', e => {
  const el = e.target, num = el.type === 'number', val = num ? (el.value === '' ? 0 : +el.value) * (el.hasAttribute('data-pct') ? 0.01 : 1) : el.value;
  if (el.dataset.f) set(Q(), el.dataset.f, val);
  else if (el.dataset.r) { S.rate[el.dataset.r] = val; S.rate.preset = 'Custom'; $('#preset').value = 'Custom'; }
  else if (el.dataset.p) S.profile[el.dataset.p] = val;
  else if (el.id === 'deliv') Q().sections.deliverables = el.value.split('\n');
  else if (el.dataset.k) { const it = Q().items[el.closest('tr').dataset.i]; it[el.dataset.k] = el.type === 'checkbox' ? el.checked : num ? (el.value === '' ? null : +el.value) : el.value; if (el.dataset.k === 'usesRate') renderItems(); }
  else return;
  refresh();
});
document.addEventListener('change', e => { if (e.target.matches('select[data-f],select[data-p],select[data-k],input[type=checkbox]')) e.target.dispatchEvent(new Event('input', { bubbles: true })); });
$('#items').onclick = e => { const d = e.target.dataset.del; if (d != null) { Q().items.splice(+d, 1); renderItems(); refresh(); } };
$('#addItem').onclick = () => { Q().items.push({ id: uid('li'), label: 'New item', qty: 1, unit: 'hour', price: null, usesRate: true, optional: false }); renderItems(); refresh(); };
$('#addSvc').onchange = e => { const s = S.services.find(x => x.id === e.target.value); if (!s) return; Q().items.push({ id: uid('li'), serviceId: s.id, label: s.name, notes: s.notes, qty: s.defaultQty, unit: s.unit, price: s.defaultPrice, usesRate: s.defaultPrice == null, optional: false }); e.target.value = ''; renderItems(); refresh(); };
$('#svcAdd').onclick = () => { const name = $('#svcName').value.trim(); if (!name) return; const pr = $('#svcPrice').value; S.services.push({ id: uid('svc'), name, unit: $('#svcUnit').value, defaultQty: +$('#svcQty').value || 1, defaultPrice: pr === '' ? null : +pr, notes: '' }); $('#svcName').value = ''; refresh(); };
$('#svcList').onclick = e => { const d = e.target.dataset.sdel; if (d != null) { S.services.splice(+d, 1); refresh(); } };
$('#quotePick').onchange = e => { S.currentId = e.target.value; save(); bindAll(); };
$('#newQ').onclick = () => { if (canAddQuote()) addQuote(newQuote(++S.counter)); };
$('#dupQ').onclick = () => { if (!canAddQuote()) return; const c = structuredClone(Q()); Object.assign(c, { id: uid('q'), number: `Q-${new Date().getFullYear()}-${String(++S.counter).padStart(3, '0')}`, status: 'draft', issueDate: today(), validUntil: today(14), createdAt: new Date().toISOString() }); c.items.forEach(i => i.id = uid('li')); addQuote(c); };
$('#delQ').onclick = () => { if (S.quotes.length < 2) { const q = newQuote(++S.counter); S.quotes = [q]; S.currentId = q.id; } else { S.quotes = S.quotes.filter(q => q.id !== S.currentId); S.currentId = S.quotes[0].id; } save(); bindAll(); };
$$('.tabs button').forEach(b => b.onclick = () => { $$('.tabs button').forEach(x => x.classList.toggle('on', x === b)); $$('.tab').forEach(t => t.hidden = t.id !== 'tab-' + b.dataset.tab); });
$('#printBtn').onclick = () => window.print();
$('#logo').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { S.profile.logoDataUrl = r.result; refresh(); }; r.readAsDataURL(f); };
$('#exportJson').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = `proposeroo-backup-${today()}.json`; a.click(); };
$('#importJson').onchange = async e => { try { S = validate(JSON.parse(await e.target.files[0].text())); localStorage.setItem(KEY, JSON.stringify(S)); bindAll(); alert('Backup restored.'); } catch (err) { alert(err.message); } };
$('#proSingle').href = PRO_URL; $('#proTeam').href = PRO_TEAM_URL; $$('.proLink').forEach(a => a.href = PRO_URL);
$('#closeUpsell').onclick = () => $('#upsell').close();
$('#goUnlock').onclick = () => { $('#upsell').close(); $('[data-tab=settings]').click(); $('#unlockCode').focus(); };
$('#unlockBtn').onclick = () => { const tier = UNLOCK_CODES[$('#unlockCode').value.trim().toUpperCase()];
  if (tier) S.license = { code: $('#unlockCode').value.trim().toUpperCase(), tier, verifiedAt: new Date().toISOString() };
  $('#unlockMsg').textContent = tier ? 'Pro unlocked. Thank you!' : 'That code did not match. Check your Gumroad receipt.'; refresh(); };
bindAll(); if (isNew) save();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js');
window.__roo = { get state() { return S; }, quoteTotals, rates };
