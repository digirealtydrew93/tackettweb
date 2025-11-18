const AWS = require('aws-sdk');

const sns = new AWS.SNS({
  accessKeyId: 'AKIAXPYBGBLOUKAYBUW6',
  secretAccessKey: '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',
  region: 'us-east-2'
});

async function setupSNS() {
  try {
    const phoneNumber = '+12202240393';
    
    // Step 1: Check SMS attributes
    console.log('Checking SMS attributes...');
    const attrs = await sns.getSMSAttributes({ attributes: ['DefaultSMSType'] }).promise();
    console.log('Current SMS attributes:', attrs);

    // Step 2: Set SMS type to Transactional (allows SMS in sandbox)
    console.log('\nSetting SMS type to Transactional...');
    await sns.setSMSAttributes({
      attributes: { DefaultSMSType: 'Transactional' }
    }).promise();
    console.log('✓ SMS type set to Transactional');

    // Step 3: Verify the phone number
    console.log(`\nVerifying phone number ${phoneNumber}...`);
    try {
      await sns.verifyPhoneNumber({ PhoneNumber: phoneNumber }).promise();
      console.log(`✓ Verification code sent to ${phoneNumber}`);
      console.log('Check your phone and get the 6-digit code.');
      console.log('When you have the code, run: node confirm-phone.js <code>');
    } catch (err) {
      if (err.code === 'InvalidParameter') {
        console.log('Phone already verified or in process.');
      } else {
        throw err;
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

setupSNS();
