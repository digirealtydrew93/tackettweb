const twilio = require("twilio");

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

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    const messageBody = buildPickupMessage(data);

    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_NUMBER,
      to: process.env.BIDDER_NUMBER
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Twilio error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};

