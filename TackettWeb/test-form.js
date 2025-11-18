// Test form submission to verify SMS receives all data
const testData = {
  serviceType: "pallets",
  palletSize: "48x40",
  palletQty: "25",
  scrapType: "",
  location: "123 Main St, Columbus OH",
  notes: "Call first, loading dock on back",
  pickupTime: "2025-11-16T14:00"
};

async function testSubmit() {
  try {
    console.log('Submitting test pickup request with data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\nExpected SMS message:');
    console.log('---');
    let msg = `Pickup request\nService: ${testData.serviceType}\n`;
    if (testData.serviceType === "pallets") {
      msg += `Pallet Size: ${testData.palletSize}\nQuantity: ${testData.palletQty}\n`;
    }
    msg += `Location: ${testData.location}\nNotes: ${testData.notes}\nPickup Time: ${testData.pickupTime}`;
    console.log(msg);
    console.log('---');
    console.log('\nSending to: https://tackettbroshauling.pro/.netlify/functions/submit');
    
    const response = await fetch('https://tackettbroshauling.pro/.netlify/functions/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('\nResponse:', result);
    console.log('\n✓ Check your phone for SMS message!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSubmit();
