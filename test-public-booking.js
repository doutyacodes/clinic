// Simple test script to verify public booking status API
async function testPublicBookingAPI() {
  const testBookingId = 'test-booking-123'; // Replace with actual booking ID when testing
  
  try {
    console.log('Testing public booking status API...');
    
    const response = await fetch(`http://localhost:3001/api/public/booking-status/${testBookingId}`);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ API works! No authentication required.');
      
      if (data.booking?.queueStatus) {
        console.log('✅ Real-time queue status available!');
        console.log('Queue info:', {
          currentToken: data.booking.queueStatus.currentToken,
          tokensAhead: data.booking.queueStatus.tokensAhead,
          estimatedWait: data.booking.queueStatus.estimatedWaitingMinutes,
          isToday: data.booking.isToday
        });
      }
    } else {
      console.log('❌ API returned error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
console.log('🧪 Testing Public Booking Status API');
console.log('📝 To test with real data, replace testBookingId with actual booking ID');
testPublicBookingAPI();