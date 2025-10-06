import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { doctors } from '@/lib/db/schema.js';
import { and, eq, lt, isNotNull } from 'drizzle-orm';

// This endpoint should be called by a cron job every minute
// Can be set up with Vercel Cron or external cron service
export async function GET(request) {
  try {
    const now = new Date();

    // Find all doctors on timed breaks where break time has expired
    const expiredBreaks = await db
      .select()
      .from(doctors)
      .where(
        and(
          eq(doctors.status, 'on_break'),
          eq(doctors.breakType, 'timed'),
          isNotNull(doctors.breakEndTime),
          lt(doctors.breakEndTime, now)
        )
      );

    if (expiredBreaks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired breaks found',
        count: 0,
      });
    }

    // Auto-end all expired timed breaks
    const updatePromises = expiredBreaks.map((doctor) =>
      db.update(doctors)
        .set({
          status: 'available',
          breakType: null,
          breakStartTime: null,
          breakEndTime: null,
          breakReason: null,
          updatedAt: now,
        })
        .where(eq(doctors.id, doctor.id))
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Auto-ended ${expiredBreaks.length} expired timed break(s)`,
      count: expiredBreaks.length,
      doctors: expiredBreaks.map(d => ({ id: d.id, name: d.name })),
    });

  } catch (error) {
    console.error('Auto-end breaks cron error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-end breaks' },
      { status: 500 }
    );
  }
}
