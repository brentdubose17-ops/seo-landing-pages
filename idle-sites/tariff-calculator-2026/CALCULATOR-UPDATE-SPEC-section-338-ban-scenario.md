# Calculator update spec — Section 338 Canada ban / snap-back / exclusion mode

**Deliverable of kanban `t_edae4114`** (drafting card) · **Implemented by** `t_91970bb1` (content-ops)
**Companion page:** `/section-338-canada-import-ban-usmca-legal-challenge` on tariffcalculator2026.com
**Prepared:** 2026-09-14 (EDT) · **Brief:** `t_d24690e9` §1.3 E1–E7, §3 H2-6/H2-9, §7

---

## 1. What the mode is, in one paragraph

The existing modes price a *rate*. This one prices a **decision with three
outcomes**, because since 2026-09-08 the Section 338 action on Canadian goods is
no longer only a duty:

| State | When it applies | What the mode returns |
|---|---|---|
| **50% duty** | goods entered for consumption, or withdrawn from warehouse, **before** 2026-09-29 00:01 ET (the transition rule) | duty collectible = 50% of customs value |
| **Prohibited** | goods in a banned programme entered **on/after** 2026-09-29, not excluded | **no duty is collectible** (there is no lawful entry). Cost = stranded value |
| **Snap-back 50%** | a court, WTO or USMCA result invalidates the ban as to that import | duty = the same 50% (Proclamation 11061 § 9(b)) — never 0% |
| **Excluded** | the 8-digit line sits in a Chapter 99 exclusion heading (9903.03.15 / .16) | no Section 338 duty and no ban (MFN duty is out of scope) |

The page's thesis is the arithmetic behind the third row: **the snap-back equals
exactly the duty an importer would have paid by entering before the ban date.**
The mode exists so a supply-chain manager can see that number next to the
prohibited case, and see that the prohibited case is not priceable at all.

**The hardness rule of this mode: never render a duty against a prohibited
entry.** A duty figure on a shipment that cannot be entered is the one output
that would make this calculator wrong rather than approximate.

---

## 2. Files

| # | Path (site tree `~/seo-pages/idle-sites/tariff-calculator-2026/`) | Status in this card |
|---|---|---|
| 1 | `presets/canada-338-ban-scenario.js` | **written and tested** — ready to drop in, no edits needed |
| 2 | `tariff-data.js` | 2 additions to make (§3) — do not touch any existing mode's logic |
| 3 | `index.html` | 3 additions to make (§4, §5) — one `<script>`, one tab button, one panel, one wiring block |
| 4 | `tests/s338-data.test.js` | **written, 14/14 passing** (stays local — `tests/` is gitignored by design) |
| 5 | `CHANGELOG.md` | entry template in §9 |

Both authored files are in the card workspace:
`~/.hermes/kanban/boards/content-engine/workspaces/t_edae4114/{presets,tests}/`.

---

## 3. `tariff-data.js` — the two additions

Copy the resolution + wrapper in verbatim. Place the `S338_BAN` block
immediately after the `COPPER_PENDING` block (same shape: resolve a global,
validate `preset_key`, fall back to a no-values object rather than wrong numbers).

```js
  /*
   * Section 338 Canada — ban / snap-back / exclusion scenario (IN FORCE).
   * The 50% duty has been in force since 2026-08-22; the import bans on the
   * goods named in Proclamations 11061/11062/11063 take effect 2026-09-29.
   * Unlike COPPER_PENDING this measure is NOT hypothetical: in_effect is true.
   * What is conditional is one of three outcomes (before-ban entry / prohibited
   * entry / snap-back on invalidation). Never render a duty on a prohibited
   * entry — see the preset's `compute()`.
   * DATA + ARITHMETIC: presets/canada-338-ban-scenario.js
   * (window.S338_BAN_PRESET in the browser, require() in Node).
   */
  var S338_BAN = (function () {
    var preset = null;
    if (typeof window !== 'undefined' && window.S338_BAN_PRESET) {
      preset = window.S338_BAN_PRESET;
    } else if (typeof require === 'function') {
      try { preset = require('./presets/canada-338-ban-scenario.js'); } catch (e) { preset = null; }
    }
    if (preset && preset.preset_key === 'canada-338-ban-scenario' && typeof preset.compute === 'function') {
      return preset;
    }
    // Safe fallback: identity only, no programmes and no rates, so the UI
    // renders "data file not loaded" instead of a plausible wrong number.
    return {
      preset_key: 'canada-338-ban-scenario',
      preset_label: 'Section 338 Canada \u2014 ban, snap-back and exclusion scenario',
      status: 'IN FORCE \u2014 50% duty from 2026-08-22; import bans from 2026-09-29',
      status_short: 'Data unavailable',
      in_effect: true,
      as_of: null,
      disclaimer: 'The Section 338 data file did not load, so no scenario can be modelled.',
      disclaimer_short: 'IN FORCE \u2014 bans from 2026-09-29.',
      duty_pct: 50,
      ban_effective: '2026-09-29T00:01:00-04:00',
      scope_effective: '2026-09-15T00:01:00-04:00',
      itc_comments_due: '2026-11-08T17:15:00-04:00',
      exclusion_headings: [],
      programmes: [],
      default_programme: null,
      destinations: [],
      default_destination: 'us',
      weight_band: { min_pct: 0, max_pct: 100, step_pct: 5, default_pct: 0 },
      scenario_reference: null,
      sources: [],
      verified: null,
      compute: null
    };
  })();

  /** Thin wrapper so callers use the T.* surface, as every other mode does. */
  function s338Scenario(opts) {
    return S338_BAN && typeof S338_BAN.compute === 'function' ? S338_BAN.compute(opts) : null;
  }
```

Then add both to the module's final `return { … }` block, next to
`COPPER_PENDING` / `copperLandedCost`:

```js
    S338_BAN: S338_BAN,
    s338Scenario: s338Scenario,
```

**Why the arithmetic lives in the preset file and not here:** the mode's numbers
and the page copy they are checked against are then one artifact, and
`tests/s338-data.test.js` can assert the file directly. This is a deliberate,
documented departure from the copper split (data in preset, logic in
tariff-data.js) — the wrapper above keeps every caller's surface identical.

---

## 4. `index.html` — load order, tab, panel

### 4.1 Load order (line ~947, immediately before `tariff-data.js`)

```html
<script src="presets/refined-copper-tariff-pending.js"></script>
<script src="presets/canada-338-ban-scenario.js"></script>   <!-- new -->
<script src="tariff-data.js"></script>
```

### 4.2 Fourth tab — inside `div.calc-modes#calcModes`, after `modeBtnCu`

```html
<button type="button" class="calc-mode" id="modeBtnS338" role="tab" aria-selected="false" onclick="setCalcMode('s338')">Section 338 Canada — ban / snap-back<small>Programme + customs value + entry date → 50% duty, prohibited entry, or the 50% a win restores</small></button>
```

The `.calc-modes` row is `flex: 1 1 240px` per tab and wraps, so a fourth tab is
safe at 320px — verify anyway (§8, mobile check).

### 4.3 Panel — immediately after `div#copperPanel`'s closing `</div>`

```html
        <a id="section-338-calculator"></a>
        <div id="s338Panel" style="display:none;">
            <div class="cu-status" role="note">
                <strong>&#9989; Status: IN FORCE — 50% duty since August 22, 2026; IMPORT BANS from September 29, 2026.</strong>
                <p style="margin: 8px 0 6px;">Proclamations 11061, 11062 and 11063 exclude named Canadian alcohol, dairy and motorcycle lines from importation from <strong>2026-09-29</strong>. A line covered by a ban <strong>cannot be entered</strong> on or after that date, so <strong>no duty is collectible on it</strong>. Goods entered before that date keep the <strong>50%</strong> Section 338 duty, and Proclamation 11061 &sect; 9(b) provides that if a ban is invalidated as to any import, <strong>that same 50% duty applies to it</strong> — duty-free entry is not an outcome of the measure. Not legal advice; verify the 8-digit line against each proclamation's annex. Last verified September 14, 2026.</p>
                <p style="margin: 0; font-size: 0.85rem;">Sources: <a href="https://www.federalregister.gov/documents/2026/09/14/2026-18835/excluding-certain-products-of-canada-from-importation-into-the-united-states" target="_blank" rel="noopener">Proclamation 11061, 91 FR 58311</a> &middot; <a href="https://www.federalregister.gov/documents/2026/09/14/2026-18836/excluding-certain-products-of-canada-from-importation-into-the-united-states" target="_blank" rel="noopener">11062, 91 FR 58319</a> &middot; <a href="https://www.federalregister.gov/documents/2026/09/14/2026-18837/excluding-certain-products-of-canada-from-importation-into-the-united-states" target="_blank" rel="noopener">11063, 91 FR 58325</a> &middot; <a href="https://www.federalregister.gov/documents/2026/09/14/2026-18838/modifying-the-scope-of-products-of-canada-subject-to-the-additional-duties" target="_blank" rel="noopener">11064, 91 FR 58331</a> &middot; <a href="https://www.federalregister.gov/documents/2026/09/14/2026-18839/modifying-the-scope-of-products-of-canada-subject-to-the-additional-duties" target="_blank" rel="noopener">11065, 91 FR 58339</a></p>
            </div>
            <div class="form-row">
                <label for="s338Programme">Programme (Chapter 99 heading)</label>
                <select id="s338Programme" onchange="s338UpdateHints()"></select>
                <div class="hint" id="s338ProgrammeHint"></div>
            </div>
            <div class="form-row">
                <label for="s338Value">Customs value of the shipment (USD)</label>
                <input type="number" id="s338Value" min="0" step="1000" placeholder="e.g. 250000" oninput="s338UpdateHints()">
                <div class="hint" id="s338ValueHint"></div>
            </div>
            <div class="form-row">
                <label for="s338Entry">Entry for consumption, or warehouse withdrawal</label>
                <select id="s338Entry" onchange="s338UpdateHints()">
                    <option value="after">On or after September 29, 2026 (the ban date)</option>
                    <option value="before">Before September 29, 2026 (transition rule)</option>
                </select>
                <div class="hint" id="s338EntryHint"></div>
            </div>
            <div class="form-row">
                <label for="s338Excluded">Is the 8-digit line in an annex exclusion heading (9903.03.15 / .16)?</label>
                <select id="s338Excluded" onchange="s338UpdateHints()">
                    <option value="no">No — covered by the programme</option>
                    <option value="yes">Yes — excluded</option>
                </select>
            </div>
            <div class="form-row">
                <label for="s338Pct">Your own weighting: chance the ban is invalidated for this import (%)</label>
                <input type="number" id="s338Pct" min="0" max="100" step="5" value="0">
                <div class="hint" id="s338PctHint">Not our forecast — a 0% default so the first number on screen is never a prediction. It only scales the expected snap-back line.</div>
            </div>
            <div class="form-row">
                <label for="s338Dest">Destination</label>
                <select id="s338Dest" onchange="s338UpdateHints()"></select>
                <div class="hint" id="s338DestHint"></div>
            </div>
            <button class="calc-btn" onclick="runS338()">Model the Section 338 outcome</button>

            <div class="results" id="s338Results">
                <div class="result-card">
                    <div class="result-item">
                        <span class="result-label">Outcome for this entry</span>
                        <span class="result-value" id="s338OutState">—</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Duty collectible on this entry</span>
                        <span class="result-value" id="s338OutDuty">—</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Landed cost at the 50% duty</span>
                        <span class="result-value" id="s338OutLanded">—</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Value that cannot be entered (prohibited case)</span>
                        <span class="result-value" id="s338OutStranded">—</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">If the ban is invalidated — 50% duty restored</span>
                        <span class="result-value" id="s338OutSnapBack">—</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Expected snap-back at your weighting</span>
                        <span class="result-value total" id="s338OutWeighted">—</span>
                    </div>
                </div>
                <div class="cu-headline" id="s338OutHeadline">—</div>
                <div id="s338Flags"></div>
                <p class="hint" style="margin-top:10px;">Model note: the duty base is the customs value of the shipment, one ad valorem rate applied to it, no stacking and no MFN duty. A prohibited entry is <strong>not priceable</strong>: the mode deliberately returns no duty for it. The Chapter 99 exclusions are modelled as an on/off switch — confirm the 8-digit line against the annexes.</p>
                <label for="s338Permalink" style="font-size:0.8rem;color:#888;display:block;margin-top:10px;">Shareable link to this scenario</label>
                <input type="text" id="s338Permalink" class="cu-permalink" readonly onclick="this.select()">
                <div class="hint">Deep-link format: <code>?mode=s338&amp;programme=alcohol&amp;value=250000&amp;entry=after&amp;excl=no&amp;pct=25&amp;dest=us</code> — or simply <code>?product=s338</code>.</div>
            </div>
        </div>
```

---

## 5. `index.html` — the wiring block (LAST script in the document)

Paste as a new `<script>` block immediately **after** the copper wiring block and
before `</body>`. It wraps the copper block's `setCalcMode`, so it must stay
last. Replace `<TASKID>` in the marker with the implementing card id.

```html
<script>
/* ---------------------------------------------------------------------------
 * Section 338 Canada - ban / snap-back / exclusion scenario - calculator wiring
 * block marker: s338-wiring-<TASKID>
 *
 * Data + arithmetic: presets/canada-338-ban-scenario.js, surfaced through
 * tariff-data.js as T.S338_BAN / T.s338Scenario().
 * This block WRAPS the copper block's setCalcMode, so it must stay LAST.
 *
 * Shareable deep links:
 *   /?mode=s338&programme=alcohol&value=250000&entry=after&excl=no&pct=25&dest=us#section-338-calculator
 *   /?product=s338#calculator
 * ------------------------------------------------------------------------- */
(function () {
    function el(id) { try { return document.getElementById(id); } catch (e) { return null; } }
    function num(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }
    function fmt(n, dp) {
        if (n == null || !isFinite(n)) return '\u2014';
        var d = dp || 0, neg = n < 0, parts = Math.abs(n).toFixed(d).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return (neg ? '-' : '') + parts.join('.');
    }
    function money(n, dp) { return (n == null || !isFinite(n)) ? '\u2014' : '$' + fmt(n, dp == null ? 0 : dp); }
    function pct1(r) { return (Math.round(r * 1000) / 10).toFixed(1) + '%'; }
    function setAttr(node, name, value) { if (node && node.setAttribute) { try { node.setAttribute(name, value); } catch (e) {} } }
    function preset() { var t = window.TARIFF_DATA; return t && t.S338_BAN ? t.S338_BAN : null; }

    function pickRow(list, value) {
        if (!list) return null;
        for (var i = 0; i < list.length; i++) { if (list[i].value === value) return list[i]; }
        return null;
    }
    function optionExists(sel, value) {
        if (!sel || !sel.options) return false;
        for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].value === value) return true; }
        return false;
    }
    function fill(sel, rows, dflt) {
        var p = preset();
        if (!sel || !rows || !rows.length) return;
        if (!sel.options || !sel.options.length) {
            rows.forEach(function (it) {
                var o = document.createElement('option');
                o.value = it.value; o.textContent = it.label;
                sel.appendChild(o);
            });
            sel.value = dflt || rows[0].value;
        }
        if (!p) { sel.disabled = true; }
    }
    function s338Ensure() {
        var p = preset();
        if (!p) return;
        fill(el('s338Programme'), p.programmes, p.default_programme);
        fill(el('s338Dest'), p.destinations, p.default_destination);
    }

    function s338UpdateHints() {
        var p = preset(), prow = pickRow(p && p.programmes, el('s338Programme') ? el('s338Programme').value : null);
        var h = el('s338ProgrammeHint');
        if (h) h.textContent = prow ? ('Chapter 99 heading ' + prow.heading + ' \u2014 ban proclamation ' + prow.ban_proclamation + ' (' + prow.fr_ban + '); the 50% duty is under ' + prow.duty_proclamation + '. ' + prow.note) : '';
        var vh = el('s338ValueHint');
        var v = el('s338Value') ? num(el('s338Value').value) : null;
        if (vh) vh.innerHTML = (v != null && v > 0)
            ? 'Duty base: <strong>' + money(v) + '</strong>. At the 50% Section 338 rate that is <strong>' + money(v * 0.5) + '</strong>.'
            : 'Enter the customs value of the shipment (transaction value) in US dollars.';
        var eh = el('s338EntryHint');
        if (eh) eh.textContent = 'The ban applies to goods entered for consumption, or withdrawn from warehouse for consumption, on or after 2026-09-29 00:01 ET. Goods imported earlier but not yet entered stay at the 50% duty.';
        var ph = el('s338PctHint');
        if (ph && el('s338Pct') && el('s338Pct').value !== '') {
            var pct = num(el('s338Pct').value);
            ph.textContent = (pct != null ? (pct + '% of ' + money(v != null && v > 0 ? v * 0.5 : 0) + ' = ') : '') +
                'the expected snap-back duty. Your assumption, not our forecast.';
        }
        var dh = el('s338DestHint');
        var r = pickRow(p && p.destinations, el('s338Dest') ? el('s338Dest').value : null);
        if (dh) dh.textContent = r ? r.note : '';
    }

    function buildQuery() {
        var p = preset();
        if (!p) return '';
        var q = [];
        q.push('mode=s338');
        q.push('programme=' + encodeURIComponent(el('s338Programme') ? el('s338Programme').value : ''));
        q.push('value=' + encodeURIComponent(el('s338Value') ? el('s338Value').value : ''));
        q.push('entry=' + encodeURIComponent(el('s338Entry') ? el('s338Entry').value : 'after'));
        q.push('excl=' + (el('s338Excluded') && el('s338Excluded').value === 'yes' ? 'yes' : 'no'));
        q.push('pct=' + encodeURIComponent(el('s338Pct') ? el('s338Pct').value : '0'));
        q.push('dest=' + encodeURIComponent(el('s338Dest') ? el('s338Dest').value : 'us'));
        return 'https://tariffcalculator2026.com/?' + q.join('&') + '#section-338-calculator';
    }
    function syncS338Url() {
        var box = el('s338Permalink');
        if (box) box.value = buildQuery();
    }

    function runS338() {
        var t = window.TARIFF_DATA;
        var p = preset();
        var out = { duty: el('s338OutDuty'), landed: el('s338OutLanded'), stranded: el('s338OutStranded'),
                    snapBack: el('s338OutSnapBack'), weighted: el('s338OutWeighted'), state: el('s338OutState'),
                    headline: el('s338OutHeadline'), flags: el('s338Flags') };
        function clear(txt) {
            if (out.duty) out.duty.textContent = '\u2014';
            if (out.landed) out.landed.textContent = '\u2014';
            if (out.stranded) out.stranded.textContent = '\u2014';
            if (out.snapBack) out.snapBack.textContent = '\u2014';
            if (out.weighted) out.weighted.textContent = '\u2014';
            if (out.state) out.state.textContent = '\u2014';
            if (out.headline) out.headline.textContent = txt || '\u2014';
            if (out.flags) out.flags.innerHTML = '';
        }
        if (!p) { clear('Section 338 preset data did not load — no scenario can be modelled.'); return; }
        s338Ensure();
        var r = t && t.s338Scenario ? t.s338Scenario({
            programme: el('s338Programme') ? el('s338Programme').value : null,
            customsValueUsd: el('s338Value') ? el('s338Value').value : null,
            entry: el('s338Entry') ? el('s338Entry').value : 'after',
            excluded: el('s338Excluded') ? el('s338Excluded').value === 'yes' : false,
            banInvalidatedPct: el('s338Pct') ? el('s338Pct').value : 0,
            destination: el('s338Dest') ? el('s338Dest').value : 'us'
        }) : null;
        if (!r) { clear('Enter a programme and a customs value greater than zero.'); return; }

        if (out.state) out.state.textContent = r.prohibited ? 'PROHIBITED \u2014 no lawful entry'
            : (r.state === 'duty_50' ? 'DUTIABLE at 50% (entered before 2026-09-29)'
            : 'EXCLUDED \u2014 no Section 338 duty, no ban');
        // A prohibited entry reports NO duty: the em dash is the honest output.
        if (out.duty) out.duty.textContent = r.prohibited ? '\u2014 not collectible' : money(r.collectibleDutyUsd);
        if (out.landed) out.landed.textContent = money(r.prohibited ? r.customsValueUsd : r.landedUsd);
        if (out.stranded) out.stranded.textContent = r.prohibited ? money(r.strandedValueUsd) : '\u2014';
        if (out.snapBack) out.snapBack.textContent = money(r.snapBackDutyUsd) + (r.prohibited ? ' (if the ban is invalidated)' : '');
        if (out.weighted) out.weighted.textContent = money(r.expectedSnapBackUsd) + ' at ' + r.banInvalidatedPct + '%';
        if (out.headline) out.headline.textContent = r.headline;
        if (out.flags) {
            out.flags.innerHTML = r.flagLines.map(function (f) {
                return '<div class="hint" style="margin:6px 0;">' + f + '</div>';
            }).join('');
        }
        syncS338Url();
    }

    function applyS338Visibility(on) {
        var panel = el('s338Panel'), btn = el('modeBtnS338');
        if (panel) panel.style.display = on ? 'block' : 'none';
        if (btn) { btn.className = on ? 'calc-mode active' : 'calc-mode'; setAttr(btn, 'aria-selected', on ? 'true' : 'false'); }
    }

    // Wrap the copper block's switcher (loaded above this script).
    var origSetCalcMode = typeof window.setCalcMode === 'function' ? window.setCalcMode : null;

    function setCalcMode(mode) {
        if (String(mode) === 's338') {
            var av = el('avModeWrap'), trq = el('trqPanel'), cu = el('copperPanel');
            if (av) av.style.display = 'none';
            if (trq) trq.style.display = 'none';
            if (cu) cu.style.display = 'none';
            ['modeBtnAv', 'modeBtnTrq', 'modeBtnCu'].forEach(function (id) {
                var b = el(id);
                if (b) { b.className = 'calc-mode'; setAttr(b, 'aria-selected', 'false'); }
            });
            applyS338Visibility(true);
            s338Ensure();
            var p = preset(), filled = false;
            if (el('s338Value') && !el('s338Value').value) {
                el('s338Value').value = String(p && p.scenario_reference ? p.scenario_reference.customs_value_usd : 250000);
                filled = true;
            }
            if (el('s338Pct') && !el('s338Pct').value) {
                el('s338Pct').value = String(p && p.weight_band ? p.weight_band.default_pct : 0);
                filled = true;
            }
            s338UpdateHints();
            syncS338Url();
            if (filled) runS338();
            return true;
        }
        var res = origSetCalcMode ? origSetCalcMode(mode) : null;
        applyS338Visibility(false);
        return res;
    }

    window.setCalcMode = setCalcMode;
    window.runS338 = runS338;
    window.s338UpdateHints = s338UpdateHints;
    window.s338Ensure = s338Ensure;

    try {
        s338Ensure();
        var params = new URLSearchParams(window.location.search);
        var mode = params.get('mode'), product = params.get('product');
        if (mode === 's338' || product === 's338') {
            setCalcMode('s338');
            var prog = params.get('programme'), sel = el('s338Programme');
            if (prog && sel && optionExists(sel, prog)) sel.value = prog;
            var v = params.get('value');
            if (v && el('s338Value')) el('s338Value').value = v;
            var e = params.get('entry'), eSel = el('s338Entry');
            if (e && eSel && optionExists(eSel, e)) eSel.value = e;
            var x = params.get('excl'), xSel = el('s338Excluded');
            if (x && xSel && (x === 'yes' || x === 'no')) xSel.value = x;
            var wp = params.get('pct');
            if (wp && el('s338Pct')) el('s338Pct').value = wp;
            var d = params.get('dest'), dSel = el('s338Dest');
            if (d && dSel && optionExists(dSel, d)) dSel.value = d;
            s338UpdateHints();
            runS338();
            if (typeof setTimeout === 'function') {
                setTimeout(function () {
                    var a = el('section-338-calculator');
                    if (a && a.scrollIntoView) a.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }
        }
    } catch (e) {}
})();
</script>
```

---

## 6. Page-copy mirror (the acceptance test)

The mode ships with `scenario_reference` inside the preset. The page may print
this table (recommended if the publisher wants the worked example on-page — it is
*not* required by the brief, and brief §10 keeps the 232/counter-tariff
arithmetic off this page). **If the page prints it, the numbers must be these,
because the tests assert exactly them.**

$250,000 of Canadian distilled spirits (Chapter 99 9903.03.12), covered, not
excluded, entered **on or after** 2026-09-29:

| Outcome | Duty | Landed cost | Note |
|---|---:|---:|---|
| Prohibited (the ban stands) | **none — not collectible** | — | $250,000 of value cannot be entered |
| Ban invalidated (snap-back) | **$125,000** | **$375,000** | Proclamation 11061 § 9(b) — up $125,000, or 50.0% |
| Entered *before* 2026-09-29 (transition rule) | **$125,000** | **$375,000** | the same number the snap-back restores |
| Line in an exclusion heading (9903.03.15/.16) | **$0** | $250,000 | Section 338 does not apply; MFN not modelled |

Weighting ladder on the snap-back (user's own assumption, 0% default):

| Your weighting | Expected snap-back duty |
|---:|---:|
| 0% | $0 |
| 25% | $31,250 |
| 50% | $62,500 |
| 75% | $93,750 |
| 100% | $125,000 |

---

## 7. Guardrails this mode must not break

1. **Never render a duty against a prohibited entry.** The prohibited state
   returns `collectibleDutyUsd = 0` and the render prints `— not collectible`.
2. **Never present the snap-back as collectible now.** It is conditional on an
   invalidation that had not happened as of 2026-09-13; every render carries the
   § 9(b) sentence and the "if the ban is invalidated" qualifier.
3. **The weighting defaults to 0.** It is the user's assumption, never our
   forecast, and it scales only the expected-snap-back line.
4. **`in_effect` is TRUE.** The 50% duty has been in force since 2026-08-22. Do
   not reuse the copper mode's "PENDING — not in effect" framing or its
   `.cu-status` red banner styling for this measure; the status note says IN
   FORCE with the two dates.
5. **Not legal advice, and not a classification tool.** The exclusion switch is
   on/off by design; the annex is the controlling document and the mode says so.
6. **MFN duty is out of scope** — the duty base is the customs value with one ad
   valorem rate, no stacking. Do not add Section 232 or MFN rates here; those
   live on their own pages and are already modelled elsewhere.

---

## 8. Verification the implementing card must run (and record)

```bash
# 1. data + arithmetic
node --test tests/s338-data.test.js          # expect 14 pass / 0 fail

# 2. the page and index must stay internally consistent
python3 ~/.hermes/scripts/site_consistency.py index.html --expect-date <bump this>
python3 ~/.hermes/scripts/site_consistency.py section-338-canada-import-ban-usmca-legal-challenge.html --expect-date 2026-09-15

# 3. deploy, then verify the DEPLOYED bytes, not the worktree
python3 ~/seo-pages/tools/deploy-idle-site.sh tariff-calculator-2026 \
  --files=index.html,tariff-data.js,presets/canada-338-ban-scenario.js,section-338-canada-import-ban-usmca-legal-challenge.html --verify-live
curl -s https://tariffcalculator2026.com/section-338-canada-import-ban-usmca-legal-challenge | shasum -a 256

# 4. drive the mode in a real browser: deep link AND a real tab click
#    ?mode=s338&programme=alcohol&value=250000&entry=after&excl=no&pct=25&dest=us
#    then click the fourth tab and confirm the other three modes still work

# 5. mobile overflow at 320/360/390/414px for the default page and each deep link
python3 tests/mobile-overflow-tariff.py https://tariffcalculator2026.com/?mode=s338#section-338-calculator
```

Orchestrator harness note: the repo's `tests/*-dom-harness.js` pattern (vm + DOM
stub) is the cheapest way to prove the *wiring* without a browser — copy
`tests/copper-dom-harness.js`, swap the preset path and the ids, and assert the
rendered strings for the three states. Add it if the mode is touched again.

---

## 9. `CHANGELOG.md` entry template

```markdown
## 2026-09-15 — Section 338 Canada: ban / snap-back / exclusion calculator mode + legal-challenge page

- **Mode added:** `s338` (fourth tab) — programme (9903.03.12 / .13 / .14),
  customs value, entry-before/after 2026-09-29, annex-exclusion switch, and a
  user weighting for the ban being invalidated.
  - Data + arithmetic: `presets/canada-338-ban-scenario.js` (UMD; `compute()`),
    surfaced as `T.S338_BAN` / `T.s338Scenario()`.
  - A prohibited entry reports **no duty** and the stranded value; the
    snap-back returns the **50%** duty under Proclamation 11061 § 9(b).
  - Reference case: $250,000 alcohol entry, after the ban date → prohibited
    (duty —, stranded $250,000); snap-back $125,000 / landed $375,000.
- **Page published:** `/section-338-canada-import-ban-usmca-legal-challenge`
  (2,591 visible words, 7 FAQ, 11 internal links, Article + FAQPage).
- **Tests:** `tests/s338-data.test.js` 14/14 pass. site_consistency 0 errors,
  0 warnings (index + page). Deploy id: `<id>`; live sha256: `<sha>`.
- **Live checks:** `<deep-link URL>` renders the prohibited state with no duty;
  mobile overflow 0 at 320/360/390/414.
```

---

## 10. Boundaries (inherited from the brief)

- Do **not** add the 75% Section 232 stacking arithmetic to this mode — it lives
  on `/section-232-metals-tariffs`.
- Do **not** add drawback or refund maths — that lives on
  `/how-to-apply-for-tariff-exclusion-or-drawback`, and the proclamations are
  silent on drawback (a live source conflict, reported not resolved).
- Do **not** add a USMCA-qualification toggle. Origin does not change the
  outcome here (US Note 51(a)); the page says so and links to the USMCA page.
- Do **not** let the mode imply anything is collectible on imports that cannot
  lawfully be entered.
