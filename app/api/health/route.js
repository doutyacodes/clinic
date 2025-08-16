import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hospitals, doctors, specialties } from '@/lib/db/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  try {
    // Test database connection and get basic stats
    const [hospitalCount, doctorCount, specialtyCount] = await Promise.all([
      db.select({ count: count() }).from(hospitals),
      db.select({ count: count() }).from(doctors),
      db.select({ count: count() }).from(specialties),
    ]);

    return NextResponse.json({
      status: 'ok',
      message: 'HealthCares API is running',
      database: {
        connected: true,
        hospitals: hospitalCount[0].count,
        doctors: doctorCount[0].count,
        specialties: specialtyCount[0].count,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}