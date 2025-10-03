// app/api/user/analytics/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments, payments } from '@/lib/db/schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';
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

    // Get all user appointments with related data
    const userAppointments = await db.query.appointments.findMany({
      where: eq(appointments.userId, user.userId),
      with: {
        doctor: {
          columns: {
            name: true,
            specialtyId: true,
          },
          with: {
            specialty: {
              columns: {
                name: true,
              },
            },
          },
        },
        hospital: {
          columns: {
            name: true,
          },
        },
      },
    });

    // Get all user payments
    const userPayments = await db.query.payments.findMany({
      where: eq(payments.userId, user.userId),
    });

    // Calculate statistics
    const totalAppointments = userAppointments.length;
    const completedAppointments = userAppointments.filter(a => a.status === 'completed').length;
    const upcomingAppointments = userAppointments.filter(a =>
      a.status === 'confirmed' && new Date(a.appointmentDate) > new Date()
    ).length;
    const cancelledAppointments = userAppointments.filter(a => a.status === 'cancelled').length;

    const totalSpent = userPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Monthly spending trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySpending = {};
    userPayments
      .filter(p => p.status === 'completed' && new Date(p.createdAt) >= sixMonthsAgo)
      .forEach(p => {
        const month = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlySpending[month] = (monthlySpending[month] || 0) + parseFloat(p.amount);
      });

    const monthlyData = Object.keys(monthlySpending)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(month => ({
        month,
        amount: monthlySpending[month],
      }));

    // Appointments by status
    const appointmentsByStatus = [
      { status: 'Completed', count: completedAppointments, color: '#10b981' },
      { status: 'Upcoming', count: upcomingAppointments, color: '#3b82f6' },
      { status: 'Cancelled', count: cancelledAppointments, color: '#ef4444' },
      { status: 'Pending', count: userAppointments.filter(a => a.status === 'pending').length, color: '#f59e0b' },
    ];

    // Most visited specialties
    const specialtyCount = {};
    userAppointments.forEach(apt => {
      const specialty = apt.doctor?.specialty?.name || 'General';
      specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
    });

    const topSpecialties = Object.entries(specialtyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Most visited hospitals
    const hospitalCount = {};
    userAppointments.forEach(apt => {
      const hospital = apt.hospital?.name || 'Unknown';
      hospitalCount[hospital] = (hospitalCount[hospital] || 0) + 1;
    });

    const topHospitals = Object.entries(hospitalCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Recent activity (last 10 appointments)
    const recentActivity = userAppointments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(apt => ({
        id: apt.id,
        date: apt.appointmentDate,
        doctor: apt.doctor?.name,
        hospital: apt.hospital?.name,
        status: apt.status,
        amount: apt.consultationFee,
      }));

    // Health score (simple calculation based on engagement)
    const healthScore = Math.min(100, Math.round(
      (completedAppointments * 10) +
      (upcomingAppointments * 5) +
      (totalAppointments > 0 ? 20 : 0)
    ));

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalAppointments,
          completedAppointments,
          upcomingAppointments,
          cancelledAppointments,
          totalSpent: totalSpent.toFixed(2),
          healthScore,
        },
        charts: {
          monthlySpending: monthlyData,
          appointmentsByStatus,
          topSpecialties,
          topHospitals,
        },
        recentActivity,
      },
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
