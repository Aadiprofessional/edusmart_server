import fs from 'fs';
import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:8000/api'; // Change this to your API URL
const ADMIN_UID = '5f21c714-a255-4bab-864e-a36c63466a95'; // Replace with actual admin UID

// Function to generate realistic placeholder image URLs
function generatePlaceholderImage(universityName, type = 'campus') {
  const cleanName = universityName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const seed = cleanName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const imageServices = [
    `https://picsum.photos/seed/${cleanName}-${type}/800/600`, // Lorem Picsum with seed
    `https://source.unsplash.com/800x600/?university,campus,${type}`, // Unsplash
    `https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb`, // Default university image
  ];
  
  return imageServices[seed % imageServices.length];
}

// Function to generate logo placeholder
function generateLogoPlaceholder(universityName) {
  const cleanName = universityName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(universityName)}&size=200&background=random&color=fff&format=png`;
}

// Function to generate gallery placeholders
function generateGalleryPlaceholders(universityName) {
  const types = ['campus', 'library', 'students', 'building', 'graduation'];
  return types.map(type => generatePlaceholderImage(universityName, type));
}

// Function to clean data - only use defaults for truly empty values
function cleanData(value, defaultValue = null) {
  if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
    return defaultValue;
  }
  return value;
}

// Function to transform JSON data to university objects
function transformData(jsonData) {
  const universities = [];
  
  // First, get all university names from the first object (excluding 'Field')
  const firstObject = jsonData[0];
  const universityKeys = Object.keys(firstObject).filter(key => key !== 'Field');
  
  console.log(`Found ${universityKeys.length} universities to process`);
  
  // Create a map to organize data by university
  const universityDataMap = {};
  
  // Initialize each university
  universityKeys.forEach(key => {
    universityDataMap[key] = {};
  });
  
  // Process each field object
  jsonData.forEach(fieldObj => {
    const fieldName = fieldObj.Field;
    
    universityKeys.forEach(universityKey => {
      const value = fieldObj[universityKey];
      universityDataMap[universityKey][fieldName] = value;
    });
  });

  // Transform each university's data
  universityKeys.forEach(universityKey => {
    const data = universityDataMap[universityKey];

    const cleanValue = (value, defaultValue = null) => {
      if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
        return defaultValue;
      }
      return value;
    };

    const toNumber = (value) => {
      if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
        return null;
      }
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };

    const toBoolean = (value) => {
      if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
        return false;
      }
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
      }
      return Boolean(value);
    };

    const parseArray = (value) => {
      if (!value || value === 'null' || value === 'undefined') return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return value.split(',').map(item => item.trim()).filter(item => item);
        }
      }
      return [];
    };

    const toValidURL = (value) => {
      if (!value || value === 'null' || value === 'undefined') return null;
      if (typeof value === 'string' && value.startsWith('http')) return value;
      return null;
    };

    const toScoreString = (value) => {
      if (!value || value === 'null' || value === 'undefined') return null;
      return String(value);
    };

    const toValidGPA = (value) => {
      const num = toNumber(value);
      if (num === null) return null;
      // Ensure GPA is between 0 and 4.0
      if (num > 4.0) return 4.0;
      if (num < 0) return 0;
      return num;
    };

    const toDateString = (value) => {
      if (!value || value === 'null' || value === 'undefined') return null;
      
      // If it's a timestamp (number), convert to date string
      if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
        try {
          const timestamp = parseInt(value);
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
          }
        } catch (e) {
          // Fall through to string conversion
        }
      }
      
      return String(value);
    };

    // Extract ranking from university name if present
    let actualRanking = null;
    const rankingMatch = universityKey.match(/\(Rank (\d+)\)/);
    if (rankingMatch) {
      actualRanking = parseInt(rankingMatch[1]);
    }

    // Get the actual university name from the data
    const universityName = cleanValue(data.name) || universityKey.replace(/\s*\(Rank \d+\)/, '');

    const university = {
      uid: ADMIN_UID,
      // Use actual data from JSON
      name: universityName,
      description: cleanValue(data.description) || `${universityName} is a prestigious institution of higher education known for its academic excellence and research contributions.`,
      country: cleanValue(data.country) || 'Unknown',
      city: cleanValue(data.city) || 'Unknown',
      state: cleanValue(data.state),
      address: cleanValue(data.address),
      website: toValidURL(data.website),
      contact_email: cleanValue(data.contact_email) || 'info@university.edu',
      contact_phone: cleanValue(data.contact_phone) || '+1-000-000-0000',
      established_year: toNumber(data.established_year),
      type: cleanValue(data.type) || 'Public',
      tuition_fee: toNumber(data.tuition_fee) || 30000,
      application_fee: toNumber(data.application_fee) || 50,
      acceptance_rate: toNumber(data.acceptance_rate) || 15,
      student_population: toNumber(data.student_population) || 10000,
      faculty_count: toNumber(data.faculty_count) || 500,
      programs_offered: parseArray(data.programs_offered).length > 0 ? parseArray(data.programs_offered) : ['Engineering', 'Business', 'Arts', 'Sciences'],
      facilities: parseArray(data.facilities).length > 0 ? parseArray(data.facilities) : ['Library', 'Laboratory', 'Sports Complex', 'Dormitories'],
      accreditation: cleanValue(data.accreditation) || 'Regional Accreditation',
      notable_alumni: parseArray(data.notable_alumni).length > 0 ? parseArray(data.notable_alumni) : ['Notable Alumni 1', 'Notable Alumni 2'],
      keywords: parseArray(data.keywords).length > 0 ? parseArray(data.keywords) : ['research', 'education', 'university'],
      region: cleanValue(data.region) || 'Unknown',
      ranking_type: cleanValue(data.ranking_type) || 'QS World University Rankings',
      ranking_year: toNumber(data.ranking_year) || 2024,
      
      // Admission requirements - convert to strings as required by validation
      min_gpa_required: toValidGPA(data.min_gpa_required),
      sat_score_required: toScoreString(data.sat_score_required),
      act_score_required: toScoreString(data.act_score_required),
      ielts_score_required: toScoreString(data.ielts_score_required),
      toefl_score_required: toScoreString(data.toefl_score_required),
      gre_score_required: toScoreString(data.gre_score_required),
      gmat_score_required: toScoreString(data.gmat_score_required),
      
      // Application deadlines as strings
      application_deadline_fall: toDateString(data.application_deadline_fall),
      application_deadline_spring: toDateString(data.application_deadline_spring),
      application_deadline_summer: toDateString(data.application_deadline_summer),
      
      // Financial information
      tuition_fee_graduate: toNumber(data.tuition_fee_graduate),
      scholarship_available: toBoolean(data.scholarship_available),
      financial_aid_available: toBoolean(data.financial_aid_available),
      
      // Additional admission requirements
      application_requirements: parseArray(data.application_requirements).length > 0 ? parseArray(data.application_requirements) : ['Application Form', 'Transcripts', 'Personal Statement'],
      admission_essay_required: toBoolean(data.admission_essay_required),
      letters_of_recommendation_required: toNumber(data.letters_of_recommendation_required) || 2,
      interview_required: toBoolean(data.interview_required),
      work_experience_required: toBoolean(data.work_experience_required),
      portfolio_required: toBoolean(data.portfolio_required),
      
      campus_size: cleanValue(data.campus_size) || '500 acres',
      campus_type: cleanValue(data.campus_type) || 'Urban',
      
      // Use placeholders only for image fields that are null in the JSON
      image: toValidURL(data.image) || generatePlaceholderImage(universityName, 'campus'),
      logo: toValidURL(data.logo) || generateLogoPlaceholder(universityName),
      gallery: parseArray(data.gallery).length > 0 ? parseArray(data.gallery) : generateGalleryPlaceholders(universityName)
    };

    // Only include ranking if we have a valid number
    if (actualRanking !== null && !isNaN(actualRanking)) {
      university.ranking = actualRanking;
    } else if (toNumber(data.ranking)) {
      university.ranking = toNumber(data.ranking);
    }

    universities.push(university);
  });
  
  console.log(`Processed ${universities.length} universities`);
  return universities;
}

// Function to check if university exists
async function checkUniversityExists(name) {
  try {
    const response = await axios.get(`${API_BASE_URL}/universities/search`, {
      params: { q: name }
    });
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      // Check if any result is an exact match
      const exactMatch = response.data.find(uni => 
        uni.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      return exactMatch ? true : false;
    }
    return false;
  } catch (error) {
    // If search endpoint doesn't exist or returns 404, assume university doesn't exist
    if (error.response && (error.response.status === 404 || error.response.status === 500)) {
      return false;
    }
    console.error(`Error checking university "${name}":`, error.message);
    return false;
  }
}

// Function to add a single university
async function addUniversity(university) {
  try {
    // Ensure uid is included in the request body
    const universityData = {
      uid: ADMIN_UID,
      ...university
    };

    // Remove any undefined or null values that might cause validation issues
    Object.keys(universityData).forEach(key => {
      if (universityData[key] === undefined || universityData[key] === null) {
        delete universityData[key];
      }
    });

    console.log(`Creating university: ${universityData.name}`);
    
    const response = await axios.post(`${API_BASE_URL}/universities`, universityData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 second timeout
    });

    console.log(`✅ Successfully created: ${universityData.name}`);
    return {
      success: true,
      data: response.data,
      university: universityData.name
    };

  } catch (error) {
    let errorMessage = `Failed to create university: ${university.name}`;
    let errorDetails = {};

    if (error.response) {
      // Server responded with error status
      errorMessage += ` (Status: ${error.response.status})`;
      errorDetails = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      };
      
      // Log validation errors in detail
      if (error.response.status === 400 && error.response.data?.errors) {
        console.log(`❌ Validation errors for ${university.name}:`);
        error.response.data.errors.forEach(err => {
          console.log(`  - ${err.msg} (field: ${err.param}, value: ${err.value})`);
        });
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage += ' (No response from server)';
      errorDetails = { message: 'No response from server' };
    } else {
      // Something else happened
      errorMessage += ` (${error.message})`;
      errorDetails = { message: error.message };
    }

    console.error(`❌ ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
      details: errorDetails,
      university: university.name
    };
  }
}

// Main function
async function main() {
  try {
    // Read and parse JSON file
    console.log('Reading JSON file...');
    const jsonData = JSON.parse(fs.readFileSync('qs.json', 'utf8'));
    
    // Transform data
    console.log('Transforming data...');
    const universities = transformData(jsonData);
    
    console.log(`\nStarting to add ${universities.length} universities...`);
    
    let successCount = 0;
    let failureCount = 0;
    const failures = [];
    
    // Process universities in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < universities.length; i += batchSize) {
      const batch = universities.slice(i, i + batchSize);
      
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(universities.length/batchSize)} (universities ${i + 1}-${Math.min(i + batchSize, universities.length)})`);
      
      const batchPromises = batch.map(async (university) => {
        const result = await addUniversity(university);
        
        if (result.success) {
          console.log(`✓ Added: ${university.name}${university.ranking ? ` (Rank ${university.ranking})` : ''}`);
          successCount++;
        } else {
          console.log(`✗ Failed: ${university.name} - ${result.error}`);
          failureCount++;
          failures.push({ name: university.name, error: result.error });
        }
        
        return result;
      });
      
      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (i + batchSize < universities.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total universities processed: ${universities.length}`);
    console.log(`Successfully added: ${successCount}`);
    console.log(`Failed to add: ${failureCount}`);
    
    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach(failure => {
        console.log(`- ${failure.name}: ${failure.error}`);
      });
    }
    
    // Save results to file
    const results = {
      summary: {
        total: universities.length,
        successful: successCount,
        failed: failureCount,
        timestamp: new Date().toISOString()
      },
      failures: failures
    };
    
    fs.writeFileSync('university_import_results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to university_import_results.json');
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the script
main();

export { transformData, addUniversity };