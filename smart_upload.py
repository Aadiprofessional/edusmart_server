#!/usr/bin/env python3
"""
Smart University Uploader with Resume Capability
Handles interruptions and can resume from where it left off
"""

import json
import requests
import time
import logging
from typing import Dict, List, Set
import signal
import sys

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SmartUploader:
    def __init__(self, api_base_url: str = "http://localhost:8000"):
        self.api_base_url = api_base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.should_stop = False
        
        # Set up signal handler for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def signal_handler(self, signum, frame):
        """Handle interrupt signals gracefully"""
        logger.info(f"\n⚠️ Received signal {signum}. Stopping gracefully after current upload...")
        self.should_stop = True
    
    def get_existing_universities(self) -> Set[str]:
        """Get names of universities already in the database"""
        try:
            response = self.session.get(f"{self.api_base_url}/api/universities?limit=1000")
            if response.status_code == 200:
                data = response.json()
                if 'universities' in data:
                    existing_names = {uni['name'] for uni in data['universities']}
                    logger.info(f"Found {len(existing_names)} existing universities in database")
                    return existing_names
                else:
                    logger.warning("Unexpected API response format")
                    return set()
            else:
                logger.error(f"Failed to fetch existing universities: {response.status_code}")
                return set()
        except Exception as e:
            logger.error(f"Error fetching existing universities: {e}")
            return set()
    
    def upload_university(self, university_data: Dict) -> bool:
        """Upload a single university to the API"""
        try:
            url = f"{self.api_base_url}/api/universities"
            
            response = self.session.post(url, json=university_data, timeout=30)
            
            if response.status_code == 201:
                logger.info(f"✅ Successfully uploaded: {university_data['name']}")
                return True
            elif response.status_code == 400:
                error_msg = response.text
                logger.error(f"❌ Validation error for {university_data['name']}: {error_msg}")
                return False
            elif response.status_code == 409:
                logger.warning(f"⚠️ University already exists: {university_data['name']}")
                return True  # Consider as success since it exists
            else:
                logger.error(f"❌ Failed to upload {university_data['name']}: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            logger.error(f"❌ Timeout uploading {university_data['name']}")
            return False
        except requests.exceptions.ConnectionError:
            logger.error(f"❌ Connection error uploading {university_data['name']}")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error uploading {university_data['name']}: {e}")
            return False
    
    def smart_upload_all(self, universities: List[Dict], delay: float = 0.3) -> Dict:
        """Smart upload with resume capability"""
        logger.info(f"Starting smart upload of universities...")
        
        # Get existing universities to avoid duplicates
        existing_names = self.get_existing_universities()
        
        # Filter out already uploaded universities
        to_upload = []
        skipped = 0
        
        for uni in universities:
            if uni['name'] in existing_names:
                skipped += 1
            else:
                to_upload.append(uni)
        
        logger.info(f"Universities to upload: {len(to_upload)}")
        logger.info(f"Already exist (skipping): {skipped}")
        
        if not to_upload:
            logger.info("🎉 All universities are already uploaded!")
            return {'successful': skipped, 'failed': 0, 'skipped': skipped, 'errors': []}
        
        results = {
            'successful': skipped,  # Count existing ones as successful
            'failed': 0,
            'skipped': skipped,
            'errors': []
        }
        
        logger.info(f"Starting upload of {len(to_upload)} remaining universities...")
        
        for i, university in enumerate(to_upload, 1):
            if self.should_stop:
                logger.info("❌ Upload interrupted by user")
                break
            
            logger.info(f"Processing {i}/{len(to_upload)}: {university['name']}")
            
            # Retry mechanism
            max_retries = 3
            success = False
            
            for retry in range(max_retries):
                if self.should_stop:
                    break
                
                if retry > 0:
                    logger.info(f"  Retry {retry}/{max_retries - 1}")
                    time.sleep(1)  # Wait before retry
                
                success = self.upload_university(university)
                if success:
                    break
            
            if success:
                results['successful'] += 1
            else:
                results['failed'] += 1
                results['errors'].append(university['name'])
            
            # Rate limiting - wait between requests
            if delay > 0 and not self.should_stop and i < len(to_upload):
                time.sleep(delay)
        
        return results
    
    def test_api_connection(self) -> bool:
        """Test if the API is accessible"""
        try:
            response = self.session.get(f"{self.api_base_url}/", timeout=10)
            if response.status_code == 200:
                logger.info("✅ API connection successful")
                return True
            else:
                logger.warning(f"⚠️ API returned status {response.status_code}")
                return True  # Still might work for uploads
        except Exception as e:
            logger.error(f"❌ Cannot connect to API: {e}")
            logger.info("Please make sure the server is running on localhost:8000")
            return False

def main():
    """Main function"""
    JSON_FILE = "universities_fixed.json"
    API_BASE_URL = "http://localhost:8000"
    DELAY_BETWEEN_UPLOADS = 0.3  # seconds
    
    logger.info("🚀 Starting Smart University Uploader...")
    
    # Initialize uploader
    uploader = SmartUploader(api_base_url=API_BASE_URL)
    
    # Test API connection
    if not uploader.test_api_connection():
        return
    
    # Load universities from JSON
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            universities = json.load(f)
        logger.info(f"📚 Loaded {len(universities)} universities from {JSON_FILE}")
    except FileNotFoundError:
        logger.error(f"❌ File {JSON_FILE} not found! Please run the converter first.")
        return
    except Exception as e:
        logger.error(f"❌ Error reading {JSON_FILE}: {e}")
        return
    
    # Start smart upload
    try:
        results = uploader.smart_upload_all(universities, delay=DELAY_BETWEEN_UPLOADS)
        
        # Summary
        logger.info("="*60)
        logger.info("📊 UPLOAD SUMMARY")
        logger.info("="*60)
        logger.info(f"Total universities in file: {len(universities)}")
        logger.info(f"Successfully uploaded: {results['successful']}")
        logger.info(f"Failed uploads: {results['failed']}")
        logger.info(f"Skipped (already exist): {results['skipped']}")
        
        if results['successful'] > 0:
            success_rate = (results['successful']/len(universities)*100)
            logger.info(f"Success rate: {success_rate:.1f}%")
        
        if results['errors']:
            logger.info(f"❌ Failed universities ({len(results['errors'])}): {', '.join(results['errors'][:10])}")
            if len(results['errors']) > 10:
                logger.info(f"... and {len(results['errors'])-10} more")
            
            # Ask if user wants to retry failed uploads
            if not uploader.should_stop:
                retry_choice = input(f"\nRetry {len(results['errors'])} failed uploads? (y/n): ").lower().strip()
                if retry_choice == 'y':
                    logger.info("🔄 Retrying failed uploads...")
                    failed_universities = [uni for uni in universities if uni['name'] in results['errors']]
                    retry_results = uploader.smart_upload_all(failed_universities, delay=DELAY_BETWEEN_UPLOADS)
                    logger.info(f"Retry results: {retry_results['successful']} successful, {retry_results['failed']} failed")
        
        logger.info("🎉 Process completed!")
        
    except KeyboardInterrupt:
        logger.info("\n❌ Upload interrupted by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        raise

if __name__ == "__main__":
    main() 