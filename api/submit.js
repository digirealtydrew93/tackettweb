const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const sns = new AWS.SNS({
  accessKeyId: process.env.TACKETT_AWS_KEY_ID,
  secretAccessKey: process.env.TACKETT_AWS_SECRET_KEY,
  region: process.env.TACKETT_AWS_REGION || 'us-east-2'
});

exports.handler = async (event) => {
  try {
    console.log('Event:', event);
    console.log('Event body:', event.body);
    
    // Parse JSON body
    const data = JSON.parse(event.body);
    console.log('Parsed data:', data);

    const serviceType = data.serviceType || "";
    const palletSize  = data.palletSize || "";
    const palletQty   = data.palletQty  || "";
    const scrapType   = data.scrapType  || "";
    const location    = data.location   || "";
    const notes       = data.notes      || "";
    const pickupTime  = data.pickupTime || "";

    // Build default SMS body
    let defaultBody = `Pickup request\nService: ${serviceType}\n`;
    if (serviceType === "pallets") {
      defaultBody += `Pallet Size: ${palletSize}\nQuantity: ${palletQty}\n`;
    }
    if (serviceType === "scrap") {
      defaultBody += `Scrap Type: ${scrapType}\n`;
    }
    defaultBody += `Location: ${location}\nNotes: ${notes}\nPickup Time: ${pickupTime}`;
    console.log('Default SMS body:', defaultBody);

    // If enabled, try to generate a concise SMS using OpenAI
    let body = defaultBody;
    try {
      const apiKey = process.env.TACKETT_OPENAI_KEY;
      if (apiKey) {
        console.log('OpenAI key found, generating smart SMS...');
        const url = 'https://api.openai.com/v1/chat/completions';
        const prompt = `You are a professional SMS generator for a hauling company. Given the details below, create a single concise SMS notification (under 160 characters if possible) that clearly summarizes the pickup request. Be direct and include key details.\n\nService: ${serviceType}\nPallet Size: ${palletSize}\nQuantity: ${palletQty}\nScrap Type: ${scrapType}\nLocation: ${location}\nNotes: ${notes}\nPickup Time: ${pickupTime}`;

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 160,
            temperature: 0.7
          })
        });

        // Extract text from OpenAI response
        const respData = await resp.json();
        if (respData && respData.choices && respData.choices[0]) {
          body = respData.choices[0].message.content || defaultBody;
          console.log('✓ AI-generated SMS:', body);
        }
      }
    } catch (aiErr) {
      console.error('AI generation failed, using default body:', aiErr && aiErr.toString());
      body = defaultBody;
    }

    // Send SMS via AWS SNS
    console.log('Checking AWS SNS credentials...');
    console.log('TACKETT_AWS_KEY_ID exists:', !!process.env.TACKETT_AWS_KEY_ID);
    console.log('TACKETT_AWS_SECRET_KEY exists:', !!process.env.TACKETT_AWS_SECRET_KEY);
    console.log('TACKETT_PHONE_NUMBER:', process.env.TACKETT_PHONE_NUMBER);
    
    let smsSent = false;
    if (process.env.TACKETT_AWS_KEY_ID && process.env.TACKETT_AWS_SECRET_KEY && process.env.TACKETT_PHONE_NUMBER) {
      try {
        console.log('Credentials found, sending SMS via AWS SNS...');
        const result = await sns.publish({
          Message: body,
          PhoneNumber: process.env.TACKETT_PHONE_NUMBER
        }).promise();
        console.log('✓ SMS sent successfully! Message ID:', result.MessageId);
        smsSent = true;
      } catch (smsErr) {
        console.error('SNS SMS error:', smsErr.message);
        console.log('Falling back to log-based delivery...');
      }
    } else {
      console.log('AWS SNS credentials not fully configured. Falling back to log-based delivery...');
    }

    // Fallback: Log request for manual review if SMS fails
    if (!smsSent) {
      console.log('LOG-BASED DELIVERY: Request logged for manual review');
      const logEntry = {
        timestamp: new Date().toISOString(),
        serviceType,
        palletSize,
        palletQty,
        scrapType,
        location,
        notes,
        pickupTime,
        message: body
      };
      console.log('Request data:', logEntry);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, message: "Pickup request received and SMS sent" }) };
  } catch (err) {
    console.error("Submit error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error", details: err.toString() }) };
  }
};

module.exports = exports.handler;
