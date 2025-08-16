const jwt = require('jsonwebtoken');

// Test script to debug the booking API
async function testBookingAPI() {
  try {
    // Create a test token (simulate logged in user)
    const testPayload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const token = jwt.sign(testPayload, 'your-super-secret-jwt-key-here', { expiresIn: '1h' });
    console.log('Generated test token:', token);
    
    // Test data
    const testBookingData = {
      doctorId: 'test-doctor-id',
      sessionId: 'test-session-id', 
      hospitalId: 'test-hospital-id',
      appointmentDate: '2025-08-15',
      patientComplaints: 'Test symptoms',
      emergencyContact: 'Test Contact',
      emergencyPhone: '1234567890'
    };
    
    console.log('Test booking data:', testBookingData);
    
    // Make the API call
    const response = await fetch('http://localhost:3000/api/appointments/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `healthcares-token=${token}`
      },
      body: JSON.stringify(testBookingData)
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testBookingAPI();