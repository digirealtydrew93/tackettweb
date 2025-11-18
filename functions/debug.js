exports.handler = async (event) => {
  // Debug endpoint to check environment variables
  const envVars = {
    TACKETT_AWS_KEY_ID: process.env.TACKETT_AWS_KEY_ID ? '✓ SET' : '✗ MISSING',
    TACKETT_AWS_SECRET_KEY: process.env.TACKETT_AWS_SECRET_KEY ? '✓ SET' : '✗ MISSING',
    TACKETT_AWS_REGION: process.env.TACKETT_AWS_REGION || 'NOT SET',
    TACKETT_PHONE_NUMBER: process.env.TACKETT_PHONE_NUMBER || 'NOT SET'
  };
  
  return {
    statusCode: 200,
    body: JSON.stringify(envVars, null, 2)
  };
};
