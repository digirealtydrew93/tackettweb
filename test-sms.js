#!/usr/bin/env node

/**
 * SMS Test Utility
 * Tests SMS delivery through the API router
 */

const testData = {
  name: "Test User",
  phone: "614-555-0123",
  email: "test@example.com",
  serviceType: "pallets",
  palletSize: "48x40",
  location: "123 Test Street, Columbus, OH",
  details: "Testing SMS delivery system"
};

console.log('📱 Testing SMS Delivery via /api/router\n');
console.log('Test Data:');
console.log(JSON.stringify(testData, null, 2));
console.log('\nEndpoint: /api/router');
console.log(`Active Index: ${process.env.ACTIVE_API_INDEX || '0'}\n`);

// Show deployment info
const deployments = [
  'Primary (Vercel)',
  'Secondary (Vercel)',
  'Tertiary (Vercel)',
  'Netlify #1',
  'Netlify #2',
  'GitHub Pages'
];

console.log('To test on live site:');
console.log('1. Visit: https://www.tackettbroshauling.pro/pickup.html');
console.log('2. Fill out the form');
console.log('3. Check for SMS to: +12202240393\n');

console.log('SMS Status Commands:');
console.log('  npm run sms:status     - View SMS counts');
console.log('  npm run sms:log <idx>  - Log test SMS\n');

console.log('Router Configuration:');
console.log(`  Active Deployment: [${process.env.ACTIVE_API_INDEX || '0'}] ${deployments[parseInt(process.env.ACTIVE_API_INDEX || '0')]}`);
console.log(`  All Deployments: ${deployments.length} total\n`);

console.log('To manually test SMS:');
console.log('  node sms-tracker.js log 0  # Simulates SMS sent to Primary');
console.log('\nWhen limit (50) is reached, automatically switches to next deployment.');
