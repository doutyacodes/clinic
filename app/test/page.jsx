'use client';

import React, { useState } from 'react';

export default function PayUTestPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testPayUIntegration = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Create a test appointment first
      const appointmentResponse = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: 'test-doctor-id',
          sessionId: 'test-session-id',
          hospitalId: 'test-hospital-id',
          appointmentDate: '2024-08-20',
          tokenNumber: 1,
          estimatedTime: '10:00',
          bookingType: 'next',
          patientComplaints: 'Test complaint',
        }),
      });

      if (!appointmentResponse.ok) {
        throw new Error('Failed to create test appointment');
      }

      const appointmentData = await appointmentResponse.json();
      
      // Now test payment initiation
      const paymentResponse = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointmentData.booking.id,
        }),
      });

      const paymentData = await paymentResponse.json();
      
      setResult({
        success: paymentResponse.ok,
        appointmentData,
        paymentData,
      });

    } catch (error) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testPayUHash = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/test/payu-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txnid: 'TEST_TXN_123',
          amount: 500,
          productinfo: 'Test Product',
          firstname: 'Test',
          email: 'test@example.com',
          udf1: 'test-appointment-id'
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PayU Integration Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test PayU Hash Generation</h2>
          <button
            onClick={testPayUHash}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Hash Generation'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Full Payment Flow</h2>
          <p className="text-gray-600 mb-4">
            This will create a test appointment and initiate payment
          </p>
          <button
            onClick={testPayUIntegration}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Full Flow'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Result</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}