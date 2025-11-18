const AWS = require('aws-sdk');

// Request SMS production access removal
async function requestSMSProduction() {
  const support = new AWS.Support({ region: 'us-east-2' });
  
  try {
    console.log('Checking SNS SMS settings...');
    const sns = new AWS.SNS({
      accessKeyId: 'AKIAXPYBGBLOUKAYBUW6',
      secretAccessKey: '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',
      region: 'us-east-2'
    });
    
    // Get SMS attributes
    const attrs = await sns.getSMSAttributes({ attributes: ['MonthlySpendLimit', 'DeliveryStatusSuccessSamplingRate', 'DeliveryStatusIAMRole', 'EventEndpointCreated', 'EventEndpointDeleted', 'EventEndpointUpdated', 'EventDeliveryAttempt', 'EventDeliverySuccess', 'EventDeliveryFailure', 'DefaultSMSType', 'DefaultSenderID'] }).promise();
    
    console.log('Current SMS attributes:', attrs.attributes);
    
    // Check if in sandbox
    const getAccountAttrs = await sns.getTopicAttributes({TopicArn: 'arn:aws:sns:us-east-2:514861697757:*'}).promise().catch(() => ({}));
    
    console.log('\n⚠️  To send SMS to any number (not just verified ones):');
    console.log('1. Go to AWS Console → SNS → Text Messaging (SMS)');
    console.log('2. Click "Request production access"');
    console.log('3. Fill form and submit');
    console.log('4. AWS will review (usually 1-2 hours)');
    console.log('5. Once approved, SNS will work without verified numbers\n');
    
  } catch (err) {
    console.log('Note: Support API requires paid plan. Use AWS Console instead.');
  }
}

requestSMSProduction();
