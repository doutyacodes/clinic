import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { hospitals, hospitalSpecialties, specialties } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const specialty = searchParams.get('specialty');

    let query = db.select({
      id: hospitals.id,
      name: hospitals.name,
      address: hospitals.address,
      city: hospitals.city,
      state: hospitals.state,
      zipCode: hospitals.zipCode,
      phone: hospitals.phone,
      email: hospitals.email,
      description: hospitals.description,
      image: hospitals.image,
      rating: hospitals.rating,
      totalReviews: hospitals.totalReviews,
      totalDoctors: hospitals.totalDoctors,
      established: hospitals.established,
      website: hospitals.website,
      isActive: hospitals.isActive,
    }).from(hospitals);

    // Filter by active status
    query = query.where(eq(hospitals.isActive, true));

    const allHospitals = await query;

    // Get specialties for each hospital
    const hospitalsWithSpecialties = await Promise.all(
      allHospitals.map(async (hospital) => {
        const hospitalSpecialtyList = await db
          .select({
            specialtyName: specialties.name,
          })
          .from(hospitalSpecialties)
          .innerJoin(specialties, eq(hospitalSpecialties.specialtyId, specialties.id))
          .where(eq(hospitalSpecialties.hospitalId, hospital.id));

        return {
          ...hospital,
          specialties: hospitalSpecialtyList.map(hs => hs.specialtyName),
        };
      })
    );

    // Apply filters
    let filteredHospitals = hospitalsWithSpecialties;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredHospitals = filteredHospitals.filter(hospital => 
        hospital.name.toLowerCase().includes(searchLower) ||
        hospital.address.toLowerCase().includes(searchLower) ||
        hospital.city.toLowerCase().includes(searchLower) ||
        hospital.specialties.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    if (specialty) {
      filteredHospitals = filteredHospitals.filter(hospital =>
        hospital.specialties.includes(specialty)
      );
    }

    return NextResponse.json({
      success: true,
      hospitals: filteredHospitals,
      total: filteredHospitals.length,
    });

  } catch (error) {
    console.error('Get hospitals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospitals' },
      { status: 500 }
    );
  }
}