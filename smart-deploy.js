#!/usr/bin/env node

/**
 * Smart Deployment Manager
 * Automatically routes future deployments to the least-recently-updated deployment
 * Maximizes usage of all 3 deployments to avoid hitting daily limits
 * 
 * Usage:
 *   node smart-deploy.js status         - Show deployment timestamps and status
 *   node smart-deploy.js next           - Show which deployment should get next update
 *   node smart-deploy.js update <index> - Mark deployment as just updated
 *   node smart-deploy.js reset          - Reset all timestamps
 */

const fs = require('fs');
const path = require('path');

const DEPLOY_LOG_FILE = path.join(__dirname, '.deploy-log.json');

const DEFAULT_LOG = {
  deployments: [
    {
      index: 0,
      name: 'Primary (Production)',
      url: 'https://tackettweb-9s7vanrs7-tackett-bros-projects.vercel.app',
      lastDeployed: null,
      deployCount: 0
    },
    {
      index: 1,
      name: 'Secondary (Staging)',
      url: 'https://tackettweb-k1c9tgj94-tackett-bros-projects.vercel.app',
      lastDeployed: null,
      deployCount: 0
    },
    {
      index: 2,
      name: 'Tertiary (Development)',
      url: 'https://tackettweb-7s1rlz1mw-tackett-bros-projects.vercel.app',
      lastDeployed: null,
      deployCount: 0
    }
  ],
  activeIndex: 0,
  totalDeployments: 0,
  lastUpdated: new Date().toISOString()
};

function loadLog() {
  if (fs.existsSync(DEPLOY_LOG_FILE)) {
    return JSON.parse(fs.readFileSync(DEPLOY_LOG_FILE, 'utf8'));
  }
  return DEFAULT_LOG;
}

function saveLog(log) {
  log.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DEPLOY_LOG_FILE, JSON.stringify(log, null, 2));
}

function getNextDeploymentIndex() {
  const log = loadLog();
  
  // Find deployment with oldest timestamp (least recently deployed)
  let oldest = log.deployments[0];
  for (const dep of log.deployments) {
    if (dep.lastDeployed === null) {
      // Never deployed, prioritize this
      return dep.index;
    }
    if (new Date(dep.lastDeployed) < new Date(oldest.lastDeployed)) {
      oldest = dep;
    }
  }
  
  return oldest.index;
}

function showStatus() {
  const log = loadLog();
  console.log('\n📊 Deployment Schedule Status\n');
  console.log(`Total Deployments Tracked: ${log.totalDeployments}`);
  console.log(`Currently Active: Index ${log.activeIndex}\n`);
  
  const sorted = [...log.deployments].sort((a, b) => {
    if (a.lastDeployed === null) return -1;
    if (b.lastDeployed === null) return 1;
    return new Date(b.lastDeployed) - new Date(a.lastDeployed);
  });

  console.log('Deployment History (Most Recent First):\n');
  sorted.forEach((dep, idx) => {
    const status = dep.index === log.activeIndex ? '✅ ACTIVE' : '   ';
    const lastDeploy = dep.lastDeployed 
      ? new Date(dep.lastDeployed).toLocaleString()
      : 'Never';
    console.log(`${status} [${dep.index}] ${dep.name}`);
    console.log(`    Last Deployed: ${lastDeploy}`);
    console.log(`    Total Deploys: ${dep.deployCount}`);
    console.log();
  });
}

function showNext() {
  const log = loadLog();
  const nextIndex = getNextDeploymentIndex();
  const nextDep = log.deployments[nextIndex];
  
  console.log('\n🎯 Next Deployment Target\n');
  console.log(`Deploy to: [${nextIndex}] ${nextDep.name}`);
  console.log(`URL: ${nextDep.url}`);
  
  if (nextDep.lastDeployed) {
    const lastTime = new Date(nextDep.lastDeployed);
    const now = new Date();
    const hoursSince = Math.round((now - lastTime) / (1000 * 60 * 60));
    console.log(`Last deployed: ${hoursSince} hours ago`);
  } else {
    console.log('Last deployed: Never');
  }
  
  console.log(`\nStrategy: Rotating through all 3 deployments`);
  console.log('Benefits: Distributes deployments evenly, avoids hitting daily limits\n');
}

function updateDeployment(index) {
  const log = loadLog();
  
  if (index < 0 || index > 2) {
    console.error(`❌ Invalid deployment index: ${index}`);
    process.exit(1);
  }
  
  const dep = log.deployments[index];
  dep.lastDeployed = new Date().toISOString();
  dep.deployCount++;
  log.activeIndex = index;
  log.totalDeployments++;
  
  saveLog(log);
  
  console.log(`\n✅ Deployment ${index} marked as updated`);
  console.log(`   ${dep.name}`);
  console.log(`   Time: ${new Date(dep.lastDeployed).toLocaleString()}`);
  console.log(`   Total: ${dep.deployCount} deployments\n`);
}

function resetLog() {
  const newLog = DEFAULT_LOG;
  saveLog(newLog);
  console.log('\n✅ Deployment log reset\n');
}

function generateRotationSchedule() {
  console.log('\n📅 Recommended Deployment Rotation\n');
  console.log('Deploy in this order to maximize all 3 deployments:\n');
  
  const schedule = [
    { num: 1, index: 0, name: 'Primary' },
    { num: 2, index: 1, name: 'Secondary' },
    { num: 3, index: 2, name: 'Tertiary' },
    { num: 4, index: 0, name: 'Primary' },
    { num: 5, index: 1, name: 'Secondary' },
    { num: 6, index: 2, name: 'Tertiary' },
  ];
  
  schedule.forEach(s => {
    console.log(`Deploy ${s.num}: → [${s.index}] ${s.name}`);
  });
  
  console.log(`\nWith this schedule:`);
  console.log(`✅ Each deployment gets 2 deploys per 6-deploy cycle`);
  console.log(`✅ Spreads deployments evenly across all 3`);
  console.log(`✅ Avoids hitting 100/day limits on single deployment`);
  console.log(`✅ Load balancer routes to healthiest deployment\n`);
}

function showSetNextScript() {
  const nextIndex = getNextDeploymentIndex();
  console.log('\n🤖 Auto-Set Next Deployment\n');
  console.log('Run this before each git push to auto-target the right deployment:\n');
  console.log(`Next target: [${nextIndex}] ${DEFAULT_LOG.deployments[nextIndex].name}\n`);
  console.log('Use this in your deployment workflow:');
  console.log(`npm run deploy:next        # Shows which to deploy to next`);
  console.log(`npm run deploy:mark ${nextIndex}   # Record the deployment\n`);
}

// Main command handler
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'status':
    showStatus();
    break;
  case 'next':
    showNext();
    break;
  case 'update':
  case 'mark':
    updateDeployment(parseInt(arg));
    break;
  case 'reset':
    resetLog();
    break;
  case 'schedule':
    generateRotationSchedule();
    break;
  case 'script':
    showSetNextScript();
    break;
  default:
    console.log(`
🚀 Smart Deployment Manager

Tracks deployments and recommends which API to deploy to next.
Helps you maximize all 3 deployments and avoid daily limits.

Usage:
  node smart-deploy.js status       - Show deployment history
  node smart-deploy.js next         - Show recommended next deployment
  node smart-deploy.js update <idx> - Mark deployment as just updated
  node smart-deploy.js schedule     - Show rotation schedule
  node smart-deploy.js reset        - Clear deployment history
  node smart-deploy.js script       - Show deployment workflow

Strategy:
  Rotate through all 3 deployments in order:
  Primary → Secondary → Tertiary → Primary → ...

Benefits:
  ✅ Spreads 3x deployments across all instances
  ✅ Avoids hitting 100/day limits faster
  ✅ Load balancer ensures site stays up
  ✅ Easy to track which was deployed when

Example Workflow:
  1. npm run deploy:next           # Check: Deploy to Primary
  2. git push origin main          # Triggers Vercel auto-deploy
  3. npm run deploy:mark 0         # Record: Marked Primary as updated
  4. npm run deploy:next           # Check: Next is Secondary
  5. npm run deploy:mark 1         # Record when Secondary is done
    `);
}
