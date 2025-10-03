// lib/utils/pdf.js - PDF Receipt Generation
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

export class PDFService {
  async generateReceipt({ payment, appointment, user, doctor, hospital, receiptNumber }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header with gradient effect (simulated with colors)
        doc.rect(0, 0, doc.page.width, 120).fill('#0ea5e9');

        // Logo and Title
        doc.fillColor('#ffffff')
           .fontSize(32)
           .font('Helvetica-Bold')
           .text('MediCare', 50, 40);

        doc.fillColor('#e0f2fe')
           .fontSize(12)
           .font('Helvetica')
           .text('Your Healthcare Partner', 50, 75);

        // Receipt Title
        doc.fillColor('#ffffff')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('PAYMENT RECEIPT', 350, 50);

        // Reset position
        let yPosition = 150;

        // Receipt Number and Date
        doc.fillColor('#1e293b')
           .fontSize(10)
           .font('Helvetica')
           .text(`Receipt No: ${receiptNumber}`, 50, yPosition);

        doc.text(`Date: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 350, yPosition);

        yPosition += 30;

        // Horizontal line
        doc.moveTo(50, yPosition)
           .lineTo(doc.page.width - 50, yPosition)
           .strokeColor('#cbd5e1')
           .stroke();

        yPosition += 20;

        // Patient Details Section
        doc.fillColor('#0ea5e9')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('PATIENT DETAILS', 50, yPosition);

        yPosition += 25;

        const patientDetails = [
          { label: 'Name', value: `${user.firstName} ${user.lastName}` },
          { label: 'Email', value: user.email },
          { label: 'Phone', value: user.phone || 'N/A' },
          { label: 'Patient ID', value: user.id.substring(0, 12) },
        ];

        patientDetails.forEach(detail => {
          doc.fillColor('#64748b')
             .fontSize(10)
             .font('Helvetica')
             .text(detail.label, 50, yPosition);

          doc.fillColor('#1e293b')
             .font('Helvetica-Bold')
             .text(detail.value, 200, yPosition);

          yPosition += 20;
        });

        yPosition += 10;

        // Appointment Details Section
        doc.fillColor('#0ea5e9')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('APPOINTMENT DETAILS', 50, yPosition);

        yPosition += 25;

        const appointmentDetails = [
          { label: 'Doctor', value: `Dr. ${doctor.name}` },
          { label: 'Specialty', value: doctor.specialty || 'General Physician' },
          { label: 'Hospital', value: hospital.name },
          { label: 'Appointment Date', value: appointment.appointmentDate },
          { label: 'Time', value: appointment.estimatedTime },
          { label: 'Token Number', value: `#${appointment.tokenNumber}` },
        ];

        appointmentDetails.forEach(detail => {
          doc.fillColor('#64748b')
             .fontSize(10)
             .font('Helvetica')
             .text(detail.label, 50, yPosition);

          doc.fillColor('#1e293b')
             .font('Helvetica-Bold')
             .text(detail.value, 200, yPosition);

          yPosition += 20;
        });

        yPosition += 10;

        // Payment Details Section
        doc.fillColor('#0ea5e9')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('PAYMENT DETAILS', 50, yPosition);

        yPosition += 25;

        const paymentDetails = [
          { label: 'Transaction ID', value: payment.transactionId },
          { label: 'Payment ID', value: payment.gatewayTransactionId },
          { label: 'Payment Method', value: payment.gateway.toUpperCase() },
          { label: 'Payment Date', value: format(new Date(payment.paidAt), 'dd MMM yyyy, hh:mm a') },
          { label: 'Status', value: 'PAID' },
        ];

        paymentDetails.forEach(detail => {
          doc.fillColor('#64748b')
             .fontSize(10)
             .font('Helvetica')
             .text(detail.label, 50, yPosition);

          doc.fillColor('#1e293b')
             .font('Helvetica-Bold')
             .text(detail.value, 200, yPosition);

          yPosition += 20;
        });

        yPosition += 20;

        // Amount Box
        doc.rect(50, yPosition, doc.page.width - 100, 80)
           .fillAndStroke('#f0f9ff', '#0ea5e9');

        yPosition += 20;

        doc.fillColor('#0c4a6e')
           .fontSize(12)
           .font('Helvetica')
           .text('Consultation Fee', 70, yPosition);

        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text(`₹${parseFloat(payment.amount).toFixed(2)}`, doc.page.width - 200, yPosition - 5);

        yPosition += 30;

        doc.fillColor('#059669')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('PAYMENT SUCCESSFUL', 70, yPosition);

        yPosition += 50;

        // Footer
        doc.moveTo(50, doc.page.height - 100)
           .lineTo(doc.page.width - 50, doc.page.height - 100)
           .strokeColor('#cbd5e1')
           .stroke();

        doc.fillColor('#64748b')
           .fontSize(10)
           .font('Helvetica')
           .text('Thank you for choosing MediCare!', 50, doc.page.height - 80, { align: 'center', width: doc.page.width - 100 });

        doc.text('For support: support@medicare.com | +91 1800-XXX-XXXX', 50, doc.page.height - 65, { align: 'center', width: doc.page.width - 100 });

        doc.fillColor('#94a3b8')
           .fontSize(8)
           .text(`This is a computer-generated receipt and does not require a signature.`, 50, doc.page.height - 45, { align: 'center', width: doc.page.width - 100 });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export function getPDFService() {
  return new PDFService();
}
