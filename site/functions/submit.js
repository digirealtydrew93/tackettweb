const AWS = require('aws-sdk');

const sns = new AWS.SNS({
  accessKeyId: process.env.TACKETT_AWS_KEY_ID,
  secretAccessKey: process.env.TACKETT_AWS_SECRET_KEY,
  region: process.env.TACKETT_AWS_REGION || 'us-east-2'
});

function buildPickupMessage(data) {
  let body = `Tackett Brothers Hauling — New Pickup Request\n`;
  body += `Service: ${data.serviceType}\n`;

  if (data.serviceType && data.serviceType.toLowerCase() === "pallets") {
    body += `Size: ${data.palletSize || "N/A"}\nQuantity: ${data.palletQty || "N/A"}\n`;
  }
  if (data.serviceType && data.serviceType.toLowerCase() === "scrap") {
    body += `Scrap Type: ${data.scrapType || "N/A"}\n`;
  }

  body += `Location: ${data.location || "N/A"}\n`;
  if (data.notes) body += `Notes: ${data.notes}\n`;
  if (data.pickupTime) body += `Preferred Time: ${data.pickupTime}\n`;

  return body;
}

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    console.log("Form data received:", data);

    const messageBody = buildPickupMessage(data);

    await sns.publish({
      Message: messageBody,
      PhoneNumber: process.env.TACKETT_PHONE_NUMBER
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("SMS error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};

