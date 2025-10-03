// lib/utils/email.js - Email Service
import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail({ to, subject, html, attachments = [] }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'MediCare'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments,
      });

      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendAppointmentConfirmation({ user, appointment, doctor, hospital }) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .label { color: #64748b; font-size: 14px; margin-bottom: 5px; }
            .value { color: #1e293b; font-size: 16px; font-weight: 600; margin-bottom: 15px; }
            .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Appointment Confirmed!</h1>
              <p>Your appointment has been successfully booked</p>
            </div>
            <div class="content">
              <p>Dear ${user.firstName} ${user.lastName},</p>
              <p>Your appointment has been confirmed. Here are the details:</p>

              <div class="card">
                <div class="label">Doctor</div>
                <div class="value">Dr. ${doctor.name}</div>

                <div class="label">Specialty</div>
                <div class="value">${doctor.specialty || 'General Physician'}</div>

                <div class="label">Hospital</div>
                <div class="value">${hospital.name}</div>

                <div class="label">Date & Time</div>
                <div class="value">${appointment.appointmentDate} at ${appointment.estimatedTime}</div>

                <div class="label">Token Number</div>
                <div class="value">#${appointment.tokenNumber}</div>

                <div class="label">Consultation Fee</div>
                <div class="value">₹${appointment.consultationFee}</div>
              </div>

              <p><strong>Important Instructions:</strong></p>
              <ul>
                <li>Please arrive 15 minutes before your scheduled time</li>
                <li>Bring your ID proof and any previous medical records</li>
                <li>Your token number is <strong>#${appointment.tokenNumber}</strong></li>
              </ul>

              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" class="button">View My Appointments</a>
              </center>

              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} MediCare. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Appointment Confirmed - Token #${appointment.tokenNumber}`,
      html,
    });
  }

  async sendPaymentReceipt({ user, payment, appointment, doctor, hospital, receiptPdfBuffer }) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .label { color: #64748b; font-size: 14px; margin-bottom: 5px; }
            .value { color: #1e293b; font-size: 16px; font-weight: 600; margin-bottom: 15px; }
            .success { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Successful!</h1>
              <p>Thank you for your payment</p>
            </div>
            <div class="content">
              <div class="success">
                <strong>Payment Received: ₹${payment.amount}</strong>
              </div>

              <p>Dear ${user.firstName} ${user.lastName},</p>
              <p>We have received your payment. Your receipt is attached to this email.</p>

              <div class="card">
                <div class="label">Transaction ID</div>
                <div class="value">${payment.transactionId}</div>

                <div class="label">Payment ID</div>
                <div class="value">${payment.gatewayTransactionId}</div>

                <div class="label">Amount Paid</div>
                <div class="value">₹${payment.amount}</div>

                <div class="label">Payment Date</div>
                <div class="value">${new Date(payment.paidAt).toLocaleString('en-IN')}</div>

                <div class="label">Service</div>
                <div class="value">Medical Consultation - Dr. ${doctor.name}</div>
              </div>

              <p>Your appointment details:</p>
              <ul>
                <li><strong>Date:</strong> ${appointment.appointmentDate}</li>
                <li><strong>Time:</strong> ${appointment.estimatedTime}</li>
                <li><strong>Token:</strong> #${appointment.tokenNumber}</li>
                <li><strong>Hospital:</strong> ${hospital.name}</li>
              </ul>

              <div class="footer">
                <p>For any queries, contact us at support@medicare.com</p>
                <p>&copy; ${new Date().getFullYear()} MediCare. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const attachments = [];
    if (receiptPdfBuffer) {
      attachments.push({
        filename: `Receipt_${payment.transactionId}.pdf`,
        content: receiptPdfBuffer,
        contentType: 'application/pdf',
      });
    }

    return this.sendEmail({
      to: user.email,
      subject: `Payment Receipt - ₹${payment.amount}`,
      html,
      attachments,
    });
  }

  async sendNotificationEmail({ user, notification }) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .notification { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6; border-radius: 4px; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 ${notification.title}</h1>
            </div>
            <div class="content">
              <p>Dear ${user.firstName},</p>

              <div class="notification">
                <p>${notification.message}</p>
              </div>

              <div class="footer">
                <p>This is an automated notification from MediCare</p>
                <p>&copy; ${new Date().getFullYear()} MediCare. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: notification.title,
      html,
    });
  }
}

export function getEmailService() {
  return new EmailService();
}
