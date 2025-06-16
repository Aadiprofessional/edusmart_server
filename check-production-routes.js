import fetch from 'node-fetch';

const BASE_URL = 'https://edusmart-server.pages.dev';

async function checkRoute(path) {
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    const text = await response.text();
    console.log(`${path}: ${response.status} - ${text.substring(0, 100)}...`);
  } catch (error) {
    console.log(`${path}: ERROR - ${error.message}`);
  }
}

async function checkRoutes() {
  console.log('🔍 Checking production routes...\n');
  
  const routes = [
    '/',
    '/api/courses',
    '/api/courses/6f1bf982-c34b-4b38-ae04-2419b84318b9/enroll',
    '/api/courses/6f1bf982-c34b-4b38-ae04-2419b84318b9/sections',
    '/api/courses/categories',
    '/api/courses/levels'
  ];
  
  for (const route of routes) {
    await checkRoute(route);
  }
}

checkRoutes(); 