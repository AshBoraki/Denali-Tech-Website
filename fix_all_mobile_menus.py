#!/usr/bin/env python3
"""
Script to fix mobile menu on all pages:
1. Remove old conflicting CSS from pages that have enhanced menu
"""
import re
import os

# Pages that need old CSS removed
pages_to_fix_css = [
    'brands/index.html',
    'contact/index.html', 
    'faq.html',
    'privacy/index.html',
    'services/index.html',
    'blogs/index.html'
]

# Pattern to match old CSS (from .nav-links.active until .nav-links .mobile-call-btn)
old_css_pattern = re.compile(
    r'(\.nav-links\.active\s*\{[^}]*position:\s*absolute[^}]*top:\s*100%[^}]*z-index:\s*999.*?\.nav-links\s+\.mobile-call-btn\s*\{[^}]*display:\s*none[^}]*\})',
    re.DOTALL
)

# Function to remove old CSS
def remove_old_css(content):
    # Find the start position
    start_pattern = r'\.nav-links\.active\s*\{[^}]*position:\s*absolute'
    match = re.search(start_pattern, content)
    if not match:
        return content, False
    
    start_pos = match.start()
    # Find where the old CSS block ends (.nav-links .mobile-call-btn)
    end_pattern = r'\.nav-links\s+\.mobile-call-btn\s*\{[^}]*display:\s*none[^}]*\}'
    end_match = re.search(end_pattern, content[start_pos:])
    if not end_match:
        return content, False
    
    end_pos = start_pos + end_match.end()
    
    # Find what's before (should be .menu-toggle.active span:nth-child(3))
    before = content[:start_pos].rstrip()
    
    # Find what's after
    after = content[end_pos:].lstrip()
    
    # Keep .menu-toggle.active span:nth-child(3) and .nav-links .mobile-call-btn
    new_content = before + '\n\n        .nav-links .mobile-call-btn {\n            display: none;\n        }\n\n' + after
    
    return new_content, True

# Fix pages with old CSS
print("\n" + "="*60)
print("Removing old conflicting CSS...")
print("="*60)

for page in pages_to_fix_css:
    if not os.path.exists(page):
        print(f"⚠️  {page}: File not found")
        continue
    
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content, changed = remove_old_css(content)
    
    if changed:
        with open(page, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ {page}: Removed old CSS")
    else:
        print(f"ℹ️  {page}: No old CSS found (may already be fixed)")

print("\n✅ Done fixing CSS conflicts!")
print("\nNote: Pages missing mobile menu will need manual addition.")
print("These include: thank-you page and all service location pages.")

