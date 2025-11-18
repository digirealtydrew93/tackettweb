#!/usr/bin/env node

/**
 * SMS Tracking & Deployment Manager
 * Tracks SMS sent per deployment and switches when limit reached
 * 
 * Usage:
 *   node sms-tracker.js status        - Show SMS counts and limits
 *   node sms-tracker.js log <index>   - Log an SMS for a deployment
 *   node sms-tracker.js reset         - Reset all counters
 *   node sms-tracker.js config        - Show configuration
 */

const fs = require('fs');
const path = require('path');

const SMS_LOG_FILE = path.join(__dirname, '.sms-log.json');
const SMS_LIMIT_PER_DEPLOYMENT = 50; // Default SMS limit per deployment per day

const DEFAULT_LOG = {
  deployments: [
    { index: 0, name: 'Primary (Vercel)', smsCount: 0, lastReset: null },
    { index: 1, name: 'Secondary (Vercel)', smsCount: 0, lastReset: null },
    { index: 2, name: 'Tertiary (Vercel)', smsCount: 0, lastReset: null },
    { index: 3, name: 'Netlify', smsCount: 0, lastReset: null },
    { index: 4, name: 'Netlify #2', smsCount: 0, lastReset: null },
    { index: 5, name: 'GitHub Pages', smsCount: 0, lastReset: null }
  ],
  activeIndex: 0,
  smsLimit: SMS_LIMIT_PER_DEPLOYMENT,
  totalSmsSent: 0,
  switches: [],
  lastUpdated: new Date().toISOString()
};

function loadLog() {
  if (fs.existsSync(SMS_LOG_FILE)) {
    return JSON.parse(fs.readFileSync(SMS_LOG_FILE, 'utf8'));
  }
  return DEFAULT_LOG;
}

function saveLog(log) {
  log.lastUpdated = new Date().toISOString();
  fs.writeFileSync(SMS_LOG_FILE, JSON.stringify(log, null, 2));
}

function logSMS(deploymentIndex) {
  const log = loadLog();
  
  if (deploymentIndex < 0 || deploymentIndex >= log.deployments.length) {
    console.error(`❌ Invalid deployment index: ${deploymentIndex}`);
    process.exit(1);
  }

  const deployment = log.deployments[deploymentIndex];
  deployment.smsCount++;
  log.totalSmsSent++;

  // Check if limit reached
  if (deployment.smsCount >= log.smsLimit) {
    console.log(`\n⚠️  SMS LIMIT REACHED on [${deploymentIndex}] ${deployment.name}`);
    console.log(`   Sent: ${deployment.smsCount}/${log.smsLimit} SMS`);
    
    // Find next deployment with lowest count
    const sorted = [...log.deployments].sort((a, b) => a.smsCount - b.smsCount);
    const nextDep = sorted[0];
    
    if (nextDep.index !== deploymentIndex) {
      console.log(`\n🔄 SWITCHING to [${nextDep.index}] ${nextDep.name}`);
      console.log(`   SMS count: ${nextDep.smsCount}/${log.smsLimit}`);
      
      const oldActive = log.activeIndex;
      log.activeIndex = nextDep.index;
      
      log.switches.push({
        timestamp: new Date().toISOString(),
        from: `[${oldActive}] ${log.deployments[oldActive].name}`,
        to: `[${nextDep.index}] ${nextDep.name}`,
        reason: `SMS limit reached (${deployment.smsCount}/${log.smsLimit})`,
        deploymentIndex: nextDep.index
      });
      
      // Update .env
      updateEnvFile(log);
    }
  }

  saveLog(log);
  
  console.log(`✅ SMS logged for [${deploymentIndex}] ${deployment.name}`);
  console.log(`   Count: ${deployment.smsCount}/${log.smsLimit}`);
  console.log(`   Active: [${log.activeIndex}] ${log.deployments[log.activeIndex].name}\n`);
}

function showStatus() {
  const log = loadLog();
  console.log('\n📊 SMS Tracking & Deployment Status\n');
  console.log(`SMS Limit per Deployment: ${log.smsLimit}`);
  console.log(`Total SMS Sent: ${log.totalSmsSent}`);
  console.log(`Currently Active: [${log.activeIndex}] ${log.deployments[log.activeIndex].name}\n`);

  console.log('Deployment SMS Counts:\n');
  const sorted = [...log.deployments].sort((a, b) => a.smsCount - b.smsCount);
  
  sorted.forEach(dep => {
    const status = dep.index === log.activeIndex ? '✅ ACTIVE' : '         ';
    const percentage = Math.round((dep.smsCount / log.smsLimit) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    console.log(`${status} [${dep.index}] ${dep.name.padEnd(20)} ${bar} ${dep.smsCount}/${log.smsLimit} (${percentage}%)`);
  });

  console.log('\nRecent Switches:\n');
  log.switches.slice(-5).forEach(s => {
    console.log(`  [${s.timestamp}] ${s.from} → ${s.to}`);
    console.log(`    Reason: ${s.reason}`);
  });
  console.log();
}

function showConfig() {
  const log = loadLog();
  console.log('\n⚙️  SMS Configuration\n');
  console.log(`SMS Limit Per Deployment: ${log.smsLimit}`);
  console.log(`Active Deployment: [${log.activeIndex}] ${log.deployments[log.activeIndex].name}`);
  console.log(`Total SMS Sent Today: ${log.totalSmsSent}`);
  console.log(`\nAll Deployments:\n`);
  
  log.deployments.forEach(dep => {
    console.log(`[${dep.index}] ${dep.name}`);
    console.log(`    SMS Sent: ${dep.smsCount}/${log.smsLimit}`);
    console.log(`    Status: ${dep.smsCount >= log.smsLimit ? '🔴 LIMIT REACHED' : '🟢 Available'}`);
  });
  console.log();
}

function resetLog() {
  const newLog = DEFAULT_LOG;
  newLog.deployments.forEach(dep => {
    dep.lastReset = new Date().toISOString();
  });
  saveLog(newLog);
  console.log('\n✅ SMS tracking reset\n');
}

function updateEnvFile(log) {
  let envContent = '';
  if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf8');
  }

  if (envContent.includes('ACTIVE_API_INDEX=')) {
    envContent = envContent.replace(/ACTIVE_API_INDEX=\d+/, `ACTIVE_API_INDEX=${log.activeIndex}`);
  } else {
    envContent += `\nACTIVE_API_INDEX=${log.activeIndex}`;
  }

  fs.writeFileSync('.env', envContent);
}

// Main command handler
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'log':
    logSMS(parseInt(arg));
    break;
  case 'status':
    showStatus();
    break;
  case 'config':
    showConfig();
    break;
  case 'reset':
    resetLog();
    break;
  default:
    console.log(`
📱 SMS Tracking & Deployment Manager

Tracks SMS sent per deployment and automatically switches when limits are reached.

Usage:
  node sms-tracker.js status        - Show SMS counts per deployment
  node sms-tracker.js log <index>   - Log an SMS for deployment [index]
  node sms-tracker.js config        - Show configuration
  node sms-tracker.js reset         - Reset all counters

Features:
  ✅ Tracks SMS per deployment
  ✅ Auto-switches when limit reached
  ✅ Updates .env automatically
  ✅ Shows deployment health
  ✅ Prevents SMS service overuse

Configuration:
  SMS_LIMIT_PER_DEPLOYMENT = ${SMS_LIMIT_PER_DEPLOYMENT}
  Deployments: 6 (3x Vercel, 2x Netlify, 1x GitHub Pages)

Example Workflow:
  npm run sms:log 0        # Log SMS to Primary
  npm run sms:status       # Check counts
  (When limit reached, auto-switches to next deployment)

Benefits:
  ✅ 50 SMS × 6 deployments = 300 SMS/day capacity
  ✅ Automatic failover based on SMS usage
  ✅ No manual intervention needed
  ✅ Tracks all SMS history
    `);
}
