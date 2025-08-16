import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { doctors, specialties, doctorSessions, hospitals } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const specialtyFilter = searchParams.get('specialty');
    const hospitalId = searchParams.get('hospitalId');

    let query = db.select({
      id: doctors.id,
      name: doctors.name,
      email: doctors.email,
      phone: doctors.phone,
      qualification: doctors.qualification,
      experience: doctors.experience,
      bio: doctors.bio,
      image: doctors.image,
      rating: doctors.rating,
      totalReviews: doctors.totalReviews,
      consultationFee: doctors.consultationFee,
      isAvailable: doctors.isAvailable,
      licenseNumber: doctors.licenseNumber,
      specialtyId: doctors.specialtyId,
    }).from(doctors);

    // Filter by availability
    query = query.where(eq(doctors.isAvailable, true));

    const allDoctors = await query;

    // Get specialty and sessions for each doctor
    const doctorsWithDetails = await Promise.all(
      allDoctors.map(async (doctor) => {
        // Get specialty
        const specialty = await db.query.specialties.findFirst({
          where: eq(specialties.id, doctor.specialtyId),
        });

        // Get sessions with hospital details
        const sessions = await db
          .select({
            id: doctorSessions.id,
            hospitalId: doctorSessions.hospitalId,
            hospitalName: hospitals.name,
            dayOfWeek: doctorSessions.dayOfWeek,
            startTime: doctorSessions.startTime,
            endTime: doctorSessions.endTime,
            maxTokens: doctorSessions.maxTokens,
            avgMinutesPerPatient: doctorSessions.avgMinutesPerPatient,
            isActive: doctorSessions.isActive,
          })
          .from(doctorSessions)
          .innerJoin(hospitals, eq(doctorSessions.hospitalId, hospitals.id))
          .where(eq(doctorSessions.doctorId, doctor.id));

        return {
          ...doctor,
          specialty: specialty?.name || 'General Medicine',
          sessions: sessions.filter(session => session.isActive),
        };
      })
    );

    // Apply filters
    let filteredDoctors = doctorsWithDetails;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredDoctors = filteredDoctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchLower) ||
        doctor.specialty.toLowerCase().includes(searchLower) ||
        doctor.bio.toLowerCase().includes(searchLower)
      );
    }

    if (specialtyFilter) {
      filteredDoctors = filteredDoctors.filter(doctor =>
        doctor.specialty === specialtyFilter
      );
    }

    if (hospitalId) {
      filteredDoctors = filteredDoctors.filter(doctor =>
        doctor.sessions.some(session => session.hospitalId === hospitalId)
      );
    }

    return NextResponse.json({
      success: true,
      doctors: filteredDoctors,
      total: filteredDoctors.length,
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}