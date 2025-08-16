import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments, payments } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { appointmentId } = params;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Get the appointment with payment details
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        user: true,
        doctor: true,
        hospital: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get payment details
    const payment = await db.query.payments.findFirst({
      where: eq(payments.appointmentId, appointmentId),
    });

    if (!payment || payment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Payment not found or not completed' },
        { status: 404 }
      );
    }

    // Generate receipt HTML
    const receiptHtml = generateReceiptHtml(appointment, payment);

    // For now, return HTML content that can be printed/saved as PDF
    // In a production environment, you might want to use a PDF generation library like puppeteer
    return new NextResponse(receiptHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="receipt-${appointmentId}.html"`,
      },
    });

  } catch (error) {
    console.error('Download receipt error:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}

function generateReceiptHtml(appointment, payment) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medical Appointment Receipt</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                line-height: 1.6; 
            }
            .header { 
                text-align: center; 
                border-bottom: 2px solid #0ea5e9; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
            }
            .receipt-info { 
                background-color: #f8fafc; 
                padding: 20px; 
                border-radius: 8px; 
                margin-bottom: 20px; 
            }
            .grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
                margin: 20px 0; 
            }
            .section { 
                background-color: #f1f5f9; 
                padding: 15px; 
                border-radius: 8px; 
            }
            .total { 
                background-color: #dcfce7; 
                padding: 15px; 
                border-radius: 8px; 
                text-align: center; 
                font-size: 18px; 
                font-weight: bold; 
            }
            @media print {
                body { margin: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏥 HealthCares Medical Receipt</h1>
            <p>Receipt #${payment.id}</p>
            <p>Date: ${formatDate(payment.paidAt || payment.createdAt)}</p>
        </div>

        <div class="receipt-info">
            <h2>Appointment Details</h2>
            <p><strong>Appointment ID:</strong> ${appointment.id}</p>
            <p><strong>Status:</strong> ${appointment.status}</p>
            <p><strong>Date:</strong> ${formatDate(appointment.appointmentDate)}</p>
            <p><strong>Time:</strong> ${formatTime(appointment.estimatedTime)}</p>
            <p><strong>Token Number:</strong> #${appointment.tokenNumber}</p>
        </div>

        <div class="grid">
            <div class="section">
                <h3>Patient Information</h3>
                <p><strong>Name:</strong> ${appointment.user?.firstName} ${appointment.user?.lastName}</p>
                <p><strong>Email:</strong> ${appointment.user?.email}</p>
                <p><strong>Phone:</strong> ${appointment.user?.phone || 'N/A'}</p>
            </div>

            <div class="section">
                <h3>Doctor Information</h3>
                <p><strong>Name:</strong> Dr. ${appointment.doctor?.name}</p>
                <p><strong>Specialty:</strong> ${appointment.doctor?.specialty}</p>
                <p><strong>Experience:</strong> ${appointment.doctor?.experience} years</p>
            </div>
        </div>

        <div class="section">
            <h3>Hospital Information</h3>
            <p><strong>Name:</strong> ${appointment.hospital?.name}</p>
            <p><strong>Address:</strong> ${appointment.hospital?.address}</p>
            <p><strong>Phone:</strong> ${appointment.hospital?.phone}</p>
        </div>

        <div class="section">
            <h3>Payment Information</h3>
            <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
            <p><strong>Payment Method:</strong> ${payment.gateway}</p>
            <p><strong>Payment Date:</strong> ${formatDate(payment.paidAt)}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
        </div>

        <div class="total">
            <p>Total Amount Paid: ₹${payment.amount}</p>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #64748b; font-size: 12px;">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>Thank you for choosing HealthCares for your medical needs.</p>
            <p>For any queries, please contact our support team.</p>
        </div>
    </body>
    </html>
  `;
}