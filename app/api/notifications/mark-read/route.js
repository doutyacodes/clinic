// app/api/notifications/mark-read/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { notifications } from '@/lib/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt.js';
import { AUTH_CONFIG } from '@/lib/auth/config.js';

export async function POST(request) {
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
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Mark all notifications as read
      await db.update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(eq(notifications.userId, user.userId));

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID required' },
        { status: 400 }
      );
    }

    // Mark specific notification as read
    await db.update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.userId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
