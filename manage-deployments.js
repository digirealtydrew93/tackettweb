#!/usr/bin/env node

/**
 * Deployment Manager
 * Manage and switch between multiple API deployments
 * 
 * Usage:
 *   node manage-deployments.js list      - List all deployments
 *   node manage-deployments.js set 0     - Set primary deployment as active
 *   node manage-deployments.js status    - Show current active deployment
 */

const fs = require('fs');
const path = require('path');

const DEPLOYMENTS_FILE = path.join(__dirname, '.deployments.json');

// Default deployments config
const DEFAULT_CONFIG = {
  activeIndex: 0,
  deployments: [
    {
      name: 'Primary (Production)',
      url: 'https://tackettweb-9s7vanrs7-tackett-bros-projects.vercel.app',
      status: 'active'
    },
    {
      name: 'Secondary (Staging)',
      url: 'https://tackettweb-k1c9tgj94-tackett-bros-projects.vercel.app',
      status: 'standby'
    },
    {
      name: 'Tertiary (Development)',
      url: 'https://tackettweb-7s1rlz1mw-tackett-bros-projects.vercel.app',
      status: 'standby'
    }
  ]
};

function loadConfig() {
  if (fs.existsSync(DEPLOYMENTS_FILE)) {
    return JSON.parse(fs.readFileSync(DEPLOYMENTS_FILE, 'utf8'));
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config) {
  fs.writeFileSync(DEPLOYMENTS_FILE, JSON.stringify(config, null, 2));
}

function list() {
  const config = loadConfig();
  console.log('\n📦 Available Deployments:\n');
  config.deployments.forEach((dep, idx) => {
    const marker = idx === config.activeIndex ? '✅' : '  ';
    const status = idx === config.activeIndex ? 'ACTIVE' : 'STANDBY';
    console.log(`${marker} [${idx}] ${dep.name}`);
    console.log(`    URL: ${dep.url}`);
    console.log(`    Status: ${status}\n`);
  });
}

function setActive(index) {
  const config = loadConfig();
  if (index < 0 || index >= config.deployments.length) {
    console.error(`❌ Invalid deployment index: ${index}`);
    console.error(`   Available: 0-${config.deployments.length - 1}`);
    process.exit(1);
  }
  
  config.activeIndex = index;
  config.deployments.forEach((dep, idx) => {
    dep.status = idx === index ? 'active' : 'standby';
  });
  
  saveConfig(config);
  
  console.log(`\n✅ Switched to: ${config.deployments[index].name}`);
  console.log(`   URL: ${config.deployments[index].url}\n`);
  console.log('📝 Update .env variables:');
  console.log(`   PRIMARY_API_URL=${config.deployments[0].url}`);
  console.log(`   SECONDARY_API_URL=${config.deployments[1].url}`);
  console.log(`   TERTIARY_API_URL=${config.deployments[2].url}`);
  console.log(`   ACTIVE_API_INDEX=${index}\n`);
}

function status() {
  const config = loadConfig();
  const active = config.deployments[config.activeIndex];
  console.log(`\n🟢 Current Active Deployment: ${active.name}`);
  console.log(`   URL: ${active.url}\n`);
}

function addDeployment(name, url) {
  const config = loadConfig();
  config.deployments.push({
    name: name,
    url: url,
    status: 'standby'
  });
  saveConfig(config);
  console.log(`\n✅ Added: ${name}`);
  console.log(`   URL: ${url}\n`);
}

const command = process.argv[2];

switch (command) {
  case 'list':
    list();
    break;
  case 'set':
    setActive(parseInt(process.argv[3]));
    break;
  case 'status':
    status();
    break;
  case 'add':
    addDeployment(process.argv[3], process.argv[4]);
    break;
  default:
    console.log(`
🚀 Deployment Manager

Usage:
  node manage-deployments.js list              - List all deployments
  node manage-deployments.js set <index>       - Set deployment as active (0, 1, 2, etc.)
  node manage-deployments.js status            - Show current active deployment
  node manage-deployments.js add <name> <url>  - Add new deployment

Examples:
  node manage-deployments.js list
  node manage-deployments.js set 1
  node manage-deployments.js add "New Release" "https://..."
    `);
}
