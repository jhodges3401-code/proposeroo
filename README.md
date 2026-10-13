# Proposeroo — pay-once quote & proposal maker (MVP, unpublished)
Static, local-first, no server, no account, no network calls. Open `index.html` via any static server (ES modules need http://, not file://).
- `calc.js` pure math ported from Rate Mini (exp-005) and Rate & Quote Pack Quote Builder (exp-006); verified against LibreOffice-recalculated xlsx values (`test/gold.json`).
- Free: watermark on PDF + 1 saved quote. Pro: honor-system unlock codes in `app.js` (`ROO-PRO-2026` single, `ROO-TEAM5-2026` team) — put the right code on each Gumroad content page.
- `PRO_URL` = $12 single (kzjcwp), `PRO_TEAM_URL` = $49 team of 5 (ekunvc).
- Name: "Quotewise" rejected (live freelance-quoting product at quotewise.app + UK builder app quotewise.build). Also taken: QuoteWren, Bidlark, FloorQuote, ScopeSlip, Quotefinch, Scopewell. "Proposeroo": no web hits on 2026-10-12. Not a USPTO search; do a TESS/TSDR check before filing or spending.
- Tests: `node test/run.mjs` (serves on :8765, headless Chrome).
