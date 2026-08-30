import re, json, html as htmlmod, difflib

path = '/Users/brentdubose/seo-pages/idle-sites/findaiagency/enterprise-ai-spend-passes-consumer.html'
h = open(path).read()

vis = re.findall(r'<div class="faq-item">\s*<h3>(.*?)</h3>\s*<p>(.*?)</p>', h, re.S)
vis_a = [htmlmod.unescape(re.sub(r'<[^>]+>', '', a)).strip() for q, a in vis]

ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', h, re.S).group(1)
data = json.loads(ld)
faq = [n for n in data['@graph'] if n.get('@type') == 'FAQPage'][0]
sch_a = [q['acceptedAnswer']['text'] for q in faq['mainEntity']]

def norm(s):
    return htmlmod.unescape(re.sub(r'\s+', ' ', s)).strip()

for i, (va, sa) in enumerate(zip(vis_a, sch_a)):
    van, san = norm(va), norm(sa)
    if van != san:
        print(f"=== Answer {i+1} diff ===")
        for d in difflib.unified_diff([van], [san], lineterm='', n=1):
            print(d)
        print()
