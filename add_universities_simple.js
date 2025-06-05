const axios = require('axios');

const BASE_URL = 'https://edusmart-server.vercel.app';

// Additional universities with proper data structure based on existing API
const newUniversities = [
  {
    name: "Harvard University",
    description: "Harvard University is a private Ivy League research university in Cambridge, Massachusetts. Established in 1636, Harvard is the oldest institution of higher education in the United States.",
    country: "USA",
    city: "Cambridge",
    state: "Massachusetts",
    website: "https://www.harvard.edu",
    contact_email: "admissions@harvard.edu",
    contact_phone: "+1-617-495-1000",
    established_year: 1636,
    type: "Private",
    ranking: 1,
    tuition_fee: 54269,
    application_fee: 75,
    acceptance_rate: 3.4,
    student_population: 23000,
    faculty_count: 2400,
    programs_offered: ["Medicine", "Law", "Business", "Engineering", "Liberal Arts"],
    facilities: ["Library", "Research Labs", "Sports Complex", "Medical Center"],
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop",
    logo: "https://logos-world.net/wp-content/uploads/2021/09/Harvard-Logo.png",
    campus_size: "209 acres",
    campus_type: "Urban",
    accreditation: "NECHE",
    notable_alumni: ["Barack Obama", "Mark Zuckerberg", "Bill Gates"],
    region: "North America",
    ranking_type: "QS",
    ranking_year: 2024
  },
  {
    name: "Stanford University",
    description: "Stanford University is a private research university in Stanford, California. Known for its academic strength, wealth, and proximity to Silicon Valley.",
    country: "USA",
    city: "Stanford",
    state: "California",
    website: "https://www.stanford.edu",
    contact_email: "admission@stanford.edu",
    contact_phone: "+1-650-723-2300",
    established_year: 1885,
    type: "Private",
    ranking: 3,
    tuition_fee: 56169,
    application_fee: 90,
    acceptance_rate: 4.3,
    student_population: 17000,
    faculty_count: 2180,
    programs_offered: ["Computer Science", "Engineering", "Business", "Medicine", "AI"],
    facilities: ["Innovation Labs", "Library", "Sports Center", "Research Facilities"],
    image: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&h=600&fit=crop",
    logo: "https://identity.stanford.edu/wp-content/uploads/sites/3/2020/07/stanford-logo.png",
    campus_size: "8180 acres",
    campus_type: "Suburban",
    accreditation: "WASC",
    notable_alumni: ["Elon Musk", "Larry Page", "Sergey Brin"],
    region: "North America",
    ranking_type: "QS",
    ranking_year: 2024
  },
  {
    name: "Massachusetts Institute of Technology",
    description: "MIT is a private research university in Cambridge, Massachusetts. Known for its innovation in science, technology, and engineering.",
    country: "USA",
    city: "Cambridge",
    state: "Massachusetts",
    website: "https://www.mit.edu",
    contact_email: "admissions@mit.edu",
    contact_phone: "+1-617-253-1000",
    established_year: 1861,
    type: "Private",
    ranking: 2,
    tuition_fee: 53790,
    application_fee: 75,
    acceptance_rate: 6.7,
    student_population: 11520,
    faculty_count: 1000,
    programs_offered: ["Engineering", "Computer Science", "Physics", "Mathematics", "AI"],
    facilities: ["Research Labs", "Innovation Center", "Library", "Tech Facilities"],
    image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800&h=600&fit=crop",
    logo: "https://web.mit.edu/graphicidentity/logo/logofiles/mit-logo-red-gray-72x38.svg",
    campus_size: "168 acres",
    campus_type: "Urban",
    accreditation: "NECHE",
    notable_alumni: ["Tim Berners-Lee", "Buzz Aldrin", "Kofi Annan"],
    region: "North America",
    ranking_type: "QS",
    ranking_year: 2024
  },
  {
    name: "University of Oxford",
    description: "The University of Oxford is a collegiate research university in Oxford, England. It is the oldest university in the English-speaking world.",
    country: "United Kingdom",
    city: "Oxford",
    state: "England",
    website: "https://www.ox.ac.uk",
    contact_email: "admissions@ox.ac.uk",
    contact_phone: "+44-1865-270000",
    established_year: 1096,
    type: "Public",
    ranking: 4,
    tuition_fee: 35000,
    application_fee: 50,
    acceptance_rate: 17.5,
    student_population: 24000,
    faculty_count: 7000,
    programs_offered: ["Medicine", "Law", "Philosophy", "History", "Literature"],
    facilities: ["Bodleian Library", "Research Centers", "Museums", "Sports Facilities"],
    image: "https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=800&h=600&fit=crop",
    logo: "https://www.ox.ac.uk/sites/files/oxford/styles/ow_large_feature/public/field/field_image_main/Oxford_logo.jpg",
    campus_size: "Historic City Center",
    campus_type: "Urban",
    accreditation: "QAA",
    notable_alumni: ["Stephen Hawking", "Tony Blair", "Oscar Wilde"],
    region: "Europe",
    ranking_type: "QS",
    ranking_year: 2024
  },
  {
    name: "University of Cambridge",
    description: "The University of Cambridge is a collegiate research university in Cambridge, United Kingdom. Founded in 1209, it is the second-oldest university in the English-speaking world.",
    country: "United Kingdom",
    city: "Cambridge",
    state: "England",
    website: "https://www.cam.ac.uk",
    contact_email: "admissions@cam.ac.uk",
    contact_phone: "+44-1223-337733",
    established_year: 1209,
    type: "Public",
    ranking: 5,
    tuition_fee: 33000,
    application_fee: 50,
    acceptance_rate: 21.0,
    student_population: 23000,
    faculty_count: 6000,
    programs_offered: ["Mathematics", "Natural Sciences", "Engineering", "Medicine", "Computer Science"],
    facilities: ["University Library", "Research Labs", "Museums", "Sports Complex"],
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    logo: "https://www.cam.ac.uk/sites/www.cam.ac.uk/files/inner-images/logo.jpg",
    campus_size: "Historic Colleges",
    campus_type: "Urban",
    accreditation: "QAA",
    notable_alumni: ["Isaac Newton", "Charles Darwin", "Stephen Hawking"],
    region: "Europe",
    ranking_type: "QS",
    ranking_year: 2024
  }
];

// Function to test API connectivity
async function testAPI() {
  try {
    const response = await axios.get(`${BASE_URL}/api/universities?page=1&limit=1`);
    console.log('✅ API is accessible');
    console.log('Current universities count:', response.data.pagination?.totalItems || 0);
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

// Function to create a university (without auth for testing)
async function createUniversity(universityData) {
  try {
    // Try without authentication first
    const response = await axios.post(`${BASE_URL}/api/universities`, universityData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Created: ${universityData.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create ${universityData.name}:`, error.response?.data || error.message);
    return null;
  }
}

// Function to add universities
async function addUniversities() {
  console.log('🚀 Starting university addition process...\n');
  
  // Test API connectivity first
  const apiWorking = await testAPI();
  if (!apiWorking) {
    console.log('❌ Cannot proceed - API is not accessible');
    return;
  }
  
  console.log(`\n📚 Adding ${newUniversities.length} universities...\n`);
  
  for (let i = 0; i < newUniversities.length; i++) {
    const university = newUniversities[i];
    console.log(`Adding university ${i + 1}/${newUniversities.length}: ${university.name}`);
    
    await createUniversity(university);
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎉 Finished adding universities!');
  
  // Test final count
  await testAPI();
}

// Run the script
addUniversities().catch(console.error); 