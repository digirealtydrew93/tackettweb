const AWS = require('aws-sdk');

const sns = new AWS.SNS({
  accessKeyId: 'AKIAXPYBGBLOUKAYBUW6',
  secretAccessKey: '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',
  region: 'us-east-2'
});

async function verifyPhone() {
  try {
    // List opted-out numbers
    console.log('Checking opted-out numbers...');
    const optedOut = await sns.listPhoneNumbersOptedOut().promise();
    console.log('Opted-out numbers:', optedOut.PhoneNumbers);

    // Check if your number is opted out
    const yourNumber = '+12202240393';
    if (optedOut.PhoneNumbers && optedOut.PhoneNumbers.includes(yourNumber)) {
      console.log(`\n${yourNumber} is opted out. Opting in...`);
      await sns.optInPhoneNumber({ PhoneNumber: yourNumber }).promise();
      console.log(`✓ ${yourNumber} opted in successfully!`);
    } else {
      console.log(`\n${yourNumber} is already opted in or not in opted-out list.`);
    }

    // Try sending a test SMS
    console.log('\nSending test SMS to ' + yourNumber + '...');
    const result = await sns.publish({
      Message: 'Test SMS from Tackett Bros Hauling - AWS SNS integration working!',
      PhoneNumber: yourNumber
    }).promise();
    console.log('✓ SMS sent successfully!');
    console.log('Message ID:', result.MessageId);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

verifyPhone();
