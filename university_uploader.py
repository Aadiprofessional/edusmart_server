#!/usr/bin/env python3
"""
University Data Uploader
Converts Excel file to JSON and uploads university data to EduSmart API
"""

import pandas as pd
import requests
import json
import time
import random
import re
from typing import Dict, List, Optional
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class UniversityUploader:
    def __init__(self, api_base_url: str = "http://localhost:8000", admin_uid: str = "admin_uid_here"):
        self.api_base_url = api_base_url
        self.admin_uid = admin_uid
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def clean_text(self, text: str) -> str:
        """Clean and normalize text data"""
        if pd.isna(text) or text is None:
            return ""
        text = str(text).strip()
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def generate_logo_url(self, university_name: str) -> str:
        """Generate a logo URL using university initials"""
        # Extract initials from university name
        words = university_name.split()
        initials = ''.join([word[0].upper() for word in words if word and word[0].isalpha()])[:3]
        
        # Use a placeholder service for logo generation
        colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE']
        color = random.choice(colors)
        
        return f"https://ui-avatars.com/api/?name={initials}&size=200&background={color}&color=fff&bold=true"
    
    def generate_image_url(self) -> str:
        """Generate a random university campus image URL"""
        # Using Lorem Picsum for random university/campus images
        image_ids = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
        image_id = random.choice(image_ids)
        return f"https://picsum.photos/800/600?random={image_id}"
    
    def extract_country_from_name(self, university_name: str) -> str:
        """Extract country from university name patterns"""
        country_patterns = {
            'University of California': 'United States',
            'MIT': 'United States',
            'Harvard': 'United States',
            'Stanford': 'United States',
            'University of Oxford': 'United Kingdom',
            'University of Cambridge': 'United Kingdom',
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
        
        # Default countries based on common patterns
        if any(word in university_name.lower() for word in ['university of', 'college of']):
            return 'United States'
        elif 'université' in university_name.lower():
            return 'France'
        elif 'universität' in university_name.lower():
            return 'Germany'
        elif 'università' in university_name.lower():
            return 'Italy'
        
        return 'United States'  # Default
    
    def convert_excel_to_json(self, excel_file: str, output_file: str = 'universities.json') -> List[Dict]:
        """Convert Excel file to JSON format suitable for API upload"""
        logger.info(f"Reading Excel file: {excel_file}")
        
        # Read the Excel file
        df = pd.read_excel(excel_file)
        logger.info(f"Loaded {len(df)} universities from Excel")
        
        universities = []
        
        for index, row in df.iterrows():
            try:
                # The first column should be the university name
                university_name = self.clean_text(row.iloc[0])
                if not university_name:
                    continue
                
                # Extract description from second column if available
                description = ""
                if len(row) > 1 and not pd.isna(row.iloc[1]):
                    description = self.clean_text(row.iloc[1])
                
                # Generate a comprehensive university record
                university_data = {
                    "uid": self.admin_uid,
                    "name": university_name,
                    "description": description or f"{university_name} is a prestigious institution of higher education known for its academic excellence and research contributions.",
                    "country": self.extract_country_from_name(university_name),
                    "city": "Main Campus",  # Default city
                    "state": "",
                    "address": f"{university_name} Campus, Main Street",
                    "website": f"https://{university_name.lower().replace(' ', '').replace('university', 'uni').replace('college', 'col')}edu.edu",
                    "contact_email": f"admissions@{university_name.lower().replace(' ', '').replace('university', 'uni')}edu.edu",
                    "contact_phone": f"+1-{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                    "established_year": random.randint(1850, 2000),
                    "type": random.choice(["Public", "Private", "Public Research", "Private Research"]),
                    "ranking": index + 1,  # Use the row index as ranking
                    "tuition_fee": random.randint(20000, 80000),
                    "application_fee": random.randint(50, 200),
                    "acceptance_rate": round(random.uniform(10.0, 70.0), 1),
                    "student_population": random.randint(5000, 50000),
                    "faculty_count": random.randint(200, 2000),
                    "programs_offered": [
                        "Computer Science", "Engineering", "Business Administration", 
                        "Medicine", "Law", "Arts and Sciences", "Social Sciences"
                    ],
                    "facilities": [
                        "Library", "Sports Complex", "Research Centers", "Student Housing",
                        "Dining Halls", "Medical Center", "Career Services"
                    ],
                    "image": self.generate_image_url(),
                    "logo": self.generate_logo_url(university_name),
                    "gallery": [
                        self.generate_image_url(),
                        self.generate_image_url(),
                        self.generate_image_url()
                    ],
                    "campus_size": f"{random.randint(100, 1000)} acres",
                    "campus_type": random.choice(["Urban", "Suburban", "Rural"]),
                    "accreditation": "Fully Accredited",
                    "notable_alumni": [],
                    "keywords": [university_name.lower(), "university", "education", "research"],
                    "region": "North America",  # Default region
                    "ranking_type": "QS World University Rankings",
                    "ranking_year": 2026,
                    
                    # Admission requirements
                    "min_gpa_required": round(random.uniform(2.5, 4.0), 1),
                    "sat_score_required": f"{random.randint(1200, 1600)}",
                    "act_score_required": f"{random.randint(25, 36)}",
                    "ielts_score_required": f"{random.uniform(6.0, 8.0):.1f}",
                    "toefl_score_required": f"{random.randint(80, 120)}",
                    "gre_score_required": f"{random.randint(300, 340)}",
                    "gmat_score_required": f"{random.randint(500, 800)}",
                    
                    # Application deadlines
                    "application_deadline_fall": "August 1st",
                    "application_deadline_spring": "December 1st",
                    "application_deadline_summer": "April 1st",
                    
                    # Financial information
                    "tuition_fee_graduate": random.randint(25000, 90000),
                    "scholarship_available": True,
                    "financial_aid_available": True,
                    
                    # Additional admission requirements
                    "application_requirements": [
                        "Transcripts", "Letters of Recommendation", "Personal Statement",
                        "Application Form", "Application Fee"
                    ],
                    "admission_essay_required": True,
                    "letters_of_recommendation_required": random.randint(2, 3),
                    "interview_required": random.choice([True, False]),
                    "work_experience_required": False,
                    "portfolio_required": random.choice([True, False])
                }
                
                universities.append(university_data)
                
            except Exception as e:
                logger.error(f"Error processing row {index}: {e}")
                continue
        
        # Save to JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(universities, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Converted {len(universities)} universities to JSON format")
        logger.info(f"Saved to: {output_file}")
        
        return universities
    
    def upload_university(self, university_data: Dict) -> bool:
        """Upload a single university to the API"""
        try:
            url = f"{self.api_base_url}/api/universities"
            
            logger.info(f"Uploading: {university_data['name']}")
            
            response = self.session.post(url, json=university_data)
            
            if response.status_code == 201:
                logger.info(f"✅ Successfully uploaded: {university_data['name']}")
                return True
            else:
                logger.error(f"❌ Failed to upload {university_data['name']}: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error uploading {university_data['name']}: {e}")
            return False
    
    def upload_all_universities(self, universities: List[Dict], delay: float = 1.0) -> Dict:
        """Upload all universities with rate limiting"""
        logger.info(f"Starting upload of {len(universities)} universities...")
        
        results = {
            'successful': 0,
            'failed': 0,
            'errors': []
        }
        
        for i, university in enumerate(universities, 1):
            logger.info(f"Processing {i}/{len(universities)}: {university['name']}")
            
            success = self.upload_university(university)
            
            if success:
                results['successful'] += 1
            else:
                results['failed'] += 1
                results['errors'].append(university['name'])
            
            # Rate limiting - wait between requests
            if delay > 0:
                time.sleep(delay)
        
        logger.info(f"Upload complete! Successful: {results['successful']}, Failed: {results['failed']}")
        
        if results['errors']:
            logger.error(f"Failed uploads: {results['errors']}")
        
        return results

def main():
    """Main function to run the university uploader"""
    
    # Configuration
    EXCEL_FILE = "2026 QS Ranking 1000.xlsx"
    JSON_OUTPUT = "universities_converted.json"
    API_BASE_URL = "http://localhost:8000"
    ADMIN_UID = "admin_uid_placeholder"  # Replace with actual admin UID
    
    logger.info("Starting University Data Uploader...")
    
    # Initialize uploader
    uploader = UniversityUploader(api_base_url=API_BASE_URL, admin_uid=ADMIN_UID)
    
    try:
        # Step 1: Convert Excel to JSON
        logger.info("Step 1: Converting Excel to JSON...")
        universities = uploader.convert_excel_to_json(EXCEL_FILE, JSON_OUTPUT)
        
        if not universities:
            logger.error("No universities found in Excel file!")
            return
        
        # Step 2: Upload to API
        logger.info("Step 2: Uploading to API...")
        
        # Test API connection first
        try:
            response = requests.get(f"{API_BASE_URL}/")
            if response.status_code == 200:
                logger.info("✅ API connection successful")
            else:
                logger.warning(f"⚠️ API returned status {response.status_code}")
        except Exception as e:
            logger.error(f"❌ Cannot connect to API: {e}")
            logger.info("Please make sure the server is running on localhost:8000")
            return
        
        # Upload universities
        results = uploader.upload_all_universities(universities, delay=0.5)
        
        # Summary
        logger.info("="*50)
        logger.info("UPLOAD SUMMARY")
        logger.info("="*50)
        logger.info(f"Total universities: {len(universities)}")
        logger.info(f"Successfully uploaded: {results['successful']}")
        logger.info(f"Failed uploads: {results['failed']}")
        logger.info(f"Success rate: {(results['successful']/len(universities)*100):.1f}%")
        
        if results['errors']:
            logger.info(f"Failed universities: {', '.join(results['errors'][:10])}")
            if len(results['errors']) > 10:
                logger.info(f"... and {len(results['errors'])-10} more")
        
        logger.info("Process completed!")
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        raise

if __name__ == "__main__":
    main() 