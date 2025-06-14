import elockApiService from '../services/elockApi.js';

async function testICloudIntegration() {
  console.log('🧪 Testing iCloud Assets Controls API Integration...');
  console.log('');

  try {
    // Test 1: Authentication
    console.log('1️⃣ Testing iCloud API Authentication...');
    const authResult = await elockApiService.authenticateICloudAPI();
    console.log('✅ Authentication successful:', authResult);
    console.log('');

    // Test 2: Single Asset Location
    console.log('2️⃣ Testing Single Asset Location...');
    const testAssetId = 'test-asset-123'; // Replace with actual asset ID
    try {
      const location = await elockApiService.getAssetLocation(testAssetId);
      console.log('✅ Asset location retrieved:', location);
    } catch (error) {
      console.log('⚠️ Asset location test expected to fail with demo data:', error.message);
    }
    console.log('');

    // Test 3: Multiple Asset Locations
    console.log('3️⃣ Testing Multiple Asset Locations...');
    const testAssetIds = ['asset-1', 'asset-2', 'asset-3'];
    try {
      const locations = await elockApiService.getMultipleAssetLocations(testAssetIds);
      console.log('✅ Multiple asset locations retrieved:', locations);
    } catch (error) {
      console.log('⚠️ Multiple asset locations test expected to fail with demo data:', error.message);
    }
    console.log('');

    // Test 4: Device Location
    console.log('4️⃣ Testing Device Location...');
    const testDeviceId = 'device-123';
    try {
      const deviceLocation = await elockApiService.getDeviceLocation(testDeviceId);
      console.log('✅ Device location retrieved:', deviceLocation);
    } catch (error) {
      console.log('⚠️ Device location test expected to fail with demo data:', error.message);
    }
    console.log('');

    console.log('🎉 iCloud API Integration Test Completed!');
    console.log('');
    console.log('📝 Notes:');
    console.log('- Authentication simulation works with dummy data');
    console.log('- Location API calls will fail until real FTokenID is provided');
    console.log('- Update authenticateICloudAPI() method with real authentication endpoint');
    console.log('- Replace dummy response with actual API call to your authentication service');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testICloudIntegration();
