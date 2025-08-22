// Simple API testing utility
export async function testAPIEndpoint() {
  console.log('🧪 Testing API endpoints...');
  
  // Test 1: Test endpoint
  try {
    console.log('📡 Testing /api/test endpoint...');
    const testResponse = await fetch('/api/test', {
      method: 'GET'
    });
    
    console.log('Test Response Status:', testResponse.status);
    const testText = await testResponse.text();
    console.log('Test Response Text:', testText);
    
    if (testText) {
      try {
        const testJson = JSON.parse(testText);
        console.log('✅ Test API working:', testJson);
      } catch (e) {
        console.log('❌ Test API returned non-JSON:', testText);
      }
    }
  } catch (error) {
    console.error('❌ Test API failed:', error);
  }
  
  // Test 2: Submit score endpoint
  try {
    console.log('📡 Testing /api/submit-score endpoint...');
    const submitResponse = await fetch('/api/submit-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress: '0x1234567890123456789012345678901234567890',
        score: 100,
        transactions: 1
      })
    });
    
    console.log('Submit Response Status:', submitResponse.status);
    const submitText = await submitResponse.text();
    console.log('Submit Response Text:', submitText);
    
    if (submitText) {
      try {
        const submitJson = JSON.parse(submitText);
        console.log('📊 Submit API response:', submitJson);
      } catch (e) {
        console.log('❌ Submit API returned non-JSON:', submitText);
      }
    }
  } catch (error) {
    console.error('❌ Submit API failed:', error);
  }
}

// Add this to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testAPI = testAPIEndpoint;
}