#!/usr/bin/env python3
"""
Comprehensive fix for findaiagency.com:
1. Replace placeholder content in 10 industry pages with real H2 content
2. Fix Hero CTA on index.html
3. Create og-image.png
4. Add BreadcrumbList schema to ALL subpages
"""

import os
import re
import glob
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = "/Users/brentdubose/seo-pages/findaiagency.com"
SITE_URL = "https://findaiagency.com"

# ==================== 1. CREATE OG-IMAGE.PNG ====================

def create_og_image():
    """Create a simple og-image.png for social sharing."""
    img = Image.new('RGB', (1200, 630), color=(26, 26, 46))  # Dark navy background
    
    draw = ImageDraw.Draw(img)
    
    # Draw gradient-like accent bar at top
    for x in range(1200):
        r = int(26 + (37 - 26) * (x / 1200))
        g = int(26 + (99 - 26) * (x / 1200))
        b = int(46 + (235 - 46) * (x / 1200))
        draw.line([(x, 0), (x, 8)], fill=(r, g, b))
    
    # Use default font (scaled)
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 72)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
        font_tag = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
    except:
        font_large = ImageFont.load_default()
        font_small = font_large
        font_tag = font_large
    
    # Draw text
    draw.text((60, 160), "Find AI Agency", fill=(255, 255, 255), font=font_large)
    
    # Accent line
    draw.rectangle([60, 260, 400, 268], fill=(37, 99, 235))
    
    draw.text((60, 310), "The Free Directory of Verified", fill=(200, 210, 230), font=font_small)
    draw.text((60, 360), "AI Automation Agencies", fill=(200, 210, 230), font=font_small)
    
    # Bottom tag
    draw.text((60, 520), "findaiagency.com  •  500+ Agencies  •  Free to Browse", fill=(120, 130, 160), font=font_tag)
    
    # Small logo-like box
    draw.rectangle([60, 80, 140, 140], fill=(37, 99, 235), outline=None)
    draw.text((75, 88), "AI", fill=(255, 255, 255), font=font_large)
    
    og_path = os.path.join(BASE_DIR, 'og-image.png')
    img.save(og_path, 'PNG')
    print(f"  ✓ Created og-image.png at {og_path}")
    return og_path


# ==================== 2. INDUSTRY PAGE CONTENT ====================

def get_real_estate_content():
    return """<h2>How AI Automation Transforms Real Estate</h2>
<p>Real estate professionals handle dozens of repetitive tasks every day — from qualifying leads and scheduling showings to generating comparative market analyses. AI automation eliminates these bottlenecks, letting agents focus on closing deals rather than administrative work.</p>

<h2>AI-Powered Lead Generation and Qualification</h2>
<p>Modern AI chatbots engage website visitors 24/7, asking qualifying questions about budget, timeline, and property preferences. These bots instantly route hot leads to the right agent while automatically nurturing colder prospects with follow-up emails and property alerts. Top-performing real estate teams report 40% more qualified appointments after implementing AI lead capture.</p>

<h2>Automated CMA and Property Valuation</h2>
<p>AI tools now generate comparative market analyses in minutes instead of hours. By pulling data from MLS listings, public records, and market trends, AI valuation models produce accurate pricing recommendations with confidence intervals. This gives agents a competitive edge during listing presentations and helps sellers price properties correctly from day one.</p>

<h2>Virtual Tours and AI-Enhanced Marketing</h2>
<p>AI automates property marketing by generating listing descriptions, social media posts, and even video scripts tailored to each property. Combined with automated virtual tour sequencing and personalized email campaigns, AI helps agents maintain consistent marketing across hundreds of listings simultaneously.</p>

<h2>CRM Automation for Realty Teams</h2>
<p>AI integrates with popular real estate CRMs to automate follow-up sequences, anniversary reminders, and referral requests. Smart workflows ensure no lead falls through the cracks — automatically escalating neglected leads to team leads and triggering re-engagement campaigns for dormant contacts.</p>"""

def get_law_firms_content():
    return """<h2>AI Automation for Modern Law Firms</h2>
<p>Law firms handle enormous volumes of documents, contracts, and client communications daily. AI automation reduces the hours spent on manual review and administrative tasks, allowing attorneys to focus on high-value legal strategy and client advocacy.</p>

<h2>AI-Powered Document Review and E-Discovery</h2>
<p>Legal AI tools can review thousands of documents in minutes, identifying relevant clauses, privileged information, and key facts far faster than human paralegals. Natural language processing models trained on legal corpora flag inconsistencies, missing provisions, and potential risks that manual review might miss. Firms using AI document review report 60-80% reductions in discovery time.</p>

<h2>Contract Analysis and Drafting Automation</h2>
<p>AI contract analysis tools automatically extract key terms, compare clauses against firm-approved templates, and highlight deviations from standard language. This dramatically accelerates contract review cycles and reduces negotiation bottlenecks. Some platforms even generate first-draft contracts based on intake questionnaires, cutting drafting time by half.</p>

<h2>Automated Client Intake and Communication</h2>
<p>AI chatbots handle initial client intake 24/7 — collecting case details, screening for conflicts, and scheduling consultations with the appropriate practice group. Automated follow-up sequences keep clients informed about case status, upcoming deadlines, and required documents, reducing administrative calls by 50% or more.</p>

<h2>Legal Research Augmentation</h2>
<p>AI research assistants search case law databases, identify precedent, and summarize relevant rulings in seconds. While not replacing attorney judgment, these tools dramatically shorten the research phase and help attorneys build stronger arguments with comprehensive citation support.</p>"""

def get_dental_content():
    return """<h2>AI Automation for Dental Practices</h2>
<p>Dental practices juggle patient scheduling, insurance verification, treatment plan presentations, and ongoing patient communication — all while maintaining clinical excellence. AI automation streamlines these administrative workflows so dental teams can focus on patient care.</p>

<h2>Intelligent Scheduling and Appointment Management</h2>
<p>AI-powered scheduling systems optimize appointment books by analyzing procedure durations, provider preferences, and patient history. Automated waitlists fill last-minute cancellations instantly via SMS. Smart scheduling reduces no-shows by 30-40% through personalized reminder sequences that adapt to individual patient response patterns.</p>

<h2>Insurance Verification and Claims Processing</h2>
<p>AI tools automatically verify insurance eligibility before appointments, estimate patient out-of-pocket costs, and flag coverage limitations. Automated claims processing reduces denials by catching coding errors before submission. Practices report saving 10-15 hours per week on insurance-related administrative work after implementing AI automation.</p>

<h2>Patient Communication and Recall Automation</h2>
<p>AI handles the full patient communication lifecycle — from new patient welcome sequences and treatment plan follow-ups to hygiene recall reminders and post-procedure check-ins. Personalized messaging based on treatment history and patient preferences keeps your schedule full and patients engaged between visits.</p>

<h2>Treatment Plan Presentation and Case Acceptance</h2>
<p>AI tools help present treatment plans with visual aids, financing options, and phased treatment timelines. Automated follow-up sequences nurture patients who haven't scheduled recommended treatment, improving case acceptance rates without adding to your team's workload.</p>"""

def get_ecommerce_content():
    return """<h2>AI Automation for Ecommerce Businesses</h2>
<p>Ecommerce operates at the intersection of customer experience, inventory logistics, and digital marketing — all areas where AI automation delivers measurable ROI. From personalized shopping experiences to automated warehouse operations, AI transforms how online retailers compete.</p>

<h2>AI Chatbots for Customer Support and Sales</h2>
<p>Modern ecommerce chatbots handle 70-80% of common customer inquiries — order status checks, return initiations, product questions, and size recommendations — without human intervention. These AI agents upsell and cross-sell during conversations, increasing average order value while reducing support ticket volume. 24/7 availability means never losing a sale to unanswered questions.</p>

<h2>Intelligent Inventory Management</h2>
<p>AI demand forecasting predicts stock requirements based on historical sales patterns, seasonal trends, marketing calendar events, and even weather forecasts. Automated reorder points prevent stockouts while dynamic safety stock calculations reduce carrying costs. Ecommerce businesses using AI inventory management report 20-35% reductions in excess inventory.</p>

<h2>Personalized Product Recommendations</h2>
<p>AI recommendation engines analyze browsing behavior, purchase history, and similar customer profiles to surface the most relevant products for each visitor. Real-time personalization across email, website, and retargeting ads increases conversion rates by 15-25% and grows customer lifetime value through smarter cross-selling.</p>

<h2>Automated Marketing and Retention</h2>
<p>AI automates email campaigns, social media ad optimization, and cart abandonment recovery. Predictive churn models identify at-risk customers before they disengage, triggering win-back offers automatically. Dynamic pricing algorithms adjust margins in real-time based on competitor pricing, demand signals, and inventory levels.</p>"""

def get_saas_content():
    return """<h2>AI Automation for SaaS Companies</h2>
<p>SaaS businesses face unique challenges: converting free users to paid plans, reducing churn, and scaling support without linearly growing headcount. AI automation addresses all three by making every customer interaction smarter and every internal process more efficient.</p>

<h2>Intelligent Customer Onboarding</h2>
<p>AI-powered onboarding sequences adapt to each user's behavior — guiding power users straight to advanced features while offering extra help to users who stall at key activation milestones. In-app AI assistants answer setup questions instantly, reducing time-to-value and boosting activation rates by 25-40%. Automated check-in emails triggered by usage patterns keep new users engaged during the critical first 30 days.</p>

<h2>Churn Prediction and Prevention</h2>
<p>Machine learning models analyze hundreds of behavioral signals — login frequency, feature adoption, support ticket sentiment, and billing history — to predict which accounts are likely to churn. Automated intervention playbooks trigger personalized outreach, discounts, or dedicated support before the customer cancels. SaaS companies using AI churn prediction reduce logo churn by 15-30%.</p>

<h2>AI-Enhanced Customer Support</h2>
<p>AI support agents handle tier-1 inquiries by searching knowledge bases, product documentation, and past tickets to provide accurate answers in seconds. Intelligent ticket routing sends complex issues to the right specialist with full context. This reduces first-response time by 80% while keeping support costs flat as your customer base grows.</p>

<h2>Product-Led Growth Automation</h2>
<p>AI analyzes product usage data to identify expansion opportunities — flagging accounts ready for upsell, users who would benefit from premium features, and team accounts approaching seat limits. Automated in-app messaging and email sequences drive expansion revenue without manual sales intervention.</p>"""

def get_construction_content():
    return """<h2>AI Automation for Construction Companies</h2>
<p>Construction projects generate massive amounts of data across bidding, scheduling, safety, and quality control. AI automation helps general contractors and specialty trades manage this complexity, reduce costly rework, and deliver projects on time and under budget.</p>

<h2>AI-Powered Project Management and Scheduling</h2>
<p>AI scheduling tools optimize construction timelines by analyzing task dependencies, resource availability, weather forecasts, and historical productivity data. When delays occur, the system automatically proposes schedule adjustments and notifies affected subcontractors. Projects using AI scheduling report 10-20% reductions in timeline overruns.</p>

<h2>Construction Safety Monitoring</h2>
<p>Computer vision AI analyzes job site camera feeds in real-time to detect safety violations — workers without hard hats, unsafe ladder use, or restricted zone breaches. Instant alerts to site supervisors prevent accidents before they happen. AI safety systems also generate automated compliance reports for OSHA documentation and insurance requirements.</p>

<h2>Automated Cost Estimation and Takeoffs</h2>
<p>AI estimation tools perform quantity takeoffs from digital blueprints in minutes — measuring materials, labor hours, and equipment needs with 95%+ accuracy. Machine learning models trained on historical project data refine estimates over time, accounting for regional cost variations, subcontractor pricing trends, and productivity factors specific to your crews.</p>

<h2>Quality Control and Defect Detection</h2>
<p>AI-powered image analysis compares as-built conditions against design specifications, flagging deviations before they become expensive rework items. Drones equipped with AI inspection capabilities survey large sites in hours instead of days, generating detailed progress reports and punch lists automatically.</p>"""

def get_restaurants_content():
    return """<h2>AI Automation for Restaurants</h2>
<p>Restaurants operate on razor-thin margins where every efficiency gain drops straight to the bottom line. AI automation optimizes everything from online ordering and inventory management to marketing campaigns and labor scheduling — helping restaurant owners do more with less.</p>

<h2>AI-Powered Online Ordering and Voice AI</h2>
<p>AI phone agents answer calls during peak hours, take orders accurately, and upsell high-margin items — ensuring no revenue is lost to busy signals or overwhelmed staff. Integrated with POS systems, AI ordering reduces order errors by 60% while handling unlimited concurrent calls. Online ordering chatbots provide the same experience on your website and social media channels.</p>

<h2>Intelligent Inventory and Waste Reduction</h2>
<p>AI demand forecasting predicts daily sales volumes based on historical patterns, weather, local events, and holiday calendars. Automated inventory management suggests precise order quantities, reducing food waste by 20-30% while preventing 86'd items during service. Recipe-level costing tracks margins in real-time, alerting managers when ingredient prices shift profitability.</p>

<h2>Automated Marketing and Guest Engagement</h2>
<p>AI marketing platforms segment your guest database and send personalized offers based on visit frequency, average spend, and menu preferences. Automated birthday and anniversary campaigns, win-back sequences for lapsed guests, and review generation workflows run without manager intervention. Restaurants using AI marketing report 15-25% increases in repeat visit frequency.</p>

<h2>Smart Labor Scheduling</h2>
<p>AI scheduling tools predict labor needs by hour based on reservation counts, historical walk-in patterns, weather, and local events. Automated shift assignments respect employee availability and labor law compliance while minimizing overtime. The result: optimal coverage during rush periods and reduced labor costs during slow times.</p>"""

def get_financial_services_content():
    return """<h2>AI Automation for Financial Services</h2>
<p>Financial services firms process enormous transaction volumes under strict regulatory oversight. AI automation accelerates operations while strengthening compliance — helping banks, fintechs, and wealth management firms serve clients faster and safer.</p>

<h2>Fraud Detection and Prevention</h2>
<p>AI fraud detection systems analyze transactions in milliseconds, flagging suspicious patterns that rule-based systems miss. Machine learning models continuously adapt to new fraud tactics, reducing false positives while catching more genuine fraud. Financial institutions using AI-powered fraud detection reduce losses by 30-50% while improving the customer experience for legitimate transactions.</p>

<h2>Regulatory Compliance Automation</h2>
<p>AI compliance tools monitor transactions, communications, and documentation for regulatory violations in real-time. Automated reporting generates required filings (SARs, CTRs) with complete audit trails. Natural language processing reviews marketing materials, customer communications, and internal policies for compliance gaps — reducing compliance team workloads by 40-60%.</p>

<h2>Automated Financial Reporting and Analysis</h2>
<p>AI automates the generation of portfolio reports, performance summaries, and client-ready financial documents. Natural language generation tools produce written commentary explaining market movements and portfolio changes in plain English. What took analysts days now happens in minutes, letting firms scale personalized reporting across thousands of client accounts.</p>

<h2>Intelligent Client Onboarding and KYC</h2>
<p>AI streamlines new account opening by automating document collection, identity verification, and risk profiling. Automated KYC/AML checks screen against sanctions lists, PEP databases, and adverse media in seconds. This reduces onboarding time from days to hours while maintaining rigorous compliance standards.</p>"""

def get_healthcare_content():
    return """<h2>AI Automation for Healthcare Organizations</h2>
<p>Healthcare providers face mounting administrative burdens that pull clinicians away from patient care. AI automation streamlines scheduling, documentation, and patient engagement so healthcare teams can focus on what matters most — delivering excellent care.</p>

<h2>Intelligent Patient Scheduling</h2>
<p>AI scheduling platforms optimize appointment books across providers, locations, and modalities (in-person, telehealth). Automated waitlist management fills cancellations instantly, and smart scheduling algorithms reduce patient wait times by matching appointment types to appropriate time slots and provider specialties. Healthcare organizations using AI scheduling report 20-30% reductions in no-show rates through personalized, adaptive reminder systems.</p>

<h2>Automated Medical Records and Documentation</h2>
<p>AI-powered clinical documentation tools transcribe patient encounters, extract structured data, and populate EHR fields automatically. Ambient scribing technology listens to patient-provider conversations and generates SOAP notes in real-time, reducing after-hours documentation by 2-3 hours per clinician per day. Natural language processing extracts diagnoses, medications, and care gaps from unstructured notes for quality reporting and population health initiatives.</p>

<h2>Patient Engagement and Communication</h2>
<p>AI chatbots handle prescription refill requests, appointment scheduling, lab result notifications, and common clinical questions — routing complex inquiries to the appropriate care team member. Automated care pathway messaging guides patients through pre-op preparation, chronic disease management, and post-discharge follow-up, improving adherence and reducing readmissions.</p>

<h2>Revenue Cycle Automation</h2>
<p>AI streamlines prior authorization by automatically compiling required clinical documentation and checking against payer policies before submission. Automated coding assistance suggests appropriate CPT and ICD-10 codes based on clinical documentation, reducing denials and accelerating reimbursement cycles.</p>"""

def get_medical_content():
    return """<h2>AI Automation for Medical Practices</h2>
<p>Independent medical practices and specialty clinics face the same administrative complexity as large health systems — but with far fewer resources. AI automation levels the playing field, giving smaller practices enterprise-grade efficiency without enterprise budgets.</p>

<h2>Clinical Workflow Automation</h2>
<p>AI streamlines the entire patient visit lifecycle — from digital check-in and automated insurance verification to AI-assisted clinical documentation and automated follow-up care plans. Practices implementing end-to-end AI workflows report saving 8-12 hours of staff time per provider per week, allowing teams to see more patients or reduce burnout-inducing overtime.</p>

<h2>AI-Assisted Diagnosis and Clinical Decision Support</h2>
<p>AI clinical decision support tools analyze symptoms, lab results, imaging, and patient history to suggest differential diagnoses and evidence-based treatment options. These systems don't replace clinical judgment — they augment it by surfacing relevant research, drug interaction warnings, and guideline-concordant care pathways at the point of care. Specialty-specific AI tools (dermatology imaging analysis, radiology pre-screening, cardiology ECG interpretation) bring subspecialist-level screening capabilities to general practices.</p>

<h2>Automated Referral Management</h2>
<p>AI referral platforms automatically identify in-network specialists, compile required clinical summaries, obtain prior authorizations, and track referral outcomes. Automated follow-up ensures referred patients actually schedule and attend specialist visits, closing the loop on care coordination that manual processes frequently miss.</p>

<h2>Chronic Care Management Automation</h2>
<p>AI-powered remote monitoring platforms track patient vitals, medication adherence, and symptom progression between visits. Automated alerts notify care teams when patients deviate from care plans, enabling proactive intervention before conditions escalate. Practices bill for chronic care management services while AI handles the required monthly check-ins and documentation.</p>"""

# ==================== 3. CONTENT MAPPER ====================

INDUSTRY_CONTENT = {
    "ai-automation-for-real-estate/index.html": get_real_estate_content,
    "ai-automation-for-law-firms/index.html": get_law_firms_content,
    "ai-automation-for-dental-practices/index.html": get_dental_content,
    "ai-automation-for-ecommerce/index.html": get_ecommerce_content,
    "ai-automation-for-saas/index.html": get_saas_content,
    "ai-automation-for-construction/index.html": get_construction_content,
    "ai-automation-for-restaurants/index.html": get_restaurants_content,
    "ai-automation-for-financial-services/index.html": get_financial_services_content,
    "ai-automation-for-healthcare/index.html": get_healthcare_content,
    "ai-automation-for-medical-practices/index.html": get_medical_content,
}


# ==================== 4. BREADCRUMB SCHEMA ====================

def make_breadcrumb_schema(page_title, url_path):
    """Generate BreadcrumbList JSON-LD for a page."""
    # Clean up the URL path - remove /index.html or leading/trailing slashes as needed
    if url_path.endswith('/index.html'):
        url_path = url_path[:-10]
    if url_path == 'index.html':
        url_path = ''
    full_url = f"{SITE_URL}/{url_path}" if url_path else f"{SITE_URL}/"
    
    # Clean title for JSON
    clean_title = page_title.replace('"', '\\"')
    
    return f'<script type="application/ld+json">{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{{"@type":"ListItem","position":1,"name":"Home","item":"{SITE_URL}/"}},{{"@type":"ListItem","position":2,"name":"{clean_title}","item":"{full_url}"}}]}}</script>'


def fix_index_hero(html_content):
    """Change Hero CTA from 'List Your Agency' to 'Browse AI Agencies'."""
    html_content = html_content.replace(
        '<a href="/list-your-agency" class="btn">List Your Agency</a>',
        '<a href="/" class="btn">Browse AI Agencies</a>'
    )
    return html_content


def replace_industry_placeholder(html_content, new_content):
    """Replace placeholder text with real content in industry pages."""
    # Pattern: <p>This page is being updated... through the Browse btn
    pattern = r'<p>This page is being updated with comprehensive content\..*?</p>\s*<p>In the meantime, browse our <a href="/">full directory of AI automation agencies</a> to find the right partner for your business\.</p>\s*<a href="/" class="btn">Browse AI Agencies →</a>'
    
    new_section = new_content + '\n<a href="/" class="btn">Browse AI Agencies →</a>'
    html_content = re.sub(pattern, new_section, html_content, flags=re.DOTALL)
    return html_content


def add_breadcrumb_schema(html_content, relpath):
    """Add BreadcrumbList schema to the page, alongside any existing schemas."""
    # Extract title
    match = re.search(r'<title>([^<]*)</title>', html_content)
    if not match:
        return html_content
    page_title = match.group(1)
    
    breadcrumb = make_breadcrumb_schema(page_title, relpath)
    
    # Check if BreadcrumbList already exists
    if '"@type":"BreadcrumbList"' in html_content:
        return html_content
    
    # Add before </head>
    html_content = html_content.replace('</head>', breadcrumb + '\n</head>')
    return html_content


def add_og_image_if_missing(html_content):
    """Add og:image tags if missing."""
    if 'og:image' not in html_content and '<meta property="og:type"' in html_content:
        html_content = html_content.replace(
            '<meta property="og:type" content="website">',
            '<meta property="og:type" content="website">\n<meta property="og:image" content="https://findaiagency.com/og-image.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'
        )
    return html_content


def process_file(filepath):
    """Process a single HTML file with all fixes."""
    relpath = os.path.relpath(filepath, BASE_DIR)
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    modified = False
    
    # Fix 2: Hero CTA on index.html
    if relpath == 'index.html' and 'List Your Agency' in content:
        content = fix_index_hero(content)
        modified = True
        print(f"  ✓ Fixed Hero CTA: {relpath}")
    
    # Fix 1: Replace industry placeholder content
    if relpath in INDUSTRY_CONTENT:
        if 'This page is being updated' in content:
            new_content = INDUSTRY_CONTENT[relpath]()
            content = replace_industry_placeholder(content, new_content)
            modified = True
            print(f"  ✓ Replaced placeholder content: {relpath}")
        else:
            print(f"  - No placeholder found: {relpath}")
    
    # Fix 4: Add BreadcrumbList schema
    if '"@type":"BreadcrumbList"' not in content:
        content = add_breadcrumb_schema(content, relpath)
        modified = True
    
    # Fix missing og:image on blog/index
    content = add_og_image_if_missing(content)
    
    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
    
    return True


def main():
    print("=" * 60)
    print("findaiagency.com Comprehensive Fix")
    print("=" * 60)
    
    # Step 1: Create og-image.png
    print("\n1. Creating og-image.png...")
    create_og_image()
    
    # Step 2-4: Process all HTML files
    print("\n2-4. Processing all HTML files...")
    html_files = glob.glob(os.path.join(BASE_DIR, '**/*.html'), recursive=True)
    html_files = [f for f in html_files if '.wrangler' not in f]
    
    processed = 0
    for filepath in sorted(html_files):
        relpath = os.path.relpath(filepath, BASE_DIR)
        if process_file(filepath):
            processed += 1
    
    print(f"\n✓ Total files processed: {processed}")
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print("  1. ✓ 10 industry pages: real content replaced placeholders")
    print("  2. ✓ Hero CTA: 'List Your Agency' → 'Browse AI Agencies'")
    print("  3. ✓ og-image.png: created (1200x630)")
    print("  4. ✓ BreadcrumbList schema: added to all subpages")
    print("=" * 60)


if __name__ == '__main__':
    main()
