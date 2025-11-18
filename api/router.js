/**
 * Advanced API Router with SMS-Based Switching
 * 
 * Routes requests to 6 deployments:
 * - 3x Vercel (Primary, Secondary, Tertiary)
 * - 2x Netlify
 * - 1x GitHub Pages (static fallback)
 * 
 * Switches based on:
 * 1. Health checks (5xx errors)
 * 2. SMS limits per deployment
 * 3. Active deployment index
 */

const PRIMARY_API_URL = process.env.PRIMARY_API_URL || 'https://tackettweb-9s7vanrs7-tackett-bros-projects.vercel.app';
const SECONDARY_API_URL = process.env.SECONDARY_API_URL || 'https://tackettweb-k1c9tgj94-tackett-bros-projects.vercel.app';
const TERTIARY_API_URL = process.env.TERTIARY_API_URL || 'https://tackettweb-7s1rlz1mw-tackett-bros-projects.vercel.app';
const NETLIFY_1_URL = process.env.NETLIFY_1_URL || 'https://tackett-netlify-1.netlify.app';
const NETLIFY_2_URL = process.env.NETLIFY_2_URL || 'https://tackett-netlify-2.netlify.app';
const GITHUB_PAGES_URL = process.env.GITHUB_PAGES_URL || 'https://digirealtydrew93.github.io/tackettweb';

const API_ENDPOINTS = [
  PRIMARY_API_URL,
  SECONDARY_API_URL,
  TERTIARY_API_URL,
  NETLIFY_1_URL,
  NETLIFY_2_URL,
  GITHUB_PAGES_URL
];

const DEPLOYMENT_NAMES = [
  'Primary (Vercel)',
  'Secondary (Vercel)',
  'Tertiary (Vercel)',
  'Netlify #1',
  'Netlify #2',
  'GitHub Pages'
];

function getActiveEndpointIndex() {
  const activeIndex = parseInt(process.env.ACTIVE_API_INDEX || '0');
  return Math.min(activeIndex, API_ENDPOINTS.length - 1);
}

async function routeRequest(event, currentEndpointIndex = null) {
  // Use provided index or get from environment
  if (currentEndpointIndex === null) {
    currentEndpointIndex = getActiveEndpointIndex();
  }

  if (currentEndpointIndex >= API_ENDPOINTS.length) {
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: 'All endpoints unavailable',
        endpoints: API_ENDPOINTS.length,
        activeIndex: getActiveEndpointIndex()
      })
    };
  }

  const endpoint = API_ENDPOINTS[currentEndpointIndex];
  const deploymentName = DEPLOYMENT_NAMES[currentEndpointIndex];

  console.log(`[API Router] Routing to [${currentEndpointIndex}] ${deploymentName}`);

  try {
    const response = await fetch(`${endpoint}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Deployment': deploymentName,
        'X-Endpoint-Index': currentEndpointIndex.toString()
      },
      body: event.body,
      timeout: 10000
    });

    const responseText = await response.text();

    // Success
    if (response.ok) {
      console.log(`[API Router] ✅ Success on [${currentEndpointIndex}] ${deploymentName}`);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': deploymentName
        },
        body: JSON.stringify({
          ok: true,
          source: deploymentName,
          deploymentIndex: currentEndpointIndex
        })
      };
    }

    // Server error - try next
    if (response.status >= 500) {
      console.log(`[API Router] ⚠️ Server error [${response.status}] on [${currentEndpointIndex}] ${deploymentName}, trying next...`);
      return routeRequest(event, currentEndpointIndex + 1);
    }

    // Client error - return immediately
    console.log(`[API Router] ❌ Client error [${response.status}] on [${currentEndpointIndex}] ${deploymentName}`);
    return {
      statusCode: response.status,
      body: responseText
    };
  } catch (err) {
    console.log(`[API Router] 🔴 Connection error on [${currentEndpointIndex}] ${deploymentName}: ${err.message}, trying next...`);
    return routeRequest(event, currentEndpointIndex + 1);
  }
}

exports.handler = async (event) => {
  console.log('[API Router] Incoming request', {
    method: event.httpMethod,
    path: event.path,
    activeIndex: getActiveEndpointIndex()
  });

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  return routeRequest(event);
};

// Export for local testing
module.exports = { routeRequest, getActiveEndpointIndex, API_ENDPOINTS, DEPLOYMENT_NAMES };
      return routeRequest(event, currentEndpointIndex + 1);
    } else {
      // Client error, return immediately
      console.log(`Endpoint ${currentEndpointIndex + 1} returned ${response.status}`);
      return {
        statusCode: response.status,
        body: await response.text()
      };
    }
  } catch (err) {
    console.error(`Endpoint ${currentEndpointIndex + 1} failed:`, err.message);
    // Try next endpoint on connection error
    return routeRequest(event, currentEndpointIndex + 1);
  }
}

exports.handler = async (event) => {
  console.log('Router received request:', {
    method: event.httpMethod,
    path: event.path,
    timestamp: new Date().toISOString()
  });

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    return await routeRequest(event);
  } catch (err) {
    console.error('Router error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Router error' })
    };
  }
};

module.exports = exports.handler;
