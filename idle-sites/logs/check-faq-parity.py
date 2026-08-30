import re, json, html as htmlmod

path = '/Users/brentdubose/seo-pages/idle-sites/findaiagency/enterprise-ai-spend-passes-consumer.html'
h = open(path).read()

# Visible FAQ items
vis = re.findall(r'<div class="faq-item">\s*<h3>(.*?)</h3>\s*<p>(.*?)</p>', h, re.S)
vis_q = [htmlmod.unescape(re.sub(r'<[^>]+>', '', q)).strip() for q, a in vis]
vis_a = [htmlmod.unescape(re.sub(r'<[^>]+>', '', a)).strip() for q, a in vis]

# Schema FAQ
ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', h, re.S).group(1)
data = json.loads(ld)
faq = [n for n in data['@graph'] if n.get('@type') == 'FAQPage'][0]
sch_q = [q['name'] for q in faq['mainEntity']]
sch_a = [q['acceptedAnswer']['text'] for q in faq['mainEntity']]

def norm(s):
    return htmlmod.unescape(re.sub(r'\s+', ' ', s)).strip()

print(f"visible FAQs: {len(vis_q)}, schema FAQs: {len(sch_q)}")
for i, (vq, sq) in enumerate(zip(vis_q, sch_q)):
    vqn, sqn = norm(vq), norm(sq)
    print(f"Q{i+1} visible==schema: {vqn == sqn}")
    if vqn != sqn:
        print(f"   VIS: {vqn[:80]}")
        print(f"   SCH: {sqn[:80]}")
for i, (va, sa) in enumerate(zip(vis_a, sch_a)):
    van, san = norm(va), norm(sa)
    print(f"A{i+1} visible==schema: {van == san}")
    if van != san:
        print(f"   VIS: {van[:80]}")
        print(f"   SCH: {san[:80]}")

# visible count == schema count
print(f"count match: {len(vis_q) == len(sch_q) and len(vis_a) == len(sch_a)}")
