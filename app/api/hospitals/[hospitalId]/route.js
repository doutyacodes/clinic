import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { hospitals, hospitalSpecialties, specialties, doctors, doctorSessions } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const hospitalId = await params.hospitalId;

    // Get hospital details
    const hospital = await db.query.hospitals.findFirst({
      where: eq(hospitals.id, hospitalId),
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      );
    }

    // Get specialties for this hospital
    const hospitalSpecialtyList = await db
      .select({
        specialtyName: specialties.name,
      })
      .from(hospitalSpecialties)
      .innerJoin(specialties, eq(hospitalSpecialties.specialtyId, specialties.id))
      .where(eq(hospitalSpecialties.hospitalId, hospital.id));

    // Get doctors working at this hospital
    const hospitalDoctors = await db
      .select({
        doctorId: doctors.id,
        doctorName: doctors.name,
        doctorImage: doctors.image,
        doctorEmail: doctors.email,
        doctorPhone: doctors.phone,
        doctorBio: doctors.bio,
        doctorRating: doctors.rating,
        doctorExperience: doctors.experience,
        doctorFee: doctors.consultationFee,
        specialtyName: specialties.name,
        sessionId: doctorSessions.id,
        dayOfWeek: doctorSessions.dayOfWeek,
        startTime: doctorSessions.startTime,
        endTime: doctorSessions.endTime,
        maxTokens: doctorSessions.maxTokens,
        avgMinutesPerPatient: doctorSessions.avgMinutesPerPatient,
        isActive: doctorSessions.isActive,
      })
      .from(doctorSessions)
      .innerJoin(doctors, eq(doctorSessions.doctorId, doctors.id))
      .innerJoin(specialties, eq(doctors.specialtyId, specialties.id))
      .where(eq(doctorSessions.hospitalId, hospital.id));

    // Group doctors by doctor ID and organize their sessions
    const doctorsMap = new Map();
    
    hospitalDoctors.forEach(row => {
      if (!doctorsMap.has(row.doctorId)) {
        doctorsMap.set(row.doctorId, {
          id: row.doctorId,
          name: row.doctorName,
          image: row.doctorImage,
          email: row.doctorEmail,
          phone: row.doctorPhone,
          bio: row.doctorBio,
          rating: row.doctorRating,
          experience: row.doctorExperience,
          consultationFee: row.doctorFee,
          specialty: row.specialtyName,
          sessions: []
        });
      }
      
      if (row.isActive) {
        doctorsMap.get(row.doctorId).sessions.push({
          id: row.sessionId,
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          maxTokens: row.maxTokens,
          avgMinutesPerPatient: row.avgMinutesPerPatient
        });
      }
    });

    const hospitalWithDetails = {
      ...hospital,
      specialties: hospitalSpecialtyList.map(hs => hs.specialtyName),
      doctors: Array.from(doctorsMap.values()).filter(doctor => doctor.sessions.length > 0)
    };

    return NextResponse.json({
      success: true,
      hospital: hospitalWithDetails,
    });

  } catch (error) {
    console.error('Get hospital details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospital details' },
      { status: 500 }
    );
  }
}