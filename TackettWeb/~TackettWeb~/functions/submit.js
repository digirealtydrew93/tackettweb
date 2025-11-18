const twilio = require("twilio");

exports.handler = async (event) => {
  try {
    const data = event.body ? JSON.parse(event.body) : {};

    const serviceType = data.serviceType || "";
    const palletSize  = data.palletSize || "";
    const palletQty   = data.palletQty  || "";
    const scrapType   = data.scrapType  || "";
    const location    = data.location   || "";
    const notes       = data.notes      || "";
    const pickupTime  = data.pickupTime || "";

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

    let body = `Pickup request\nService: ${serviceType}\n`;
    if (serviceType === "pallets") {
