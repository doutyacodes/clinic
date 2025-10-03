// app/api/notifications/unread-count/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { notifications } from '@/lib/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt.js';
import { AUTH_CONFIG } from '@/lib/auth/config.js';

export async function GET(request) {
  try {
    // Get token from cookie
    const cookie = request.headers.get('cookie') || '';
    const tokenMatch = cookie.match(new RegExp(`${AUTH_CONFIG.COOKIE_NAME}=([^;]+)`));
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ count: 0 });
    }

    const user = await verifyToken(token);

    const unreadNotifications = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, user.userId),
          eq(notifications.isRead, false)
        )
      );

    return NextResponse.json({
      success: true,
      count: unreadNotifications.length,
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json({ count: 0 });
  }
}
