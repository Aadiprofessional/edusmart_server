#!/usr/bin/env python3
"""
Fix empty image and logo URLs in the university JSON file
"""

import json
import random

def generate_logo_url(university_name):
    """Generate a logo URL using university initials"""
    words = university_name.split()
    initials = ''.join([word[0].upper() for word in words if word and word[0].isalpha()])[:3]
    colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE']
    color = random.choice(colors)
    return f"https://ui-avatars.com/api/?name={initials}&size=200&background={color}&color=fff&bold=true"

def generate_image_url():
    """Generate a random university campus image URL"""
    image_id = random.randint(1, 100)
    return f"https://picsum.photos/800/600?random={image_id}"

def main():
    print("Fixing image and logo URLs...")
    
    # Read the JSON file
    with open('universities_fixed.json', 'r', encoding='utf-8') as f:
        universities = json.load(f)
    
    fixed_count = 0
    
    for uni in universities:
        needs_fix = False
        
        # Fix empty image field
        if not uni.get('image') or uni['image'].strip() == '' or uni['image'] == '{}':
            uni['image'] = generate_image_url()
            needs_fix = True
        
        # Fix empty logo field
        if not uni.get('logo') or uni['logo'].strip() == '' or uni['logo'] == '{}':
            uni['logo'] = generate_logo_url(uni['name'])
            needs_fix = True
        
        # Fix gallery field if it contains empty objects
        if 'gallery' in uni:
            if isinstance(uni['gallery'], list):
                # Fix any empty or invalid gallery items
                fixed_gallery = []
                for item in uni['gallery']:
                    if item and item.strip() != '' and item != '{}':
                        fixed_gallery.append(item)
                    else:
                        fixed_gallery.append(generate_image_url())
                        needs_fix = True
                uni['gallery'] = fixed_gallery
            else:
                # If gallery is not a list, create a new one
                uni['gallery'] = [generate_image_url(), generate_image_url(), generate_image_url()]
                needs_fix = True
        
        if needs_fix:
            fixed_count += 1
    
    # Save the fixed JSON
    with open('universities_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(universities, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Fixed {fixed_count} universities")
    print(f"Total universities: {len(universities)}")
    
    # Show sample of fixed data
    sample = universities[0]
    print(f"\nSample fixed data for '{sample['name']}':")
    print(f"  Image: {sample['image']}")
    print(f"  Logo: {sample['logo']}")
    print(f"  Gallery: {sample['gallery']}")

if __name__ == "__main__":
    main() 