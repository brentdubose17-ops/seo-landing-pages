import xml.etree.ElementTree as ET

for f in ['findaiagency/sitemap.xml', 'mybusiness-ai-audit/sitemap.xml']:
    try:
        ET.parse(f)
        print('XML OK', f)
    except Exception as e:
        print('XML ERR', f, e)
