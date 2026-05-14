#!/usr/bin/env python3
"""Fix findaiagency.com - add meta tags, schema, replace placeholders, create robots.txt"""

import os
import re
import glob

BASE_DIR = "/Users/brentdubose/seo-pages/findaiagency.com"

# Organization schema to add to ALL pages
ORG_SCHEMA = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Find AI Agency","url":"https://findaiagency.com","description":"Free directory of verified AI automation agencies. Compare top AI agencies by niche, specialty, budget, and location.","foundingDate":"2025","logo":"https://findaiagency.com/og-image.png","sameAs":[]}</script>'

# OG Image meta tag
OG_IMAGE = '<meta property="og:image" content="https://findaiagency.com/og-image.png">'
OG_IMAGE_WIDTH = '<meta property="og:image:width" content="1200">'
OG_IMAGE_HEIGHT = '<meta property="og:image:height" content="630">'

# Twitter card meta tags
TWITTER_CARD = '<meta name="twitter:card" content="summary_large_image">'
TWITTER_SITE = '<meta name="twitter:site" content="@findaiagency">'

def add_meta_tags(html_content, page_title, page_description):
    """Add og:image, twitter cards, and schema to an HTML page."""
    
    # Add og:image after og:type
    if 'og:image' not in html_content:
        html_content = html_content.replace(
            '<meta property="og:type" content="website">',
            '<meta property="og:type" content="website">\n' + OG_IMAGE + '\n' + OG_IMAGE_WIDTH + '\n' + OG_IMAGE_HEIGHT
        )
    
    # Add twitter cards after og tags (before style or script)
    if 'twitter:card' not in html_content:
        twitter_title = page_title.replace('"', '&quot;')
        twitter_desc = page_description.replace('"', '&quot;')
        twitter_tags = f'{TWITTER_CARD}\n<meta name="twitter:title" content="{twitter_title}">\n<meta name="twitter:description" content="{twitter_desc}">\n{TWITTER_SITE}'
        html_content = html_content.replace(
            '<style>',
            twitter_tags + '\n<style>'
        )
    
    # Add Organization schema before </head> if no schema exists
    if 'application/ld+json' not in html_content:
        html_content = html_content.replace(
            '</head>',
            ORG_SCHEMA + '\n</head>'
        )
    elif '"@type":"WebSite"' in html_content and '"@type":"Organization"' not in html_content:
        # Has WebSite schema but no Organization - add Organization too
        html_content = html_content.replace(
            '</head>',
            ORG_SCHEMA + '\n</head>'
        )
    
    return html_content

# =========== CONTENT REPLACEMENTS ===========

def get_guide_what_does_agency_do():
    return """<h2>What Exactly Does an AI Agency Do?</h2>
<p>An AI agency helps businesses implement artificial intelligence and automation solutions. Unlike traditional software consultancies, AI agencies specialize in bridging the gap between business needs and cutting-edge AI technology. They handle everything from strategy and discovery through implementation, training, and ongoing optimization.</p>

<h2>Core AI Agency Services</h2>
<p>The typical AI agency offers a range of services including conversational AI chatbots, workflow automation, custom AI model development, data analytics pipelines, and AI strategy consulting. Many agencies also provide AI integration services — connecting AI tools like ChatGPT, Claude, or custom models into existing business systems like CRMs, ERPs, and marketing platforms.</p>

<h2>How AI Agencies Work With Clients</h2>
<p>Most AI agencies follow a structured engagement model. They begin with a discovery phase — auditing your current processes to identify high-impact automation opportunities. Next, they design a tailored AI solution and develop a proof of concept. After approval, the agency handles full implementation, user training, and ongoing monitoring. The best agencies offer post-launch support and continuously optimize your AI systems as models improve.</p>

<h2>Why Hire an AI Agency Instead of Building In-House?</h2>
<p>Building an internal AI team requires hiring expensive machine learning engineers, data scientists, and MLOps specialists — often costing $500K+ annually. An AI agency gives you access to an entire team of specialists at a fraction of that cost. Agencies also bring cross-industry experience, proven frameworks, and faster time-to-value. For most businesses, partnering with an AI agency is the most efficient path to AI adoption.</p>

<h2>Choosing the Right AI Agency</h2>
<p>Look for agencies with proven case studies in your industry, transparent pricing, and a clear methodology. Ask about their technology stack, data privacy practices, and post-launch support. The right AI agency becomes a long-term strategic partner — not just a one-time vendor.</p>"""

def get_guide_services_list():
    return """<h2>1. AI Chatbot & Virtual Assistant Development</h2>
<p>Custom AI chatbots for customer support, lead qualification, and internal knowledge bases. Modern AI agencies build conversational agents powered by large language models that understand context, handle complex queries, and integrate with your CRM and help desk software.</p>

<h2>2. Workflow & Business Process Automation</h2>
<p>Automating repetitive tasks like data entry, invoice processing, email triage, and report generation. AI agencies use tools like Make, Zapier, n8n, and custom Python integrations to eliminate manual workflows and reduce operational costs by 40-60%.</p>

<h2>3. Custom AI Model Development</h2>
<p>Building fine-tuned machine learning models for specific business use cases — from predictive maintenance and fraud detection to personalized product recommendations and demand forecasting.</p>

<h2>4. AI-Powered Data Analytics & Business Intelligence</h2>
<p>AI agencies build pipelines that transform raw data into actionable insights. This includes natural language querying of databases, automated dashboard generation, and anomaly detection systems that alert you before problems escalate.</p>

<h2>5. AI Strategy Consulting</h2>
<p>Before writing code, the best agencies help you identify where AI will deliver the highest ROI. AI strategy engagements typically include opportunity assessments, feasibility studies, build-vs-buy analysis, and phased implementation roadmaps.</p>

<h2>6. AI Integration Services</h2>
<p>Integrating AI APIs (OpenAI, Anthropic, Google AI) and open-source models into existing software stacks. This includes middleware development, API orchestration, and ensuring AI outputs flow seamlessly into your business applications.</p>

<h2>7-15. Additional Services</h2>
<p>Other common services include AI voice agent development, computer vision solutions, AI-powered marketing automation, SEO content generation, RPA (robotic process automation), sentiment analysis, AI compliance consulting, and staff AI training programs.</p>"""

def get_guide_agency_vs_freelancer():
    return """<h2>AI Agency vs Freelancer: Key Differences</h2>
<p>When you hire an AI freelancer, you get one person with a specific skill set. When you hire an AI agency, you get a full team — project managers, AI engineers, data scientists, QA specialists, and account managers — all working together on your project.</p>

<h2>When to Hire an AI Freelancer</h2>
<p>Freelancers work well for small, well-defined projects. If you need a single chatbot built, a data pipeline configured, or a specific automation workflow set up, an experienced freelancer can deliver quickly and affordably. Typical freelancer rates range from $75-200/hour. The downside: if the freelancer gets sick, takes another contract, or disappears, your project stalls.</p>

<h2>When to Choose an AI Agency</h2>
<p>Agencies are the better choice for complex, multi-component projects. If you need a full AI strategy, multiple integrated automations, custom model training, and ongoing support — hire an agency. Agencies provide redundancy (multiple team members), established processes, QA testing, and SLAs. Typical agency pricing ranges from $5,000-50,000+ per month depending on scope.</p>

<h2>Cost Comparison</h2>
<p>A freelancer might charge $5,000 for a chatbot project. An agency might charge $15,000 — but you get strategy, design, development, testing, documentation, and 30 days of post-launch support. For mission-critical AI systems, the agency premium is worth the reliability and breadth of expertise.</p>

<h2>Making the Decision</h2>
<p>Ask yourself: Is this a one-off task or an ongoing initiative? Do you need strategy or just execution? Is this mission-critical? If you answered "ongoing" or "mission-critical" to any of these, choose an agency. Use our directory to compare top-rated AI agencies for your needs.</p>"""

def get_guide_small_business():
    return """<h2>Best AI Agencies for Small Business: What to Look For</h2>
<p>Small businesses need AI agencies that understand limited budgets, tight timelines, and the need for immediate ROI. The best SMB-focused AI agencies offer flexible pricing, scalable solutions, and a consultative approach that doesn't require you to be technically savvy.</p>

<h2>Top Criteria for Evaluating AI Agencies</h2>
<p>Look for agencies with SMB case studies, transparent fixed-price packages, and industry-specific experience. The best small business AI partners offer starter packages ($2,000-5,000) for initial automations with clear pathways to scale. Avoid agencies that push enterprise-level commitments or lock you into long-term contracts without a pilot phase.</p>

<h2>Common AI Solutions for Small Businesses</h2>
<p>Most SMBs start with customer service chatbots, lead qualification automation, email marketing AI, and basic workflow automation. These solutions typically deliver 3-10x ROI within the first six months. A good AI agency will help you prioritize the highest-impact use cases first.</p>

<h2>Red Flags to Avoid</h2>
<p>Watch out for agencies that can't provide SMB references, push proprietary locked-in platforms, or quote vague "AI transformation" packages without specific deliverables. The best agencies are transparent about what AI can and can't do for a business of your size.</p>

<h2>Getting Started</h2>
<p>Most small business AI projects start with a free or low-cost discovery call. Use our directory to filter agencies by budget, industry, and location to find your ideal AI partner.</p>"""

def get_guide_startups():
    return """<h2>AI Agencies for Startups: Speed, Scale, and Innovation</h2>
<p>Startups operate differently from established businesses. They need AI partners who move fast, understand lean budgets, and can build scalable AI infrastructure from day one. The best AI agencies for startups bring both technical expertise and startup-operating experience.</p>

<h2>Why Startups Need Specialized AI Agencies</h2>
<p>Unlike enterprise-focused agencies that spend months on discovery and compliance, startup-savvy agencies use agile sprints, rapid prototyping, and MVP-first approaches. They understand that a startup's AI needs evolve quickly — from a basic chatbot at seed stage to full-scale AI operations at Series B.</p>

<h2>Key Services for Startup AI</h2>
<p>Common startup AI projects include: AI-powered product features (in-app assistants, smart search), growth automation (lead scoring, churn prediction), operational AI (automated customer onboarding, intelligent routing), and AI-enhanced analytics for investor reporting.</p>

<h2>Budget Considerations</h2>
<p>Startup-friendly AI agencies typically offer equity-friendly pricing, milestone-based payments, or reduced rates for early-stage companies. Expect to invest $3,000-15,000 for initial AI capabilities, with costs scaling as you grow. Some agencies even offer AI-as-a-Service subscriptions starting at $1,000/month.</p>

<h2>Choosing Your Startup AI Partner</h2>
<p>Prioritize agencies that have worked with venture-backed startups, understand your tech stack, and can provide references from founders. The right partner becomes a competitive advantage — helping you ship AI features faster than competitors.</p>"""

def get_guide_enterprise():
    return """<h2>Enterprise AI Agencies: What Sets Them Apart</h2>
<p>Enterprise AI implementations require a different caliber of agency — one with experience navigating compliance frameworks (SOC 2, HIPAA, GDPR), integrating with legacy systems, and managing organizational change across thousands of employees.</p>

<h2>Enterprise AI Capabilities</h2>
<p>Enterprise-grade AI agencies offer dedicated project management, security-first architectures, on-premise deployment options, and 24/7 support SLAs. They typically have partnerships with major cloud providers (AWS, Azure, GCP) and AI platforms (OpenAI, Anthropic, Google AI) that ensure enterprise-level reliability and support.</p>

<h2>Common Enterprise AI Use Cases</h2>
<p>Enterprises typically deploy AI across multiple business units: intelligent document processing for legal and finance, AI-powered contact centers handling millions of interactions, predictive analytics for supply chain optimization, and enterprise-wide knowledge management systems. These projects often span 6-18 months with budgets ranging from $100K to $5M+.</p>

<h2>Enterprise Selection Criteria</h2>
<p>When evaluating AI agencies for enterprise projects, assess their: Fortune 500 client roster, security certifications, data residency capabilities, integration experience with your specific tech stack (SAP, Salesforce, ServiceNow), and change management methodology. Request detailed case studies and speak with reference clients at similar scale.</p>

<h2>The RFP Process</h2>
<p>Most enterprise AI engagements begin with a formal RFP. The best agencies provide detailed proposals with architecture diagrams, team bios, phased timelines, and transparent pricing. Plan for a 4-8 week evaluation process before selecting your enterprise AI partner.</p>"""

def get_blog_cost():
    return """<h2>How Much Does an AI Agency Cost in 2026?</h2>
<p>AI agency pricing in 2026 varies dramatically based on project scope, agency expertise, and engagement model. Here's what you can expect to pay at each tier.</p>

<h2>Project-Based Pricing</h2>
<p>For defined-scope projects like a single chatbot or workflow automation, expect to pay <strong>$5,000-$25,000</strong>. These projects typically run 4-12 weeks and include discovery, development, testing, and basic training. Fixed-price projects work well when requirements are clear and unlikely to change.</p>

<h2>Monthly Retainer Models</h2>
<p>Ongoing AI partnerships usually operate on monthly retainers. Small business retainers start at <strong>$2,000-$5,000/month</strong>, mid-market engagements range from <strong>$10,000-$30,000/month</strong>, and enterprise retainers can exceed <strong>$50,000/month</strong>. Retainers typically include dedicated team members, continuous optimization, and priority support.</p>

<h2>Hourly Rates</h2>
<p>AI agency hourly rates range from <strong>$150-$500/hour</strong> depending on the agency's reputation, location, and specialization. Boutique agencies in major tech hubs command premium rates, while agencies in emerging markets often offer competitive pricing with equal quality.</p>

<h2>Hidden Costs to Watch For</h2>
<p>Beyond base fees, budget for: AI API usage costs (OpenAI, Anthropic, etc.), third-party software licenses, cloud infrastructure, ongoing model training data, and maintenance. These can add 20-50% to your total AI spend. Ask for a total cost of ownership estimate upfront.</p>

<h2>ROI Expectations</h2>
<p>Well-executed AI automation typically delivers 3-10x ROI within 12 months. A $15,000 chatbot investment that saves $5,000/month in support costs pays for itself in 3 months. Focus on ROI, not just cost, when evaluating AI agency proposals.</p>"""

def get_blog_choose():
    return """<h2>How to Choose an AI Automation Agency: A Step-by-Step Guide</h2>
<p>Selecting the right AI agency can make or break your automation initiative. Follow this comprehensive buyer's guide to find the perfect partner for your business.</p>

<h2>Step 1: Define Your AI Goals</h2>
<p>Before contacting agencies, clarify what you want AI to achieve. Are you looking to reduce support costs? Increase sales conversions? Automate back-office tasks? Write down specific, measurable goals. The clearer your objectives, the better agencies can propose relevant solutions.</p>

<h2>Step 2: Evaluate Industry Experience</h2>
<p>AI agencies with experience in your industry understand your compliance requirements, customer expectations, and common pain points. Ask for case studies from similar businesses. An agency that's built chatbots for 10 dental practices will deliver better results than one starting from scratch in healthcare.</p>

<h2>Step 3: Review Their Technical Stack</h2>
<p>Ask about their preferred AI platforms, programming languages, and integration approach. A good agency should be technology-agnostic, recommending the best tools for your specific needs rather than pushing their favorite platform. Ensure they have experience with your existing software stack (CRM, ERP, help desk, etc.).</p>

<h2>Step 4: Check References and Reviews</h2>
<p>Speak with at least 2-3 past clients. Ask about communication quality, timeline adherence, budget management, and post-launch support. Check independent review platforms, not just testimonials on the agency's website.</p>

<h2>Step 5: Understand Their Process</h2>
<p>A professional AI agency should have a clear methodology: discovery → design → development → testing → deployment → optimization. Avoid agencies that jump straight to coding without understanding your business context.</p>

<h2>Step 6: Assess Cultural Fit</h2>
<p>You'll work closely with your AI agency for months or years. Ensure their communication style, responsiveness, and values align with yours. Schedule a working session or small pilot project before committing to a long-term engagement.</p>"""

def get_city_new_york():
    return """<h2>Why New York City is a Hub for AI Agencies</h2>
<p>New York City has emerged as one of the world's leading AI hubs, home to a dense concentration of AI agencies serving finance, media, healthcare, retail, and legal industries. NYC-based AI agencies benefit from proximity to Fortune 500 headquarters, top-tier talent from NYU and Columbia, and a vibrant startup ecosystem.</p>

<h2>Industries Served by NYC AI Agencies</h2>
<p>New York AI agencies specialize across the city's dominant industries. Financial services AI includes algorithmic trading tools, risk assessment models, and compliance automation. Media and advertising agencies use AI for content personalization and programmatic ad optimization. Healthcare AI agencies in NYC focus on clinical workflow automation and patient engagement platforms.</p>

<h2>What to Expect from NYC AI Agency Pricing</h2>
<p>New York AI agencies typically command premium rates reflecting the city's cost of living and competitive talent market. Expect project minimums of $10,000-25,000 and monthly retainers starting at $5,000. However, NYC agencies often deliver faster results due to their experience with demanding enterprise clients and access to top AI engineering talent.</p>

<h2>Notable NYC AI Agency Strengths</h2>
<p>NYC agencies excel at: enterprise AI integration, AI strategy consulting, custom LLM development, and AI-powered fintech solutions. Many have deep partnerships with OpenAI, Anthropic, and major cloud providers. If you're in finance, media, or legal tech, a NYC-based AI agency likely has directly relevant case studies.</p>

<h2>Finding Your NYC AI Partner</h2>
<p>Use our directory to filter NYC AI agencies by industry focus, budget range, and client reviews. Schedule consultations with 2-3 agencies to compare approaches before making your decision.</p>"""

def get_city_los_angeles():
    return """<h2>Los Angeles AI Agencies: Entertainment, Ecommerce & Beyond</h2>
<p>Los Angeles has grown into a major AI agency hub, driven by the entertainment industry's adoption of AI for content creation, the region's massive ecommerce ecosystem, and a thriving tech scene in Silicon Beach. LA-based AI agencies bring creative flair and technical expertise to every project.</p>

<h2>Key LA Industries Using AI</h2>
<p>Entertainment and media AI agencies in LA specialize in AI-powered video editing, script analysis, audience prediction models, and virtual production tools. Ecommerce AI agencies focus on personalization engines, inventory forecasting, and customer service automation for DTC brands. LA's healthcare AI agencies serve the region's extensive hospital and biotech networks.</p>

<h2>LA Agency Pricing</h2>
<p>LA AI agency rates are competitive with other major tech markets. Project pricing typically ranges from $8,000-$30,000, with monthly retainers starting at $3,500. The region's diverse talent pool means you can find agencies at various price points, from boutique studios to full-service AI consultancies.</p>

<h2>Why Choose an LA AI Agency?</h2>
<p>LA agencies bring unique strengths: expertise in consumer-facing AI experiences, creative problem-solving approaches, and deep experience with media and content AI. If your business is in entertainment, ecommerce, or consumer technology, an LA-based AI agency offers directly relevant expertise.</p>

<h2>Getting Started</h2>
<p>Browse our directory to compare top-rated AI agencies in Los Angeles. Filter by industry, budget, and service type to find your ideal AI partner in the LA area.</p>"""

def get_city_chicago():
    return """<h2>Chicago AI Agencies: Midwest Excellence in Automation</h2>
<p>Chicago has quietly built a formidable AI agency ecosystem, powered by the region's strength in logistics, manufacturing, financial services, and healthcare. Chicago AI agencies are known for practical, ROI-focused approaches that deliver measurable business results.</p>

<h2>Industries Driving Chicago AI Adoption</h2>
<p>Logistics and supply chain AI is a Chicago specialty — agencies build predictive routing, warehouse automation, and demand forecasting systems for the transportation hub of America. Manufacturing AI agencies focus on predictive maintenance, quality control computer vision, and production optimization. Chicago's financial exchanges and trading firms drive demand for AI-powered analytics and risk modeling.</p>

<h2>Chicago Agency Pricing</h2>
<p>One advantage of Chicago AI agencies: competitive pricing relative to coastal markets. Project minimums typically start at $5,000-15,000, with monthly retainers from $2,500. You get enterprise-quality AI talent at rates 20-30% below NYC or SF equivalents.</p>

<h2>The Chicago Advantage</h2>
<p>Chicago agencies are known for: practical, no-nonsense approaches, deep manufacturing and logistics expertise, strong data engineering capabilities, and excellent client communication. They excel at industrial AI applications that coastal agencies often overlook.</p>

<h2>Find Your Chicago AI Partner</h2>
<p>Use our directory to filter Chicago AI agencies by industry specialization, budget, and client reviews. The right Chicago AI partner brings Midwest work ethic and technical excellence to your AI initiative.</p>"""

# Map file paths to content functions
PLACEHOLDER_CONTENT = {
    "what-does-an-ai-agency-do/index.html": get_guide_what_does_agency_do,
    "ai-agency-services-list/index.html": get_guide_services_list,
    "ai-agency-vs-freelancer/index.html": get_guide_agency_vs_freelancer,
    "best-ai-agencies-for-small-business/index.html": get_guide_small_business,
    "best-ai-agencies-for-startups/index.html": get_guide_startups,
    "best-ai-agencies-for-enterprise/index.html": get_guide_enterprise,
    "blog/how-much-does-an-ai-agency-cost-in-2026.html": get_blog_cost,
    "blog/how-to-choose-an-ai-automation-agency.html": get_blog_choose,
    "ai-agency-new-york/index.html": get_city_new_york,
    "ai-agency-los-angeles/index.html": get_city_los_angeles,
    "ai-agency-chicago/index.html": get_city_chicago,
}

def extract_meta_description(html_content):
    """Extract meta description from HTML."""
    match = re.search(r'<meta name="description" content="([^"]*)"', html_content)
    return match.group(1) if match else ""

def extract_title(html_content):
    """Extract title from HTML."""
    match = re.search(r'<title>([^<]*)</title>', html_content)
    return match.group(1) if match else ""

def replace_placeholder(html_content, new_content):
    """Replace the placeholder text with real content."""
    # Remove the placeholder paragraph, the "In the meantime" paragraph, and the btn link
    # Pattern: <p>This page is being updated... through </a> (the Browse AI Agencies btn)
    pattern = r'<p>This page is being updated with comprehensive content\..*?</p>\s*<p>In the meantime, browse our <a href="/">full directory of AI automation agencies</a> to find the right partner for your business\.</p>\s*<a href="/" class="btn">Browse AI Agencies →</a>'
    
    new_section = new_content + '\n<a href="/" class="btn">Browse AI Agencies →</a>'
    html_content = re.sub(pattern, new_section, html_content, flags=re.DOTALL)
    return html_content

def process_file(filepath):
    """Process a single HTML file."""
    relpath = os.path.relpath(filepath, BASE_DIR)
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Skip non-HTML files
    if not filepath.endswith('.html'):
        return False
    
    title = extract_title(content)
    description = extract_meta_description(content)
    
    # Add meta tags to ALL pages
    content = add_meta_tags(content, title, description)
    
    # Replace placeholder for target pages
    if relpath in PLACEHOLDER_CONTENT:
        if 'This page is being updated' in content:
            content = replace_placeholder(content, PLACEHOLDER_CONTENT[relpath]())
            print(f"  ✓ Replaced placeholder in: {relpath}")
        else:
            print(f"  - No placeholder found in: {relpath}")
    
    # Add meta tags to blog index page if needed
    if relpath == 'blog/index.html':
        if 'og:image' not in content:
            content = add_meta_tags(content, title, description)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    return True

def main():
    print("Processing HTML files...")
    
    # Find all HTML files
    html_files = glob.glob(os.path.join(BASE_DIR, '**/*.html'), recursive=True)
    html_files = [f for f in html_files if '.wrangler' not in f]
    
    processed = 0
    for filepath in sorted(html_files):
        relpath = os.path.relpath(filepath, BASE_DIR)
        if process_file(filepath):
            processed += 1
            print(f"  Processed: {relpath}")
    
    # Create robots.txt
    robots_path = os.path.join(BASE_DIR, 'robots.txt')
    robots_content = """User-agent: *
Allow: /
Sitemap: https://findaiagency.com/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 5
"""
    with open(robots_path, 'w') as f:
        f.write(robots_content)
    print(f"\n✓ Created robots.txt")
    
    print(f"\n✓ Total files processed: {processed}")

if __name__ == '__main__':
    main()
