// app/api/notifications/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { notifications } from '@/lib/db/schema.js';
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build query
    let query = db.select()
      .from(notifications)
      .where(eq(notifications.userId, user.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    const userNotifications = await query;

    // Filter unread if needed
    const filteredNotifications = unreadOnly
      ? userNotifications.filter(n => !n.isRead)
      : userNotifications;

    // Count unread
    const unreadCount = userNotifications.filter(n => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications: filteredNotifications,
      unreadCount,
      total: filteredNotifications.length,
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
