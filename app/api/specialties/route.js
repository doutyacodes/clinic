import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { specialties } from '@/lib/db/schema.js';

export async function GET() {
  try {
    const allSpecialties = await db.select({
      id: specialties.id,
      name: specialties.name,
      description: specialties.description,
      icon: specialties.icon,
    }).from(specialties);

    return NextResponse.json({
      success: true,
      specialties: allSpecialties,
    });

  } catch (error) {
    console.error('Get specialties error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch specialties' },
      { status: 500 }
    );
  }
}