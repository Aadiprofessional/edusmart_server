#!/usr/bin/env python3
"""
Simple Excel to JSON converter for university data
"""

import pandas as pd
import json
import random
import re

def clean_text(text):
    """Clean and normalize text data"""
    if pd.isna(text) or text is None:
        return ""
    text = str(text).strip()
    text = re.sub(r'\s+', ' ', text)
    return text

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

def extract_country_from_name(university_name):
    """Extract country from university name patterns"""
    country_patterns = {
        'MIT': 'United States',
        'Harvard': 'United States', 
        'Stanford': 'United States',
        'Oxford': 'United Kingdom',
        'Cambridge': 'United Kingdom',
        'Imperial College': 'United Kingdom',
        'ETH Zurich': 'Switzerland',
        'NTU': 'Singapore',
        'NUS': 'Singapore',
        'University of Tokyo': 'Japan',
        'Tsinghua': 'China',
        'Peking University': 'China',
        'University of Toronto': 'Canada',
        'McGill': 'Canada',
        'University of Melbourne': 'Australia',
        'University of Sydney': 'Australia',
    }
    
    for pattern, country in country_patterns.items():
        if pattern.lower() in university_name.lower():
            return country
    
    # Default fallback
    return 'United States'

def main():
    print("Converting Excel to JSON...")
    
    # Read Excel file
    df = pd.read_excel('2026 QS Ranking 1000.xlsx')
    print(f"Loaded {len(df)} universities")
    
    universities = []
    
    for index, row in df.iterrows():
        # Get university name from first column
        university_name = clean_text(row.iloc[0])
        if not university_name:
            continue
            
        # Get description from second column if available
        description = ""
        if len(row) > 1 and not pd.isna(row.iloc[1]):
            description = clean_text(row.iloc[1])
        
        # Create university data
        university_data = {
            "uid": "admin_uid_placeholder",  # Replace with actual admin UID
            "name": university_name,
            "description": description or f"{university_name} is a prestigious institution of higher education.",
            "country": extract_country_from_name(university_name),
            "city": "Main Campus",
            "state": "",
            "address": f"{university_name} Campus",
            "website": f"https://www.{university_name.lower().replace(' ', '').replace('university', 'uni')[:20]}.edu",
            "contact_email": f"info@{university_name.lower().replace(' ', '')[:10]}.edu",
            "contact_phone": f"+1-{random.randint(100,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}",
            "established_year": random.randint(1850, 2000),
            "type": random.choice(["Public", "Private", "Public Research", "Private Research"]),
            "ranking": index + 1,
            "tuition_fee": random.randint(20000, 80000),
            "application_fee": random.randint(50, 200),
            "acceptance_rate": round(random.uniform(10.0, 70.0), 1),
            "student_population": random.randint(5000, 50000),
            "faculty_count": random.randint(200, 2000),
            "programs_offered": ["Computer Science", "Engineering", "Business", "Medicine", "Law"],
            "facilities": ["Library", "Sports Complex", "Research Centers", "Student Housing"],
            "image": generate_image_url(),
            "logo": generate_logo_url(university_name),
            "gallery": [generate_image_url(), generate_image_url(), generate_image_url()],
            "campus_size": f"{random.randint(100, 1000)} acres",
            "campus_type": random.choice(["Urban", "Suburban", "Rural"]),
            "accreditation": "Fully Accredited",
            "notable_alumni": [],
            "keywords": [university_name.lower(), "university", "education"],
            "region": "Global",
            "ranking_type": "QS World University Rankings",
            "ranking_year": 2026,
            "min_gpa_required": round(random.uniform(2.5, 4.0), 1),
            "sat_score_required": str(random.randint(1200, 1600)),
            "act_score_required": str(random.randint(25, 36)),
            "ielts_score_required": f"{random.uniform(6.0, 8.0):.1f}",
            "toefl_score_required": str(random.randint(80, 120)),
            "gre_score_required": str(random.randint(300, 340)),
            "gmat_score_required": str(random.randint(500, 800)),
            "application_deadline_fall": "August 1st",
            "application_deadline_spring": "December 1st", 
            "application_deadline_summer": "April 1st",
            "tuition_fee_graduate": random.randint(25000, 90000),
            "scholarship_available": True,
            "financial_aid_available": True,
            "application_requirements": ["Transcripts", "Letters of Recommendation", "Personal Statement"],
            "admission_essay_required": True,
            "letters_of_recommendation_required": random.randint(2, 3),
            "interview_required": random.choice([True, False]),
            "work_experience_required": False,
            "portfolio_required": random.choice([True, False])
        }
        
        universities.append(university_data)
    
    # Save to JSON
    with open('universities_converted.json', 'w', encoding='utf-8') as f:
        json.dump(universities, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Converted {len(universities)} universities to universities_converted.json")
    print(f"First university: {universities[0]['name']}")
    print(f"Last university: {universities[-1]['name']}")

if __name__ == "__main__":
    main() 