#!/usr/bin/env node

/**
 * Automated Deployment Manager
 * Monitors and automatically switches deployments based on health checks
 * 
 * Usage:
 *   node auto-deploy.js start          - Start continuous monitoring
 *   node auto-deploy.js health         - Check health of all deployments
 *   node auto-deploy.js metrics        - Show deployment metrics
 *   node auto-deploy.js config         - Show current configuration
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const CONFIG_FILE = path.join(__dirname, '.deployments.json');
const METRICS_FILE = path.join(__dirname, '.deployment-metrics.json');

// Configuration
const DEFAULT_CONFIG = {
  activeIndex: 0,
  autoSwitchEnabled: true,
  healthCheckInterval: 30000, // 30 seconds
  failureThreshold: 3, // Failed checks before switching
  deployments: [
    {
      name: 'Primary (Production)',
      url: 'https://tackettweb-9s7vanrs7-tackett-bros-projects.vercel.app',
      status: 'active',
      failureCount: 0
    },
    {
      name: 'Secondary (Staging)',
      url: 'https://tackettweb-k1c9tgj94-tackett-bros-projects.vercel.app',
      status: 'standby',
      failureCount: 0
    },
    {
      name: 'Tertiary (Development)',
      url: 'https://tackettweb-7s1rlz1mw-tackett-bros-projects.vercel.app',
      status: 'standby',
      failureCount: 0
    }
  ]
};

const DEFAULT_METRICS = {
  startTime: new Date().toISOString(),
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  switches: [],
  uptime: 100,
  lastHealthCheck: null,
  deploymentStats: {}
};

// Load configuration
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadMetrics() {
  if (fs.existsSync(METRICS_FILE)) {
    return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
  }
  return DEFAULT_METRICS;
}

function saveMetrics(metrics) {
  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
}

// Health check for a deployment
async function healthCheck(deployment) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ healthy: false, responseTime: 5000 });
    }, 5000);

    const startTime = Date.now();
    const url = new URL(`${deployment.url}/functions/submit`);
    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(url, { method: 'HEAD' }, (res) => {
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      const healthy = res.statusCode === 200 || res.statusCode === 405; // 405 is OK for HEAD request
      resolve({ healthy, responseTime, statusCode: res.statusCode });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ healthy: false, responseTime: 5000, error: err.message });
    });

    req.end();
  });
}

// Check all deployments
async function checkAllDeployments() {
  const config = loadConfig();
  const results = [];

  for (const deployment of config.deployments) {
    const result = await healthCheck(deployment);
    results.push({
      name: deployment.name,
      url: deployment.url,
      ...result
    });
  }

  return results;
}

// Automatic switching logic
async function autoSwitch() {
  const config = loadConfig();
  const metrics = loadMetrics();

  const results = await checkAllDeployments();

  console.log(`\n[${new Date().toISOString()}] Health Check Results:\n`);

  results.forEach((result, idx) => {
    const status = result.healthy ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    if (result.statusCode) console.log(`   Status Code: ${result.statusCode}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    console.log();
  });

  // Update failure counts
  for (let i = 0; i < config.deployments.length; i++) {
    if (!results[i].healthy) {
      config.deployments[i].failureCount++;
    } else {
      config.deployments[i].failureCount = 0;
    }
  }

  // Check if active deployment has exceeded failure threshold
  const active = config.deployments[config.activeIndex];
  if (active.failureCount >= config.failureThreshold) {
    console.log(`⚠️  Active deployment (${active.name}) failed ${active.failureCount} checks!`);

    // Find next healthy deployment
    const nextHealthy = config.deployments.findIndex(
      (dep, idx) => idx !== config.activeIndex && dep.failureCount < config.failureThreshold
    );

    if (nextHealthy !== -1) {
      console.log(`🔄 Switching to: ${config.deployments[nextHealthy].name}\n`);

      // Perform switch
      const oldActive = config.activeIndex;
      config.activeIndex = nextHealthy;
      config.deployments[oldActive].status = 'standby';
      config.deployments[nextHealthy].status = 'active';
      config.deployments[oldActive].failureCount = 0; // Reset failures

      // Update environment
      updateEnvFile(config);

      // Log the switch
      metrics.switches.push({
        timestamp: new Date().toISOString(),
        from: config.deployments[oldActive].name,
        to: config.deployments[nextHealthy].name,
        reason: `Failed ${config.deployments[oldActive].failureCount} health checks`,
        deploymentIndex: nextHealthy
      });

      console.log(`✅ Switched! New active deployment: ${config.deployments[nextHealthy].name}`);
    } else {
      console.log('⚠️  No healthy deployments available for switching!');
    }
  }

  // Update metrics
  metrics.lastHealthCheck = new Date().toISOString();
  metrics.totalRequests++;
  const successCount = results.filter(r => r.healthy).length;
  metrics.successfulRequests += successCount;
  metrics.failedRequests += results.length - successCount;

  // Calculate uptime
  if (metrics.totalRequests > 0) {
    metrics.uptime = Math.round((metrics.successfulRequests / (metrics.totalRequests * 3)) * 100);
  }

  // Update deployment stats
  results.forEach((result, idx) => {
    const depName = config.deployments[idx].name;
    if (!metrics.deploymentStats[depName]) {
      metrics.deploymentStats[depName] = { checks: 0, successes: 0, avgResponseTime: 0 };
    }
    metrics.deploymentStats[depName].checks++;
    if (result.healthy) metrics.deploymentStats[depName].successes++;
    metrics.deploymentStats[depName].avgResponseTime = result.responseTime;
  });

  saveConfig(config);
  saveMetrics(metrics);
}

// Update .env file with new active index
function updateEnvFile(config) {
  let envContent = '';
  if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf8');
  }

  // Update or add ACTIVE_API_INDEX
  if (envContent.includes('ACTIVE_API_INDEX=')) {
    envContent = envContent.replace(/ACTIVE_API_INDEX=\d+/, `ACTIVE_API_INDEX=${config.activeIndex}`);
  } else {
    envContent += `\nACTIVE_API_INDEX=${config.activeIndex}`;
  }

  fs.writeFileSync('.env', envContent);
}

// Show health status
async function showHealth() {
  console.log('\n🏥 Deployment Health Status\n');
  const results = await checkAllDeployments();
  const config = loadConfig();

  results.forEach((result, idx) => {
    const isActive = idx === config.activeIndex ? '✅ ACTIVE' : '   standby';
    const status = result.healthy ? '🟢' : '🔴';
    console.log(`${status} ${result.name} ${isActive}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    console.log();
  });
}

// Show metrics
function showMetrics() {
  const metrics = loadMetrics();
  console.log('\n📊 Deployment Metrics\n');
  console.log(`Uptime: ${metrics.uptime}%`);
  console.log(`Total Requests Processed: ${metrics.totalRequests * 3}`);
  console.log(`Successful: ${metrics.successfulRequests * 3}`);
  console.log(`Failed: ${metrics.failedRequests * 3}`);
  console.log(`Last Health Check: ${metrics.lastHealthCheck}`);
  console.log(`\nDeployment Stats:`);
  Object.entries(metrics.deploymentStats).forEach(([name, stats]) => {
    const percentage = stats.checks > 0 ? Math.round((stats.successes / stats.checks) * 100) : 0;
    console.log(`  ${name}: ${percentage}% (${stats.successes}/${stats.checks} checks)`);
  });
  console.log(`\nRecent Switches:`);
  metrics.switches.slice(-5).forEach(s => {
    console.log(`  [${s.timestamp}] ${s.from} → ${s.to}`);
  });
  console.log();
}

// Show configuration
function showConfig() {
  const config = loadConfig();
  console.log('\n⚙️  Auto-Deployment Configuration\n');
  console.log(`Auto-Switch Enabled: ${config.autoSwitchEnabled ? 'Yes' : 'No'}`);
  console.log(`Health Check Interval: ${config.healthCheckInterval / 1000} seconds`);
  console.log(`Failure Threshold: ${config.failureThreshold} checks`);
  console.log(`\nActive Deployment: ${config.deployments[config.activeIndex].name}`);
  console.log(`\nAll Deployments:`);
  config.deployments.forEach((dep, idx) => {
    const marker = idx === config.activeIndex ? '✅' : '  ';
    console.log(`${marker} [${idx}] ${dep.name}`);
    console.log(`    URL: ${dep.url}`);
    console.log(`    Failures: ${dep.failureCount}/${config.failureThreshold}`);
  });
  console.log();
}

// Start continuous monitoring
function startMonitoring() {
  const config = loadConfig();

  console.log('🚀 Starting Automated Deployment Manager');
  console.log(`   Health Check Interval: ${config.healthCheckInterval / 1000} seconds`);
  console.log(`   Failure Threshold: ${config.failureThreshold} checks`);
  console.log(`   Auto-Switch: ${config.autoSwitchEnabled ? 'Enabled' : 'Disabled'}`);
  console.log('\nPress Ctrl+C to stop\n');

  // Run immediately
  autoSwitch();

  // Run periodically
  setInterval(autoSwitch, config.healthCheckInterval);

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n\n✅ Deployment manager stopped');
    process.exit(0);
  });
}

// Main command handler
const command = process.argv[2];

switch (command) {
  case 'start':
    startMonitoring();
    break;
  case 'health':
    showHealth();
    break;
  case 'metrics':
    showMetrics();
    break;
  case 'config':
    showConfig();
    break;
  default:
    console.log(`
🤖 Automated Deployment Manager

Automatically monitors your deployments and switches to healthy ones.

Usage:
  node auto-deploy.js start          - Start continuous monitoring
  node auto-deploy.js health         - Check health of all deployments
  node auto-deploy.js metrics        - Show deployment metrics
  node auto-deploy.js config         - Show current configuration

Features:
  ✅ Continuous health monitoring
  ✅ Automatic failover to backup deployments
  ✅ Updates .env automatically
  ✅ Tracks uptime and metrics
  ✅ Logs all switches

Configuration (.deployments.json):
  - autoSwitchEnabled: Enable/disable automatic switching
  - healthCheckInterval: How often to check (ms)
  - failureThreshold: Failed checks before switching
  - deployments: List of deployment URLs

Example:
  node auto-deploy.js start          # Monitor every 30 seconds
  Press Ctrl+C to stop
    `);
}
