const twilio = require("twilio");
exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const messageBody = `New Pickup Request: ${JSON.stringify(data)}`;
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    await client.messages.create({ from: process.env.TWILIO_NUMBER, to: process.env.BIDDER_NUMBER, body: messageBody });
    return { statusCode: 200, body: JSON.stringify({ message: "Request sent" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
