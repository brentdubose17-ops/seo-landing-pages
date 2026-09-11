#!/usr/bin/env python3
"""Acceptance checks for /gpt-live-1-voice-agent-cost (card t_000de443).

Usage:
    python3 tests/gpt-live-1-page-verify.py                       # static: page vs model
    python3 tests/gpt-live-1-page-verify.py --live <url>          # + real-browser widget test

Static mode re-runs the PUBLISHED cost model (gpt-live-1-cost-model.js) in node and
asserts every printed figure matches, plus structure (one h1, canonical, one JSON-LD
Article+FAQPage, visible FAQ == schema FAQ, no forbidden claims).

Live mode drives the embedded estimator in a real browser: initial figures, every
preset button, the capacity-limited verdict, and horizontal overflow at 320/390/768.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(SITE, 'gpt-live-1-cost-model.js')
PAGE = os.path.join(SITE, 'gpt-live-1-voice-agent-cost.html')
URL = 'https://aiagencycalculator.com/gpt-live-1-voice-agent-cost'

NODE_SRC = r"""
const M = require(process.argv[2]);
const { computeModel, billedVoiceSeconds, voiceCostUsd, GPT_LIVE_MODEL } = M;
const r6 = x => Math.round(x * 1e6) / 1e6;
const D = { transport:'webrtc', callsPerDay:1000, callMm:4, callSs:0, operatingHoursPerDay:8,
  peakFactor:1, backendModel:'gpt-5.6-terra', turnsPerCall:6, inTokensPerTurn:1500,
  outTokensPerTurn:300, toolSharePct:35, toolCostPerInvocation:0, toolExtraInTokens:0,
  cachedSharePct:0, idleSharePct:30, realtimeAudioInPerMin:600, realtimeAudioOutPerMin:600,
  tier:'auto', monthDays:30 };
const out = { voice: { c40: r6(voiceCostUsd(40,'webrtc')), c90: r6(voiceCostUsd(90,'webrtc')),
  c240: r6(voiceCostUsd(240,'webrtc')), b5: billedVoiceSeconds(5,'webrtc'), c5w: r6(voiceCostUsd(5,'webrtc')),
  c5s: r6(voiceCostUsd(5,'websocket')), c600: r6(voiceCostUsd(600,'webrtc')), floor: r6(voiceCostUsd(15,'webrtc')) }, cases: {} };
function run(label, p) {
  const r = computeModel(Object.assign({}, D, p));
  out.cases[label] = {
    voicePerCall: r6(r.voice.perCall), backendPerCall: r6(r.backend.perCall),
    backendModel: r6(r.backend.modelPerCall), backendTools: r6(r.backend.toolPerCall),
    totalPerCall: r6(r.total.perCall), voiceDay: r6(r.voice.day), backendDay: r6(r.backend.day),
    totalDay: r6(r.total.day), voiceMonth30: r6(r.voice.month), backendMonth30: r6(r.backend.month),
    totalMonth30: r6(r.total.month), totalMonth31: r6(r.total.monthAlt31), totalMonthAvg: r6(r.total.monthAltAvg),
    voiceMonth31: r6(r.voice.monthAlt31), voiceMonthAvg: r6(r.voice.monthAltAvg),
    avgConcurrent: Math.round(r.capacity.average*100)/100, peakConcurrent: Math.round(r.capacity.required*100)/100,
    tier: r.capacity.tier, fits: r.capacity.fits, ceiling: r.capacity.ceiling,
    headroom: Math.round(r.capacity.headroom*100)/100, utilisation: r.capacity.utilisation === null ? null : Math.round(r.capacity.utilisation*10000)/100,
    backendSharePct: Math.round(r.backend.shareOfTotal*10000)/100, voiceSharePct: Math.round(r.voice.shareOfTotal*10000)/100,
    backendPctOfVoice: Math.round(r.backend.perCall/r.voice.perCall*10000)/100,
    idlePerCall: r6(r.voice.idlePerCall), idleDay: r6(r.voice.idleDay),
    rtPerMin: r6(r.realtime.perMinute), rtPerCall: r6(r.realtime.perCall),
    rtBreakevenTotal: r.realtime.breakevenTotalPerMin === null ? null : Math.round(r.realtime.breakevenTotalPerMin*100)/100,
    rtCheaper: r.realtime.tokenMeteringCheaper };
  return out.cases[label];
}
run('default', {});
run('defaultPeak25', { peakFactor: 2.5 });
run('default12h', { operatingHoursPerDay: 12, peakFactor: 2.5 });
run('luna', { backendModel:'gpt-5.6-luna', toolSharePct: 0 });
run('terra', { backendModel:'gpt-5.6-terra', toolSharePct: 0 });
run('sol',   { backendModel:'gpt-5.6-sol',   toolSharePct: 0 });
run('astra', { backendModel:'gpt-6-astra',   toolSharePct: 0 });
run('lcResidency', { backendModel:'gpt-6-astra', toolSharePct:0, longContext:true, dataResidency:true });
run('stress', { backendModel:'gpt-6-astra', turnsPerCall:12, inTokensPerTurn:4000, outTokensPerTurn:500, toolSharePct:0 });
run('blowout', { backendModel:'gpt-6-astra', toolSharePct:80, turnsPerCall:10, inTokensPerTurn:3000,
  outTokensPerTurn:800, toolExtraInTokens:1200, toolCostPerInvocation:0.01 });
run('cap1500', { callsPerDay:1500, operatingHoursPerDay:10, peakFactor:2.5 });
run('cap1600', { callsPerDay:1600, operatingHoursPerDay:10, peakFactor:2.5 });
run('cap2500', { callsPerDay:2500, operatingHoursPerDay:10, peakFactor:2.5 });
run('cap5000', { callsPerDay:5000, operatingHoursPerDay:10, peakFactor:2.5 });
run('cap10000', { callsPerDay:10000, operatingHoursPerDay:12, peakFactor:2.5 });
run('rt600_600', {}); run('rt600_1200', { realtimeAudioOutPerMin:1200 });
run('rt300_600', { realtimeAudioInPerMin:300, realtimeAudioOutPerMin:600 });
run('rt600_0', { realtimeAudioOutPerMin:0 });
out.tiers = {};
[1,2,3,4,5].forEach(t => { const ceil = GPT_LIVE_MODEL.tiers[t].ceiling;
  out.tiers['tier'+t] = { ceiling: ceil, avg: Math.round(ceil*600/4), peak25: Math.round(ceil/2.5*600/4) }; });
out.breakevenOut = {
  at600: Math.round((0.05 - 600*32/1e6)/(64/1e6)*100)/100,
  at300: Math.round((0.05 - 300*32/1e6)/(64/1e6)*100)/100,
  at0: Math.round(0.05/(64/1e6)*100)/100 };
console.log(JSON.stringify(out));
"""


def model_numbers():
    with tempfile.NamedTemporaryFile('w', suffix='.cjs', delete=False) as fh:
        fh.write(NODE_SRC)
        path = fh.name
    try:
        res = subprocess.run(['node', path, MODEL], capture_output=True, text=True)
        if res.returncode != 0:
            raise SystemExit('node failed: ' + res.stderr[-800:])
        return json.loads(res.stdout)
    finally:
        os.unlink(path)


def money(x, dp):
    return '$' + '{:,.{}f}'.format(x, dp)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--live', nargs='?', const=URL, help='also run the real-browser widget test against this URL')
    args = ap.parse_args()
    N = model_numbers()
    C = N['cases']
    V = N['voice']
    text = open(PAGE, encoding='utf-8').read()
    fails, checks = [], 0

    def need(label, s):
        nonlocal checks
        checks += 1
        if s not in text:
            fails.append(f'MISSING {label}: {s!r}')

    def forbid(label, s):
        nonlocal checks
        checks += 1
        if s in text:
            fails.append(f'FORBIDDEN {label}: {s!r}')

    d = C['default']
    for label, val in [
        ('voice 4:00', money(d['voicePerCall'], 4)), ('voice 0:40', money(V['c40'], 4)),
        ('0:40 cents', '{:,.2f}\u00a2'.format(V['c40'] * 100)), ('5s webrtc', money(V['c5w'], 4)),
        ('5s websocket', money(V['c5s'], 4)), ('90s', money(V['c90'], 4)), ('10 min', money(V['c600'], 2)),
        ('voice/day', money(d['voiceDay'], 2)), ('voice/month30', money(d['voiceMonth30'], 2)),
        ('voice/month31', money(d['voiceMonth31'], 2)), ('voice/month avg', money(d['voiceMonthAvg'], 2)),
        ('backend/call', money(d['backendPerCall'], 4)), ('total/call', money(d['totalPerCall'], 4)),
        ('backend/day', money(d['backendDay'], 2)), ('total/day', money(d['totalDay'], 2)),
        ('backend/month', money(d['backendMonth30'], 2)), ('total/month', money(d['totalMonth30'], 2)),
        ('idle/call', money(d['idlePerCall'], 4)), ('idle/day', money(d['idleDay'], 2)),
        ('avg concurrent', '{:.2f}'.format(d['avgConcurrent'])),
        ('peak 2.5x', '{:.2f}'.format(C['defaultPeak25']['peakConcurrent'])),
        ('12h avg', '{:.2f}'.format(C['default12h']['avgConcurrent'])),
        ('12h peak', '{:.2f}'.format(C['default12h']['peakConcurrent'])),
    ]:
        need(label, val)
    for key in ('luna', 'terra', 'sol', 'astra', 'lcResidency'):
        c = C[key]
        need(f'{key} backend/call', money(c['backendPerCall'], 4))
        need(f'{key} total/call', money(c['totalPerCall'], 4))
        need(f'{key} total/day', money(c['totalDay'], 2))
        need(f'{key} backend% of voice', '{:.1f}%'.format(c['backendPctOfVoice']))
    need('blowout backend% of voice', '{:.0f}%'.format(C['blowout']['backendPctOfVoice']))
    need('stress backend', money(C['stress']['backendPerCall'], 2))
    need('stress total', money(C['stress']['totalPerCall'], 2))
    need('stress month', money(C['stress']['totalMonth30'], 2))
    need('stress multiple', '{:.1f}\u00d7'.format(C['stress']['totalPerCall'] / C['stress']['voicePerCall']))
    need('spread multiple', '{:.0f}\u00d7'.format(C['astra']['backendPerCall'] / C['luna']['backendPerCall']))
    need('blowout total/day', money(C['blowout']['totalDay'], 2))
    need('blowout backend% of voice', '{:.0f}%'.format(C['blowout']['backendPctOfVoice']))
    need('blowout model', money(C['blowout']['backendModel'], 4))
    need('blowout tools', money(C['blowout']['backendTools'], 4))
    need('blowout share', '{:.1f}%'.format(C['blowout']['backendSharePct']))
    need('blowout voice share', '{:.1f}%'.format(C['blowout']['voiceSharePct']))
    need('blowout month', money(C['blowout']['totalMonth30'], 2))
    for key in ('rt600_600', 'rt600_1200', 'rt300_600', 'rt600_0'):
        need(f'{key} per min', money(C[key]['rtPerMin'], 4))
        need(f'{key} per call', money(C[key]['rtPerCall'], 4))
    need('gap 600/1200', money(C['rt600_1200']['rtPerCall'] - d['voicePerCall'], 4))
    need('gap/day', money((C['rt600_1200']['rtPerCall'] - d['voicePerCall']) * 1000, 2))
    need('rt breakeven', '{:,.0f}'.format(C['rt600_600']['rtBreakevenTotal']))
    for b in ('at600', 'at300', 'at0'):
        need(f'breakeven {b}', '{:.0f}'.format(N['breakevenOut'][b]))
    for key in ('cap1500', 'cap1600', 'cap2500', 'cap5000', 'cap10000'):
        need(f'{key} avg', '{:.2f}'.format(C[key]['avgConcurrent']))
        need(f'{key} peak', '{:.2f}'.format(C[key]['peakConcurrent']))
        need(f'{key} voice/day', money(C[key]['voiceDay'], 2))
    for t, info in N['tiers'].items():
        need(f'{t} calls/day', '{:,}'.format(info['avg']))
    need('tier1 peak break', '{:,}'.format(N['tiers']['tier1']['peak25']))
    need('floor cost', money(V['floor'], 4))

    # structure
    checks += 1
    if len(re.findall(r'<h1[\s>]', text, re.I)) != 1:
        fails.append('h1 count != 1')
    blocks = re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', text, re.S | re.I)
    checks += 1
    if len(blocks) != 1:
        fails.append(f'JSON-LD blocks: {len(blocks)}')
    else:
        graph = json.loads(blocks[0])['@graph']
        types = [n['@type'] for n in graph]
        checks += 1
        if types != ['Article', 'FAQPage']:
            fails.append(f'JSON-LD types {types}')
        schema_q = [q['name'] for q in [n for n in graph if n['@type'] == 'FAQPage'][0]['mainEntity']]
        visible_q = [__import__('html').unescape(v.strip()) for v in
                     re.findall(r'<div class="faq-item">\s*<h3>(.*?)</h3>', text, re.S)]
        checks += 1
        if visible_q != schema_q:
            fails.append(f'FAQ mirror mismatch ({len(visible_q)} visible vs {len(schema_q)} schema)')
        checks += 1
        if graph[0]['mainEntityOfPage'] != URL:
            fails.append('mainEntityOfPage != canonical URL')
    checks += 1
    if f'rel="canonical" href="{URL}"' not in text:
        fails.append('canonical missing')
    checks += 1
    if 'src="/gpt-live-1-cost-model.js"' not in text:
        fails.append('page does not load the published cost model')
    checks += 1
    if text.count('<title>') != 1:
        fails.append('title count != 1')
    for label, s in [('transport claim', 'WebRTC only'), ('orcarouter', 'orcarouter'),
                     ('blockchain.news', 'blockchain.news'), ('likes figure', '7.5K'),
                     ('Advanced Voice Mode', 'replacement for Advanced Voice Mode'), ('/hide', 'href="/hide"')]:
        forbid(label, s)
    for s in ('OpenAI-published', 'our arithmetic', 'planning assumption', '34.70', '32.0%',
              'Astra, medium reasoning effort', 'Terra, low reasoning effort'):
        need('attribution', s)

    if args.live:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            fails.append('playwright not installed: live mode skipped')
        else:
            with sync_playwright() as pw:
                br = pw.chromium.launch()
                pg = br.new_context(viewport={"width": 1280, "height": 1000}).new_page()
                errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)))
                pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
                pg.goto(args.live, wait_until='load')
                pg.wait_for_timeout(1500)
                checks += 1
                if pg.inner_text('#oTotal') != money(d['totalPerCall'], 4):
                    fails.append('live initial total ' + pg.inner_text('#oTotal'))
                for scen, expect_id, expect in [
                    ('default', '#oTotal', money(d['totalPerCall'], 4)),
                    ('luna', '#oTotal', money(C['luna']['totalPerCall'], 4)),
                    ('astra', '#oTotal', money(C['astra']['totalPerCall'], 4)),
                    ('blowout', '#oTotal', money(C['blowout']['totalPerCall'], 4)),
                    ('shortcall', '#oVoice', money(V['c40'], 4)),
                    ('capacity', '#oVerdict', 'Capacity-limited'),
                ]:
                    pg.click(f'#presetRow button[data-scenario="{scen}"]')
                    pg.wait_for_timeout(250)
                    checks += 1
                    if not pg.inner_text(expect_id).startswith(expect):
                        fails.append(f'live preset {scen} {expect_id}={pg.inner_text(expect_id)!r} expected {expect!r}')
                for w in (320, 390, 768):
                    p2 = br.new_context(viewport={"width": w, "height": 900}).new_page()
                    p2.goto(args.live, wait_until='load')
                    p2.wait_for_timeout(600)
                    sw, iw = p2.evaluate('document.documentElement.scrollWidth'), p2.evaluate('window.innerWidth')
                    checks += 1
                    if sw > iw + 1:
                        fails.append(f'live overflow at {w}px: {sw} > {iw}')
                    p2.context.close()
                checks += 1
                if errs:
                    fails.append('live JS errors: ' + str(errs))
                br.close()

    print(f'checks: {checks}  failures: {len(fails)}')
    for f in fails:
        print('  FAIL ' + f)
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
