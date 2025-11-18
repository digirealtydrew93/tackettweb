const AWS = require('aws-sdk');

const sns = new AWS.SNS({
  accessKeyId: process.env.TACKETT_AWS_KEY_ID,
  secretAccessKey: process.env.TACKETT_AWS_SECRET_KEY,
  region: process.env.TACKETT_AWS_REGION || 'us-east-1'
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    const message = `
New Pickup Request from Tackett Bros Hauling:

Name: ${data.name || 'N/A'}
Phone: ${data.phone || 'N/A'}
Email: ${data.email || 'N/A'}
Service Type: ${data.serviceType || 'N/A'}
Location: ${data.location || 'N/A'}
Details: ${data.details || 'N/A'}
    `.trim();

    await sns.publish({
      Message: message,
      PhoneNumber: process.env.TACKETT_PHONE_NUMBER || '+12202240393',
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'TackettBros'
        }
      }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'SMS sent successfully',
        source: 'netlify'
      })
    };
  } catch (error) {
    console.error('SMS Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send SMS',
        details: error.message 
      })
    };
  }
};
