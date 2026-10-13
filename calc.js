// Proposeroo calc: pure functions ported from Rate Mini (exp-005) + Rate & Quote Pack "Quote Builder" (exp-006).
export const PRESETS = {
  Designer:   { takeHome:65000, taxRate:0.28, buffer:0.15, weeks:48, daysPerWeek:5, hoursPerDay:8, utilization:0.5,  overhead:8300 },
  Writer:     { takeHome:60000, taxRate:0.28, buffer:0.12, weeks:48, daysPerWeek:5, hoursPerDay:7, utilization:0.55, overhead:5400 },
  Developer:  { takeHome:90000, taxRate:0.30, buffer:0.15, weeks:48, daysPerWeek:5, hoursPerDay:8, utilization:0.55, overhead:9400 },
  'Marketer/VA': { takeHome:55000, taxRate:0.28, buffer:0.12, weeks:48, daysPerWeek:5, hoursPerDay:8, utilization:0.6, overhead:7300 },
  'Coach-Consultant': { takeHome:80000, taxRate:0.30, buffer:0.18, weeks:46, daysPerWeek:4, hoursPerDay:6, utilization:0.45, overhead:9200 },
  Custom:     { takeHome:70000, taxRate:0.30, buffer:0.15, weeks:48, daysPerWeek:5, hoursPerDay:8, utilization:0.55, overhead:8600 },
};
const n = x => (typeof x === 'number' && isFinite(x)) ? x : (parseFloat(x) || 0);
export function rates(r) {
  const gross = n(r.takeHome) / (1 - n(r.taxRate)) / (1 - n(r.buffer));            // Mini B9
  const hours = n(r.weeks) * n(r.daysPerWeek) * n(r.hoursPerDay) * n(r.utilization); // B16
  const survival = hours > 0 ? (gross + n(r.overhead)) / hours : 0;                  // B22
  const recommended = survival * 1.2;                                                // B23
  return { gross, hours, survival, recommended, day: recommended * 6 };              // B24
}
export function itemAmount(it, rate) {
  const price = it.usesRate ? rate : n(it.price);
  return n(it.qty) * price;
}
export function quoteTotals(q, rateProfile) {
  const r = rates(rateProfile);
  const a = q.adjust || {};
  const items = (q.items || []).filter(i => !i.optional);
  const base = items.reduce((s, i) => s + itemAmount(i, r.recommended), 0);        // D16
  const contingency = base * n(a.contingencyPct);                                  // C19
  const rush = (base + contingency) * n(a.rushPct);                                // C20
  const expenses = n(a.expenses);                                                  // B21
  const total = (base + contingency + rush + expenses) * (1 - n(a.discountPct));   // B24 (pre-tax)
  const tax = total * n(a.taxPct);
  const grand = total + tax;
  const deposit = grand * (a.depositPct == null ? 0.4 : n(a.depositPct));         // B25
  const balance = grand - deposit;                                                 // B26
  const hours = items.filter(i => i.unit === 'hour').reduce((s, i) => s + n(i.qty), 0); // B29
  const effectiveHourly = hours === 0 ? 0 : total / hours;                         // B30 (no div by 0)
  const clearsFloor = hours === 0 ? null : effectiveHourly >= r.survival;          // B32
  return { rate: r.recommended, floor: r.survival, base, contingency, rush, expenses, total, tax, grand, deposit, balance, hours, effectiveHourly, clearsFloor };
}
export function fmt(v, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n(v));
}
