import fs from 'fs';
import { transformData } from './add_universities.js';

// Test the transformation
async function testTransformation() {
  try {
    console.log('Reading QS university data...');
    const jsonData = JSON.parse(fs.readFileSync('qs.json', 'utf8'));
    
    console.log('Transforming data...');
    const universities = transformData(jsonData);
    
    console.log(`Transformed ${universities.length} universities`);
    
    // Show first 3 universities as examples
    console.log('\n=== Sample Universities ===');
    universities.slice(0, 3).forEach((uni, index) => {
      console.log(`\n${index + 1}. ${uni.name}`);
      console.log(`   Country: ${uni.country}`);
      console.log(`   City: ${uni.city}`);
      console.log(`   Ranking: ${uni.ranking}`);
      console.log(`   Description: ${uni.description.substring(0, 100)}...`);
      console.log(`   Website: ${uni.website}`);
      console.log(`   Image: ${uni.image}`);
      console.log(`   Programs: ${uni.programs_offered.join(', ')}`);
    });
    
    // Save sample data for inspection
    const sampleData = universities.slice(0, 10);
    fs.writeFileSync('sample_universities.json', JSON.stringify(sampleData, null, 2));
    console.log('\nSample data saved to sample_universities.json');
    
    // Statistics
    const countryStats = {};
    universities.forEach(uni => {
      countryStats[uni.country] = (countryStats[uni.country] || 0) + 1;
    });
    
    console.log('\n=== Country Distribution ===');
    Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([country, count]) => {
        console.log(`${country}: ${count} universities`);
      });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTransformation(); 