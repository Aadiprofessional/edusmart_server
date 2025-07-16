const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/document-summarizer';
const TEST_UID = 'b846c59e-7422-4be3-a4f6-dd20145e8400';

// Test data
const testTextSummary = {
  uid: TEST_UID,
  title: 'Test Text Summary',
  summary: '# Test Summary\n\nThis is a test summary generated from text input. It contains:\n\n## Key Points\n- Important information\n- Key insights\n- Main concepts\n\n## Conclusion\nThis summary demonstrates the text processing capability.',
  sourceType: 'text',
  textInput: 'This is a sample text that was used to generate the summary. It contains important information about various topics.',
  mindmapData: {
    name: 'Test Summary',
    children: [
      {
        name: 'Key Points',
        children: [
          { name: 'Important information' },
          { name: 'Key insights' },
          { name: 'Main concepts' }
        ]
      },
      {
        name: 'Conclusion',
        children: [
          { name: 'Text processing capability' }
        ]
      }
    ]
  },
  metadata: {
    processingTime: 1500,
    aiModel: 'test-model',
    wordCount: 25
  }
};

const testFileSummary = {
  uid: TEST_UID,
  title: 'Test File Summary - Sample PDF',
  summary: '# Document Analysis\n\n## Executive Summary\nThis document contains important information across multiple pages.\n\n## Key Findings\n- Document has 3 pages\n- Contains structured data\n- Includes important conclusions\n\n## Page Analysis\n### Page 1\n- Introduction and overview\n- Main objectives\n\n### Page 2\n- Detailed methodology\n- Key data points\n\n### Page 3\n- Results and conclusions\n- Future recommendations',
  sourceType: 'file',
  fileName: 'sample_document.pdf',
  fileType: 'application/pdf',
  fileSize: 1024000,
  pageSummaries: [
    {
      pageNumber: 1,
      summary: '# Page 1 Summary\n\nIntroduction and overview of the document. Contains main objectives and purpose.',
      isLoading: false,
      isComplete: true
    },
    {
      pageNumber: 2,
      summary: '# Page 2 Summary\n\nDetailed methodology section with key data points and analysis procedures.',
      isLoading: false,
      isComplete: true
    },
    {
      pageNumber: 3,
      summary: '# Page 3 Summary\n\nResults, conclusions, and future recommendations based on the analysis.',
      isLoading: false,
      isComplete: true
    }
  ],
  mindmapData: {
    name: 'Document Analysis',
    children: [
      {
        name: 'Executive Summary',
        children: [
          { name: 'Important information' },
          { name: 'Multiple pages' }
        ]
      },
      {
        name: 'Key Findings',
        children: [
          { name: '3 pages' },
          { name: 'Structured data' },
          { name: 'Important conclusions' }
        ]
      },
      {
        name: 'Page Analysis',
        children: [
          { name: 'Page 1: Introduction' },
          { name: 'Page 2: Methodology' },
          { name: 'Page 3: Results' }
        ]
      }
    ]
  },
  metadata: {
    processingTime: 3500,
    aiModel: 'test-model',
    pageCount: 3,
    fileProcessed: true
  }
};

// Helper function to make requests with error handling
async function makeRequest(method, url, data = null) {
  try {
    console.log(`\n🔄 ${method.toUpperCase()} ${url}`);
    if (data) {
      console.log('📤 Request data:', JSON.stringify(data, null, 2));
    }
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ Status: ${response.status}`);
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`❌ Error: ${error.response?.status || 'Network Error'}`);
    console.error('📥 Error response:', error.response?.data || error.message);
    return null;
  }
}

// Test functions
async function testSaveTextSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 1: Save Text Summary');
  console.log('='.repeat(60));
  
  const result = await makeRequest('POST', `${BASE_URL}/save`, testTextSummary);
  if (result && result.success) {
    return result.documentSummary.id;
  }
  return null;
}

async function testSaveFileSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 2: Save File Summary');
  console.log('='.repeat(60));
  
  const result = await makeRequest('POST', `${BASE_URL}/save`, testFileSummary);
  if (result && result.success) {
    return result.documentSummary.id;
  }
  return null;
}

async function testGetHistory() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 3: Get Document Summary History');
  console.log('='.repeat(60));
  
  const result = await makeRequest('GET', `${BASE_URL}/history/${TEST_UID}?page=1&limit=10`);
  return result;
}

async function testGetHistoryWithFilter() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 4: Get History with Source Type Filter');
  console.log('='.repeat(60));
  
  console.log('\n📋 Testing filter: sourceType=text');
  await makeRequest('GET', `${BASE_URL}/history/${TEST_UID}?sourceType=text`);
  
  console.log('\n📋 Testing filter: sourceType=file');
  await makeRequest('GET', `${BASE_URL}/history/${TEST_UID}?sourceType=file`);
}

async function testGetSpecificDocument(documentId) {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 5: Get Specific Document');
  console.log('='.repeat(60));
  
  if (!documentId) {
    console.log('⚠️ No document ID available for testing');
    return;
  }
  
  const result = await makeRequest('GET', `${BASE_URL}/${documentId}?uid=${TEST_UID}`);
  return result;
}

async function testUpdateDocument(documentId) {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 6: Update Document Summary');
  console.log('='.repeat(60));
  
  if (!documentId) {
    console.log('⚠️ No document ID available for testing');
    return;
  }
  
  const updateData = {
    uid: TEST_UID,
    title: 'Updated Test Summary Title',
    summary: '# Updated Summary\n\nThis summary has been updated with new information.\n\n## New Section\n- Updated content\n- Additional insights',
    mindmapData: {
      name: 'Updated Summary',
      children: [
        {
          name: 'New Section',
          children: [
            { name: 'Updated content' },
            { name: 'Additional insights' }
          ]
        }
      ]
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      updateReason: 'API testing'
    }
  };
  
  const result = await makeRequest('PUT', `${BASE_URL}/${documentId}`, updateData);
  return result;
}

async function testGetStatistics() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 7: Get Document Summary Statistics');
  console.log('='.repeat(60));
  
  const result = await makeRequest('GET', `${BASE_URL}/stats/${TEST_UID}`);
  return result;
}

async function testDeleteDocument(documentId) {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 8: Delete Document Summary');
  console.log('='.repeat(60));
  
  if (!documentId) {
    console.log('⚠️ No document ID available for testing');
    return;
  }
  
  const result = await makeRequest('DELETE', `${BASE_URL}/${documentId}?uid=${TEST_UID}`);
  return result;
}

async function testErrorCases() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 9: Error Cases');
  console.log('='.repeat(60));
  
  console.log('\n📋 Testing missing required fields');
  await makeRequest('POST', `${BASE_URL}/save`, {
    uid: TEST_UID,
    title: 'Test'
    // Missing summary and sourceType
  });
  
  console.log('\n📋 Testing invalid source type');
  await makeRequest('POST', `${BASE_URL}/save`, {
    uid: TEST_UID,
    title: 'Test',
    summary: 'Test summary',
    sourceType: 'invalid'
  });
  
  console.log('\n📋 Testing non-existent document');
  await makeRequest('GET', `${BASE_URL}/non-existent-id?uid=${TEST_UID}`);
  
  console.log('\n📋 Testing missing UID in query');
  await makeRequest('GET', `${BASE_URL}/some-id`);
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Document Summarizer API Tests');
  console.log('=' + '='.repeat(60));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Test UID: ${TEST_UID}`);
  console.log('=' + '='.repeat(60));
  
  let textDocumentId = null;
  let fileDocumentId = null;
  
  try {
    // Test saving documents
    textDocumentId = await testSaveTextSummary();
    fileDocumentId = await testSaveFileSummary();
    
    // Test retrieval operations
    await testGetHistory();
    await testGetHistoryWithFilter();
    await testGetSpecificDocument(textDocumentId || fileDocumentId);
    
    // Test update operation
    await testUpdateDocument(textDocumentId);
    
    // Test statistics
    await testGetStatistics();
    
    // Test error cases
    await testErrorCases();
    
    // Test cleanup (delete one document)
    if (fileDocumentId) {
      await testDeleteDocument(fileDocumentId);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed!');
    console.log('='.repeat(60));
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Text document created: ${textDocumentId || 'Failed'}`);
    console.log(`✅ File document created: ${fileDocumentId || 'Failed'}`);
    console.log('✅ History retrieval tested');
    console.log('✅ Document update tested');
    console.log('✅ Statistics tested');
    console.log('✅ Error cases tested');
    console.log('✅ Document deletion tested');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testSaveTextSummary,
  testSaveFileSummary,
  testGetHistory,
  testGetSpecificDocument,
  testUpdateDocument,
  testDeleteDocument,
  testGetStatistics
}; 