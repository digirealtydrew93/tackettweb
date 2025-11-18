/**
 * API Router - Routes requests to the active API endpoint
 * Allows seamless deployments by switching between multiple backend instances
 */

// List of available API endpoints (add more as needed)
const API_ENDPOINTS = [
  process.env.PRIMARY_API_URL || 'https://tackettweb-9s7vanrs7-tackett-bros-projects.vercel.app',
  process.env.SECONDARY_API_URL || 'https://tackettweb-k1c9tgj94-tackett-bros-projects.vercel.app',
  process.env.TERTIARY_API_URL || 'https://tackettweb-7s1rlz1mw-tackett-bros-projects.vercel.app',
];

// Get the current active endpoint (default to first)
function getActiveEndpoint() {
  const active = process.env.ACTIVE_API_INDEX || '0';
  return API_ENDPOINTS[parseInt(active)];
}

// Try endpoints in sequence until one succeeds
async function routeRequest(event, currentEndpointIndex = 0) {
  if (currentEndpointIndex >= API_ENDPOINTS.length) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: 'All API endpoints unavailable' })
    };
  }

  const endpoint = API_ENDPOINTS[currentEndpointIndex];
  
  try {
    console.log(`Attempting endpoint ${currentEndpointIndex + 1}/${API_ENDPOINTS.length}: ${endpoint}`);

    const response = await fetch(`${endpoint}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: event.body,
      timeout: 10000 // 10 second timeout
    });

    if (response.ok) {
      console.log(`Success on endpoint ${currentEndpointIndex + 1}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, endpoint: endpoint })
      };
    } else if (response.status >= 500) {
      // Server error, try next endpoint
      console.log(`Endpoint ${currentEndpointIndex + 1} returned ${response.status}, trying next...`);
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
