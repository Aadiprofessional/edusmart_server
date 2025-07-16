#!/usr/bin/env python3
"""
University Data Uploader - Fixed Version
Converts Excel file to JSON and uploads university data to EduSmart API
Properly handles transposed Excel structure where universities are columns
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

class UniversityUploaderFixed:
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
    
    def safe_convert_to_int(self, value, default=0):
        """Safely convert value to integer"""
        try:
            if pd.isna(value) or value is None or str(value).strip() == "":
                return default
            # Handle string values that might be "N/A" or similar
            if str(value).lower() in ['n/a', 'na', 'not available', '-', '']:
                return default
            return int(float(str(value)))
        except (ValueError, TypeError):
            return default
    
    def safe_convert_to_float(self, value, default=0.0):
        """Safely convert value to float"""
        try:
            if pd.isna(value) or value is None or str(value).strip() == "":
                return default
            if str(value).lower() in ['n/a', 'na', 'not available', '-', '']:
                return default
            return float(str(value))
        except (ValueError, TypeError):
            return default
    
    def safe_convert_to_bool(self, value, default=True):
        """Safely convert value to boolean"""
        if pd.isna(value) or value is None:
            return default
        value_str = str(value).lower().strip()
        if value_str in ['true', 'yes', '1', 'available', 'required']:
            return True
        elif value_str in ['false', 'no', '0', 'not available', 'not required']:
            return False
        return default
    
    def generate_logo_url(self, university_name: str) -> str:
        """Generate a logo URL using university initials"""
        words = university_name.split()
        initials = ''.join([word[0].upper() for word in words if word and word[0].isalpha()])[:3]
        colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE']
        color = random.choice(colors)
        return f"https://ui-avatars.com/api/?name={initials}&size=200&background={color}&color=fff&bold=true"
    
    def generate_image_url(self) -> str:
        """Generate a random university campus image URL"""
        image_ids = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
        image_id = random.choice(image_ids)
        return f"https://picsum.photos/800/600?random={image_id}"
    
    def parse_list_field(self, value, default_list=None):
        """Parse a field that might contain a list or comma-separated values"""
        if default_list is None:
            default_list = []
        
        if pd.isna(value) or value is None:
            return default_list
        
        value_str = str(value).strip()
        if value_str.lower() in ['n/a', 'na', 'not available', '-', '']:
            return default_list
        
        # If it's already a list-like string, try to parse it
        if ',' in value_str:
            return [item.strip() for item in value_str.split(',') if item.strip()]
        else:
            return [value_str] if value_str else default_list
    
    def convert_excel_to_json(self, excel_file: str, output_file: str = 'universities_fixed.json') -> List[Dict]:
        """Convert Excel file to JSON format suitable for API upload"""
        logger.info(f"Reading Excel file: {excel_file}")
        
        # Read the Excel file
        df = pd.read_excel(excel_file)
        logger.info(f"Excel shape: {df.shape}")
        logger.info(f"Columns (first 5): {list(df.columns[:5])}")
        
        # The first column contains field names, subsequent columns are universities
        field_names = df.iloc[:, 0].tolist()
        logger.info(f"Found {len(field_names)} fields")
        logger.info(f"Fields: {field_names[:10]}...")  # Show first 10 fields
        
        universities = []
        
        # Skip the first column (Field names) and process each university column
        for col_idx in range(1, len(df.columns)):
            try:
                university_column = df.iloc[:, col_idx]
                
                # Create a mapping of field name to value
                university_data_raw = {}
                for row_idx, field_name in enumerate(field_names):
                    if row_idx < len(university_column):
                        university_data_raw[field_name] = university_column.iloc[row_idx]
                
                # Extract the university name (should be in the 'name' field)
                university_name = self.clean_text(university_data_raw.get('name', ''))
                if not university_name:
                    logger.warning(f"No name found for column {col_idx}, skipping")
                    continue
                
                logger.info(f"Processing university: {university_name}")
                
                # Build the standardized university record
                university_data = {
                    "uid": self.admin_uid,
                    "name": university_name,
                    "description": self.clean_text(university_data_raw.get('description', f"{university_name} is a prestigious institution of higher education.")),
                    "country": self.clean_text(university_data_raw.get('country', 'United States')),
                    "city": self.clean_text(university_data_raw.get('city', 'Main Campus')),
                    "state": self.clean_text(university_data_raw.get('state', '')),
                    "address": self.clean_text(university_data_raw.get('address', f"{university_name} Campus")),
                    "website": self.clean_text(university_data_raw.get('website', f"https://www.{university_name.lower().replace(' ', '').replace('university', 'uni')[:20]}.edu")),
                    "contact_email": self.clean_text(university_data_raw.get('contact_email', f"info@{university_name.lower().replace(' ', '')[:10]}.edu")),
                    "contact_phone": self.clean_text(university_data_raw.get('contact_phone', f"+1-{random.randint(100,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}")),
                    "established_year": self.safe_convert_to_int(university_data_raw.get('established_year'), random.randint(1850, 2000)),
                    "type": self.clean_text(university_data_raw.get('type', random.choice(["Public", "Private", "Public Research", "Private Research"]))),
                    "ranking": self.safe_convert_to_int(university_data_raw.get('ranking'), col_idx),
                    "tuition_fee": self.safe_convert_to_int(university_data_raw.get('tuition_fee'), random.randint(20000, 80000)),
                    "application_fee": self.safe_convert_to_int(university_data_raw.get('application_fee'), random.randint(50, 200)),
                    "acceptance_rate": self.safe_convert_to_float(university_data_raw.get('acceptance_rate'), round(random.uniform(10.0, 70.0), 1)),
                    "student_population": self.safe_convert_to_int(university_data_raw.get('student_population'), random.randint(5000, 50000)),
                    "faculty_count": self.safe_convert_to_int(university_data_raw.get('faculty_count'), random.randint(200, 2000)),
                    "programs_offered": self.parse_list_field(university_data_raw.get('programs_offered'), ["Computer Science", "Engineering", "Business", "Medicine", "Law"]),
                    "facilities": self.parse_list_field(university_data_raw.get('facilities'), ["Library", "Sports Complex", "Research Centers", "Student Housing"]),
                    "image": self.clean_text(university_data_raw.get('image', self.generate_image_url())),
                    "logo": self.clean_text(university_data_raw.get('logo', self.generate_logo_url(university_name))),
                    "gallery": self.parse_list_field(university_data_raw.get('gallery'), [self.generate_image_url(), self.generate_image_url(), self.generate_image_url()]),
                    "campus_size": self.clean_text(university_data_raw.get('campus_size', f"{random.randint(100, 1000)} acres")),
                    "campus_type": self.clean_text(university_data_raw.get('campus_type', random.choice(["Urban", "Suburban", "Rural"]))),
                    "accreditation": self.clean_text(university_data_raw.get('accreditation', 'Fully Accredited')),
                    "notable_alumni": self.parse_list_field(university_data_raw.get('notable_alumni'), []),
                    "keywords": self.parse_list_field(university_data_raw.get('keywords'), [university_name.lower(), "university", "education"]),
                    "region": self.clean_text(university_data_raw.get('region', 'Global')),
                    "ranking_type": self.clean_text(university_data_raw.get('ranking_type', 'QS World University Rankings')),
                    "ranking_year": self.safe_convert_to_int(university_data_raw.get('ranking_year'), 2026),
                    
                    # Admission requirements
                    "min_gpa_required": self.safe_convert_to_float(university_data_raw.get('min_gpa_required'), round(random.uniform(2.5, 4.0), 1)),
                    "sat_score_required": str(self.safe_convert_to_int(university_data_raw.get('sat_score_required'), random.randint(1200, 1600))),
                    "act_score_required": str(self.safe_convert_to_int(university_data_raw.get('act_score_required'), random.randint(25, 36))),
                    "ielts_score_required": str(self.safe_convert_to_float(university_data_raw.get('ielts_score_required'), round(random.uniform(6.0, 8.0), 1))),
                    "toefl_score_required": str(self.safe_convert_to_int(university_data_raw.get('toefl_score_required'), random.randint(80, 120))),
                    "gre_score_required": str(self.safe_convert_to_int(university_data_raw.get('gre_score_required'), random.randint(300, 340))),
                    "gmat_score_required": str(self.safe_convert_to_int(university_data_raw.get('gmat_score_required'), random.randint(500, 800))),
                    
                    # Application deadlines
                    "application_deadline_fall": self.clean_text(university_data_raw.get('application_deadline_fall', 'August 1st')),
                    "application_deadline_spring": self.clean_text(university_data_raw.get('application_deadline_spring', 'December 1st')),
                    "application_deadline_summer": self.clean_text(university_data_raw.get('application_deadline_summer', 'April 1st')),
                    
                    # Financial information
                    "tuition_fee_graduate": self.safe_convert_to_int(university_data_raw.get('tuition_fee_graduate'), random.randint(25000, 90000)),
                    "scholarship_available": self.safe_convert_to_bool(university_data_raw.get('scholarship_available'), True),
                    "financial_aid_available": self.safe_convert_to_bool(university_data_raw.get('financial_aid_available'), True),
                    
                    # Additional admission requirements
                    "application_requirements": self.parse_list_field(university_data_raw.get('application_requirements'), ["Transcripts", "Letters of Recommendation", "Personal Statement"]),
                    "admission_essay_required": self.safe_convert_to_bool(university_data_raw.get('admission_essay_required'), True),
                    "letters_of_recommendation_required": self.safe_convert_to_int(university_data_raw.get('letters_of_recommendation_required'), random.randint(2, 3)),
                    "interview_required": self.safe_convert_to_bool(university_data_raw.get('interview_required'), random.choice([True, False])),
                    "work_experience_required": self.safe_convert_to_bool(university_data_raw.get('work_experience_required'), False),
                    "portfolio_required": self.safe_convert_to_bool(university_data_raw.get('portfolio_required'), random.choice([True, False]))
                }
                
                universities.append(university_data)
                
            except Exception as e:
                logger.error(f"Error processing column {col_idx}: {e}")
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
    JSON_OUTPUT = "universities_fixed.json"
    API_BASE_URL = "http://localhost:8000"
    ADMIN_UID = "5f21c714-a255-4bab-864e-a36c63466a95"  # Updated with correct admin UID
    
    logger.info("Starting University Data Uploader (Fixed Version)...")
    
    # Initialize uploader
    uploader = UniversityUploaderFixed(api_base_url=API_BASE_URL, admin_uid=ADMIN_UID)
    
    try:
        # Step 1: Convert Excel to JSON
        logger.info("Step 1: Converting Excel to JSON...")
        universities = uploader.convert_excel_to_json(EXCEL_FILE, JSON_OUTPUT)
        
        if not universities:
            logger.error("No universities found in Excel file!")
            return
        
        logger.info(f"Successfully converted {len(universities)} universities")
        logger.info(f"First university: {universities[0]['name']}")
        logger.info(f"Last university: {universities[-1]['name']}")
        
        # Ask user if they want to upload
        upload_choice = input(f"\nFound {len(universities)} universities. Upload to API? (y/n): ").lower().strip()
        
        if upload_choice == 'y':
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
        else:
            logger.info("Upload skipped. JSON file created successfully.")
        
        logger.info("Process completed!")
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        raise

if __name__ == "__main__":
    main() 