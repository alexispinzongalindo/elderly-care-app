#!/usr/bin/env python3
"""
Minify JavaScript, CSS, and HTML files to reduce deployment size.
This script creates minified versions (.min.js, .min.css, .min.html)
"""

import re
import sys
import os
from pathlib import Path

def minify_js(content):
    """Minify JavaScript by removing comments and whitespace"""
    # Remove single-line comments (but not URLs with //)
    content = re.sub(r'(?<!:)//.*?(?=\n|$)', '', content)
    # Remove multi-line comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    # Remove extra whitespace
    content = re.sub(r'\s+', ' ', content)
    # Remove whitespace around operators and punctuation
    content = re.sub(r'\s*([{}();,\[\]=+\-*/%!&|<>?:])\s*', r'\1', content)
    # Remove whitespace after keywords
    content = re.sub(r'\b(if|else|for|while|function|var|let|const|return|async|await)\s+', r'\1 ', content)
    # Remove semicolons before closing braces
    content = re.sub(r'};\s*}', '}}', content)
    # Clean up multiple spaces
    content = re.sub(r' +', ' ', content)
    # Remove leading/trailing whitespace
    content = content.strip()
    return content

def minify_css(content):
    """Minify CSS by removing comments and whitespace"""
    # Remove comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    # Remove extra whitespace
    content = re.sub(r'\s+', ' ', content)
    # Remove whitespace around colons, semicolons, commas, braces
    content = re.sub(r'\s*([{}:;,])\s*', r'\1', content)
    # Remove whitespace before closing braces
    content = re.sub(r'\s*}', '}', content)
    # Remove whitespace after opening braces
    content = re.sub(r'{\s*', '{', content)
    # Remove leading/trailing whitespace
    content = content.strip()
    return content

def minify_html(content):
    """Minify HTML by removing comments and extra whitespace"""
    # Remove HTML comments (but preserve conditional comments)
    content = re.sub(r'<!--(?!\[if).*?-->', '', content, flags=re.DOTALL)
    # Remove extra whitespace between tags
    content = re.sub(r'>\s+<', '><', content)
    # Remove leading/trailing whitespace from lines
    content = '\n'.join(line.strip() for line in content.split('\n'))
    # Remove multiple newlines
    content = re.sub(r'\n{3,}', '\n\n', content)
    return content.strip()

def minify_file(input_path, output_path=None):
    """Minify a single file based on its extension"""
    input_path = Path(input_path)
    
    if not input_path.exists():
        print(f"❌ File not found: {input_path}")
        return False
    
    content = input_path.read_text(encoding='utf-8')
    original_size = len(content)
    
    if input_path.suffix == '.js':
        minified = minify_js(content)
        output_path = output_path or input_path.parent / f"{input_path.stem}.min.js"
    elif input_path.suffix == '.css':
        minified = minify_css(content)
        output_path = output_path or input_path.parent / f"{input_path.stem}.min.css"
    elif input_path.suffix == '.html':
        minified = minify_html(content)
        output_path = output_path or input_path.parent / f"{input_path.stem}.min.html"
    else:
        print(f"❌ Unsupported file type: {input_path.suffix}")
        return False
    
    output_path = Path(output_path)
    output_path.write_text(minified, encoding='utf-8')
    minified_size = len(minified)
    reduction = ((original_size - minified_size) / original_size) * 100
    
    print(f"✅ {input_path.name}")
    print(f"   Original: {original_size:,} bytes ({original_size/1024:.1f} KB)")
    print(f"   Minified: {minified_size:,} bytes ({minified_size/1024:.1f} KB)")
    print(f"   Reduction: {reduction:.1f}%")
    print(f"   Saved: {output_path.name}")
    
    return True

def main():
    """Minify all JS, CSS, and HTML files"""
    files_to_minify = [
        'script.js',
        'style.css',
        'index.html'
    ]
    
    print("🔨 Starting minification...\n")
    
    for file in files_to_minify:
        if Path(file).exists():
            minify_file(file)
            print()
        else:
            print(f"⚠️  Skipping {file} (not found)\n")
    
    print("✨ Minification complete!")
    print("\n📝 Note: To use minified files in production, update index.html")
    print("   to reference .min.js and .min.css files instead of originals.")

if __name__ == '__main__':
    main()

