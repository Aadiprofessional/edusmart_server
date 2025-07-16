#!/usr/bin/env python3
"""
Simple University Uploader
Uploads already converted university JSON data to EduSmart API
"""

import json
import requests
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def upload_university(api_base_url, university_data):
    """Upload a single university to the API"""
    try:
        url = f"{api_base_url}/api/universities"
        
        logger.info(f"Uploading: {university_data['name']}")
        
        response = requests.post(url, json=university_data, headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
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

def main():
    """Main function to upload universities"""
    
    # Configuration
    JSON_FILE = "universities_fixed.json"
    API_BASE_URL = "http://localhost:8000"
    DELAY_BETWEEN_UPLOADS = 0.5  # seconds
    
    logger.info("Starting University Upload...")
    
    # Load universities from JSON
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            universities = json.load(f)
        logger.info(f"Loaded {len(universities)} universities from {JSON_FILE}")
    except FileNotFoundError:
        logger.error(f"File {JSON_FILE} not found! Please run the converter first.")
        return
    except Exception as e:
        logger.error(f"Error reading {JSON_FILE}: {e}")
        return
    
    # Test API connection
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
    results = {
        'successful': 0,
        'failed': 0,
        'errors': []
    }
    
    logger.info(f"Starting upload of {len(universities)} universities...")
    
    for i, university in enumerate(universities, 1):
        logger.info(f"Processing {i}/{len(universities)}: {university['name']}")
        
        success = upload_university(API_BASE_URL, university)
        
        if success:
            results['successful'] += 1
        else:
            results['failed'] += 1
            results['errors'].append(university['name'])
        
        # Rate limiting - wait between requests
        if DELAY_BETWEEN_UPLOADS > 0 and i < len(universities):
            time.sleep(DELAY_BETWEEN_UPLOADS)
    
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
    
    logger.info("Upload completed!")

if __name__ == "__main__":
    main() 