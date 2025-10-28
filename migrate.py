#!/usr/bin/env python3
"""
Migration script to extract HTML, CSS, and JavaScript from index.html
and distribute them to appropriate files in the new structure.
"""

import re
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent
INDEX_HTML = BASE_DIR / "index.html"
CSS_DIR = BASE_DIR / "css"
JS_DIR = BASE_DIR / "js"

def read_file(path):
    """Read file content"""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    """Write content to file"""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def extract_styles(html_content):
    """Extract CSS from <style> tags"""
    style_pattern = r'<style>(.*?)</style>'
    matches = re.findall(style_pattern, html_content, re.DOTALL)
    return '\n\n'.join(matches) if matches else ''

def extract_body(html_content):
    """Extract content from <body> tag"""
    body_pattern = r'<body[^>]*>(.*?)</body>'
    match = re.search(body_pattern, html_content, re.DOTALL)
    return match.group(1) if match else ''

def extract_scripts(html_content):
    """Extract JavaScript from <script> tags"""
    # Extract module scripts
    module_pattern = r'<script type="module">(.*?)</script>'
    module_matches = re.findall(module_pattern, html_content, re.DOTALL)
    
    # Extract regular scripts
    script_pattern = r'<script(?!\s+type="module")(?:[^>]*)>(.*?)</script>'
    script_matches = re.findall(script_pattern, html_content, re.DOTALL)
    
    return {
        'modules': module_matches,
        'scripts': script_matches
    }

def categorize_css(css_content):
    """Categorize CSS rules into different files"""
    categories = {
        'variables': [],
        'animations': [],
        'buttons': [],
        'cards': [],
        'typography': [],
        'forms': [],
        'modals': [],
        'other': []
    }
    
    # Split by CSS rules
    rules = re.findall(r'([^{}]+\{[^{}]*\})', css_content)
    
    for rule in rules:
        rule = rule.strip()
        if not rule:
            continue
            
        selector = rule.split('{')[0].strip()
        
        # Categorize based on selector
        if ':root' in selector or '--' in rule:
            categories['variables'].append(rule)
        elif '@keyframes' in selector or 'animation' in rule:
            categories['animations'].append(rule)
        elif 'btn' in selector.lower() or 'button' in selector.lower():
            categories['buttons'].append(rule)
        elif 'card' in selector.lower():
            categories['cards'].append(rule)
        elif any(x in selector for x in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'font', 'text']):
            categories['typography'].append(rule)
        elif any(x in selector for x in ['input', 'form', 'select', 'textarea']):
            categories['forms'].append(rule)
        elif 'modal' in selector.lower():
            categories['modals'].append(rule)
        else:
            categories['other'].append(rule)
    
    return categories

def migrate_css(css_content):
    """Migrate CSS to appropriate files"""
    print("Migrating CSS...")
    
    categories = categorize_css(css_content)
    
    # Write to respective files
    mappings = {
        'variables': CSS_DIR / 'base' / 'variables.css',
        'animations': CSS_DIR / 'base' / 'animations.css',
        'buttons': CSS_DIR / 'components' / 'buttons.css',
        'cards': CSS_DIR / 'components' / 'cards.css',
        'typography': CSS_DIR / 'base' / 'typography.css',
        'forms': CSS_DIR / 'components' / 'forms.css',
        'modals': CSS_DIR / 'components' / 'modals.css',
        'other': CSS_DIR / 'base' / 'global.css'
    }
    
    for category, path in mappings.items():
        if categories[category]:
            content = '\n\n'.join(categories[category])
            # Read existing content if file exists
            if path.exists():
                existing = read_file(path)
                content = existing + '\n\n/* Migrated from index.html */\n' + content
            write_file(path, content)
            print(f"  ✓ Written {len(categories[category])} rules to {path.name}")

def main():
    """Main migration function"""
    print("="* 60)
    print("Starting migration from index.html to modular structure...")
    print("="* 60)
    
    # Read index.html
    print("\n1. Reading index.html...")
    html_content = read_file(INDEX_HTML)
    print(f"   File size: {len(html_content)} characters")
    
    # Extract CSS
    print("\n2. Extracting and migrating CSS...")
    css_content = extract_styles(html_content)
    print(f"   Extracted {len(css_content)} characters of CSS")
    if css_content:
        migrate_css(css_content)
    
    # Extract HTML body
    print("\n3. Extracting HTML body content...")
    body_content = extract_body(html_content)
    print(f"   Extracted {len(body_content)} characters of HTML")
    
    # Save body for manual review
    body_file = BASE_DIR / 'extracted_body.html'
    write_file(body_file, body_content)
    print(f"   ✓ Saved to {body_file.name} for manual review")
    
    # Extract JavaScript
    print("\n4. Extracting JavaScript...")
    scripts = extract_scripts(html_content)
    print(f"   Extracted {len(scripts['modules'])} module scripts")
    print(f"   Extracted {len(scripts['scripts'])} regular scripts")
    
    # Save scripts for manual review
    if scripts['modules']:
        modules_file = BASE_DIR / 'extracted_modules.js'
        write_file(modules_file, '\n\n// ===== MODULE =====\n\n'.join(scripts['modules']))
        print(f"   ✓ Saved modules to {modules_file.name}")
    
    if scripts['scripts']:
        scripts_file = BASE_DIR / 'extracted_scripts.js'
        write_file(scripts_file, '\n\n// ===== SCRIPT =====\n\n'.join(scripts['scripts']))
        print(f"   ✓ Saved scripts to {scripts_file.name}")
    
    print("\n" + "="* 60)
    print("Migration phase 1 complete!")
    print("="* 60)
    print("\nNext steps:")
    print("1. Review extracted_body.html and integrate into views")
    print("2. Review extracted_*.js files and integrate into modules")
    print("3. Test the application with npm run dev")
    print("="* 60)

if __name__ == '__main__':
    main()
