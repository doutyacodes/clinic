import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { doctors, doctorSessions, hospitals, specialties } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { Award } from 'lucide-react';

export async function GET(request, { params }) {
  try {
    const { doctorId } = await params;

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    // Get doctor details with related data
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, doctorId),
      with: {
        specialty: true,
        sessions: {
          with: {
            hospital: true,
          },
          where: eq(doctorSessions.isActive, true),
        },
        reviews: {
          limit: 10,
          orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
          with: {
            user: {
              columns: {
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Transform sessions to include available time slots
    const currentDate = new Date();
    const currentDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const transformedSessions = doctor.sessions.map(session => ({
      id: session.id,
      hospitalId: session.hospitalId,
      hospitalName: session.hospital?.name,
      hospitalAddress: session.hospital?.address,
      hospitalPhone: session.hospital?.phone,
      dayOfWeek: session.dayOfWeek,
      startTime: session.startTime,
      endTime: session.endTime,
      maxTokens: session.maxTokens,
      avgMinutesPerPatient: session.avgMinutesPerPatient,
      isToday: session.dayOfWeek === currentDay,
      // In a real app, you'd calculate current token from appointments
      currentToken: 0,
      availableSlots: session.maxTokens,
    }));

    // Group sessions by hospital
    const sessionsByHospital = transformedSessions.reduce((acc, session) => {
      const hospitalId = session.hospitalId;
      if (!acc[hospitalId]) {
        acc[hospitalId] = {
          hospitalId,
          hospitalName: session.hospitalName,
          hospitalAddress: session.hospitalAddress,
          hospitalPhone: session.hospitalPhone,
          sessions: [],
        };
      }
      acc[hospitalId].sessions.push(session);
      return acc;
    }, {});

    const doctorData = {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialtyId: doctor.specialtyId,
      specialty: doctor.specialty?.name,
      qualification: doctor.qualification,
      experience: doctor.experience,
      bio: doctor.bio,
      image: doctor.image,
      rating: doctor.rating,
      totalReviews: doctor.totalReviews,
      consultationFee: doctor.consultationFee,
      isAvailable: doctor.isAvailable,
      licenseNumber: doctor.licenseNumber,
      dateOfBirth: doctor.dateOfBirth,
      address: doctor.address,
      city: doctor.city,
      state: doctor.state,
      zipCode: doctor.zipCode,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
      sessionsByHospital: Object.values(sessionsByHospital),
      reviews: doctor.reviews?.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isAnonymous: review.isAnonymous,
        isVerified: review.isVerified,
        helpfulVotes: review.helpfulVotes,
        createdAt: review.createdAt,
        user: review.isAnonymous ? null : {
          name: `${review.user?.firstName} ${review.user?.lastName}`,
          profileImage: review.user?.profileImage,
        },
      })) || [],
    };

    return NextResponse.json({
      success: true,
      doctor: doctorData,
    });

  } catch (error) {
    console.error('Get doctor error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor details' },
      { status: 500 }
    );
  }
}