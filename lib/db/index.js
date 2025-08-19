import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";

// Create MySQL database connection for WAMP
const pool = mysql.createPool({
  host: '68.178.163.247',
  user: 'devuser_hospitals',
  password: 'Wowfy#user',
  database: 'devuser_hospitals',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool, { schema, mode: 'default' });


// Helper function to initialize database
export function initializeDatabase() {
  try {
    console.log("✅ Database connection established");
    return connection;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

// Helper functions for common operations
export async function getUserById(id) {
  return await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, id),
  });
}

export async function getUserByEmail(email) {
  return await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });
}

export async function getHospitals() {
  return await db.query.hospitals.findMany({
    where: (hospitals, { eq }) => eq(hospitals.isActive, true),
    with: {
      hospitalSpecialties: {
        with: {
          specialty: true,
        },
      },
    },
  });
}

export async function getHospitalById(id) {
  return await db.query.hospitals.findFirst({
    where: (hospitals, { eq }) => eq(hospitals.id, id),
    with: {
      hospitalSpecialties: {
        with: {
          specialty: true,
        },
      },
      doctorSessions: {
        where: (sessions, { eq }) => eq(sessions.isActive, true),
        with: {
          doctor: {
            with: {
              specialty: true,
            },
          },
        },
      },
    },
  });
}

export async function getDoctors() {
  return await db.query.doctors.findMany({
    where: (doctors, { eq }) => eq(doctors.isAvailable, true),
    with: {
      specialty: true,
      sessions: {
        where: (sessions, { eq }) => eq(sessions.isActive, true),
        with: {
          hospital: true,
        },
      },
    },
  });
}

export async function getDoctorById(id) {
  return await db.query.doctors.findFirst({
    where: (doctors, { eq }) => eq(doctors.id, id),
    with: {
      specialty: true,
      sessions: {
        where: (sessions, { eq }) => eq(sessions.isActive, true),
        with: {
          hospital: true,
        },
      },
      reviews: {
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: (reviews, { desc }) => desc(reviews.createdAt),
        limit: 10,
      },
    },
  });
}

export async function getUserAppointments(userId) {
  return await db.query.appointments.findMany({
    where: (appointments, { eq }) => eq(appointments.userId, userId),
    with: {
      doctor: {
        with: {
          specialty: true,
        },
      },
      hospital: true,
      session: true,
      payments: true,
      medicalRecord: true,
    },
    orderBy: (appointments, { desc }) => desc(appointments.appointmentDate),
  });
}

export async function getUserPaymentMethods(userId) {
  return await db.query.paymentMethods.findMany({
    where: (paymentMethods, { and, eq }) =>
      and(eq(paymentMethods.userId, userId), eq(paymentMethods.isActive, true)),
    orderBy: (paymentMethods, { desc, asc }) => [
      desc(paymentMethods.isDefault),
      asc(paymentMethods.createdAt),
    ],
  });
}

export async function getPaymentById(id) {
  return await db.query.payments.findFirst({
    where: (payments, { eq }) => eq(payments.id, id),
    with: {
      appointment: {
        with: {
          doctor: true,
          hospital: true,
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      paymentMethod: true,
      receipt: true,
    },
  });
}
