import re, json, html as htmlmod

files = {
    "FIA enterprise": "/Users/brentdubose/seo-pages/idle-sites/findaiagency/enterprise-ai-spend-passes-consumer.html",
    "MBA chatgpt-1b": "/Users/brentdubose/seo-pages/idle-sites/mybusiness-ai-audit/articles/chatgpt-1b-users-small-business-ai-audit.html",
    "MBA gemini (edited)": "/Users/brentdubose/seo-pages/idle-sites/mybusiness-ai-audit/articles/gemini-1b-users-small-business-ai-audit.html",
}

for name, path in files.items():
    h = open(path).read()
    title = re.search(r'<title>(.*?)</title>', h, re.S).group(1)
    desc = re.search(r'<meta name="description" content="([^"]*)"', h).group(1)
    canon = re.search(r'<link rel="canonical" href="([^"]*)"', h).group(1)
    body = re.sub(r'<script.*?</script>', ' ', h, flags=re.S)
    body = re.sub(r'<style.*?</style>', ' ', body, flags=re.S)
    body_text = re.sub(r'<[^>]+>', ' ', body)
    body_text = htmlmod.unescape(re.sub(r'\s+', ' ', body_text))
    words = len(body_text.split())
    h1s = re.findall(r'<h1>(.*?)</h1>', h, re.S)
    ld = re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S)
    ld_valid = True
    ld_types = []
    for block in ld:
        try:
            data = json.loads(block)
            if isinstance(data, dict) and '@graph' in data:
                ld_types += [n.get('@type') for n in data['@graph']]
            elif isinstance(data, dict):
                ld_types.append(data.get('@type'))
        except Exception as e:
            ld_valid = False
            ld_types.append(f"ERR {e}")
    links = re.findall(r'href="([^"]+)"', h)
    internal = sorted({l for l in links if l.startswith('/') or l.startswith('https://findaiagency.com') or l.startswith('https://mybusinessaiaudit.com')})
    external = sorted({l for l in links if l.startswith('http') and not l.startswith('https://findaiagency.com') and not l.startswith('https://mybusinessaiaudit.com')})
    print(f"=== {name} ===")
    print(f"title ({len(title)}c): {title}")
    print(f"meta desc ({len(desc)}c)")
    print(f"canonical: {canon}")
    print(f"H1 count: {len(h1s)} | H1: {h1s[0][:90] if h1s else 'NONE'}")
    print(f"visible words: {words}")
    print(f"JSON-LD valid: {ld_valid} | types: {ld_types}")
    print(f"internal links ({len(internal)}): {internal}")
    print(f"external links ({len(external)}):")
    for e in external:
        print(f"   {e}")
    print()
