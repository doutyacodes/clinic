// app/api/user/medical-records/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { medicalRecords, appointments } from '@/lib/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt.js';
import { AUTH_CONFIG } from '@/lib/auth/config.js';

export async function GET(request) {
  try {
    // Get token from cookie
    const cookie = request.headers.get('cookie') || '';
    const tokenMatch = cookie.match(new RegExp(`${AUTH_CONFIG.COOKIE_NAME}=([^;]+)`));
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    // Get user's medical records with related data
    const userRecords = await db.query.medicalRecords.findMany({
      where: eq(medicalRecords.userId, user.userId),
      with: {
        appointment: {
          with: {
            doctor: {
              with: {
                specialty: true,
              },
            },
            hospital: true,
          },
        },
        doctor: {
          with: {
            specialty: true,
          },
        },
      },
      orderBy: desc(medicalRecords.createdAt),
    });

    // Transform data for frontend
    const records = userRecords.map(record => ({
      id: record.id,
      appointmentId: record.appointmentId,
      appointmentDate: record.appointment?.appointmentDate,
      diagnosis: record.diagnosis,
      symptoms: record.symptoms,
      treatment: record.treatment,
      prescription: record.prescription,
      vitals: record.vitals,
      labReports: record.labReports,
      followUpDate: record.followUpDate,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      doctor: {
        id: record.doctor?.id,
        name: record.doctor?.name,
        specialty: record.doctor?.specialty?.name,
        image: record.doctor?.image,
      },
      hospital: record.appointment?.hospital ? {
        id: record.appointment.hospital.id,
        name: record.appointment.hospital.name,
        address: record.appointment.hospital.address,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      records,
      total: records.length,
    });

  } catch (error) {
    console.error('Get medical records error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}
