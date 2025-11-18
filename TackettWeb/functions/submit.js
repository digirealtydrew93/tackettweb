const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({ region: process.env.AWS_REGION });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      body = JSON.parse(req.body || '{}');
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
  }

  const { to, message, senderId, smsType } = body;
  if (!to || !message) {
    res.status(400).json({ error: '`to` and `message` are required. `to` must be in E.164 format, e.g. +15551234567.' });
    return;
  }

  const messageAttributes = {};
  const sid = senderId || process.env.SNS_SENDER_ID;
  const type = smsType || process.env.SNS_SMS_TYPE || 'Transactional';

  if (sid) {
    messageAttributes['AWS.SNS.SMS.SenderID'] = { DataType: 'String', StringValue: sid };
  }
  if (type) {
    messageAttributes['AWS.SNS.SMS.SMSType'] = { DataType: 'String', StringValue: type };
  }

  const params = {
    PhoneNumber: to,
    Message: message,
    ...(Object.keys(messageAttributes).length ? { MessageAttributes: messageAttributes } : {})
  };

  try {
    const data = await snsClient.send(new PublishCommand(params));
    res.status(200).json({ success: true, messageId: data.MessageId });
  } catch (err) {
    console.error('SNS publish error:', err);
    res.status(500).json({ error: err.message || 'Failed to send SMS' });
  }
};