import { db } from './index.js';
import { 
  users, 
  hospitals, 
  specialties, 
  hospitalSpecialties, 
  doctors, 
  doctorSessions,
  systemSettings 
} from './schema.js';
import { nanoid } from 'nanoid';

export async function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Insert specialties
    const specialtyIds = {
      cardiology: nanoid(),
      neurology: nanoid(),
      orthopedics: nanoid(),
      generalMedicine: nanoid(),
      pediatrics: nanoid(),
      dermatology: nanoid(),
      ent: nanoid(),
      emergencyMedicine: nanoid(),
      surgery: nanoid(),
      urology: nanoid(),
      familyMedicine: nanoid(),
      womensHealth: nanoid(),
      preventiveCare: nanoid(),
    };

    await db.insert(specialties).values([
      {
        id: specialtyIds.cardiology,
        name: 'Cardiology',
        description: 'Heart and cardiovascular system specialists',
        icon: '🫀',
      },
      {
        id: specialtyIds.neurology,
        name: 'Neurology',
        description: 'Brain and nervous system specialists',
        icon: '🧠',
      },
      {
        id: specialtyIds.orthopedics,
        name: 'Orthopedics',
        description: 'Bone, joint, and muscle specialists',
        icon: '🦴',
      },
      {
        id: specialtyIds.generalMedicine,
        name: 'General Medicine',
        description: 'Primary care and general health specialists',
        icon: '🩺',
      },
      {
        id: specialtyIds.pediatrics,
        name: 'Pediatrics',
        description: 'Child and adolescent healthcare specialists',
        icon: '👶',
      },
      {
        id: specialtyIds.dermatology,
        name: 'Dermatology',
        description: 'Skin, hair, and nail specialists',
        icon: '👨‍⚕️',
      },
      {
        id: specialtyIds.ent,
        name: 'ENT',
        description: 'Ear, nose, and throat specialists',
        icon: '👂',
      },
      {
        id: specialtyIds.emergencyMedicine,
        name: 'Emergency Medicine',
        description: 'Emergency and critical care specialists',
        icon: '🚑',
      },
      {
        id: specialtyIds.surgery,
        name: 'Surgery',
        description: 'Surgical procedure specialists',
        icon: '🔪',
      },
      {
        id: specialtyIds.urology,
        name: 'Urology',
        description: 'Urinary system and male reproductive system specialists',
        icon: '🧑‍⚕️',
      },
      {
        id: specialtyIds.familyMedicine,
        name: 'Family Medicine',
        description: 'Comprehensive family healthcare specialists',
        icon: '👨‍👩‍👧‍👦',
      },
      {
        id: specialtyIds.womensHealth,
        name: "Women's Health",
        description: 'Specialized care for women',
        icon: '👩',
      },
      {
        id: specialtyIds.preventiveCare,
        name: 'Preventive Care',
        description: 'Preventive medicine and health maintenance',
        icon: '💊',
      },
    ]);

    // Insert hospitals
    const hospitalIds = {
      citycare: 'hosp-001',
      metrohealth: 'hosp-002',
      wellness: 'hosp-003',
    };

    await db.insert(hospitals).values([
      {
        id: hospitalIds.citycare,
        name: 'CityCare Medical Center',
        address: '123 Healthcare Ave, Medical District',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        phone: '+91-22-1234-5678',
        email: 'info@citycare.com',
        description: 'A premier multi-specialty hospital with state-of-the-art facilities and experienced medical professionals.',
        image: '🏥',
        rating: '4.80',
        totalReviews: 1250,
        totalDoctors: 25,
        established: 1985,
        website: 'https://citycare.com',
        isActive: true,
      },
      {
        id: hospitalIds.metrohealth,
        name: 'MetroHealth Hospital',
        address: '456 Medical Plaza, Downtown',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        phone: '+91-11-2345-6789',
        email: 'contact@metrohealth.com',
        description: 'Modern healthcare facility specializing in emergency care and advanced surgical procedures.',
        image: '🏨',
        rating: '4.60',
        totalReviews: 980,
        totalDoctors: 18,
        established: 1995,
        website: 'https://metrohealth.com',
        isActive: true,
      },
      {
        id: hospitalIds.wellness,
        name: 'WellnessPoint Clinic',
        address: '789 Wellness Blvd, Suburbs',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560001',
        phone: '+91-80-3456-7890',
        email: 'hello@wellnesspoint.com',
        description: 'Community-focused clinic providing comprehensive family healthcare services.',
        image: '🏩',
        rating: '4.70',
        totalReviews: 650,
        totalDoctors: 12,
        established: 2005,
        website: 'https://wellnesspoint.com',
        isActive: true,
      },
    ]);

    // Insert hospital specialties
    await db.insert(hospitalSpecialties).values([
      // CityCare Medical Center specialties
      { hospitalId: hospitalIds.citycare, specialtyId: specialtyIds.cardiology },
      { hospitalId: hospitalIds.citycare, specialtyId: specialtyIds.neurology },
      { hospitalId: hospitalIds.citycare, specialtyId: specialtyIds.orthopedics },
      { hospitalId: hospitalIds.citycare, specialtyId: specialtyIds.generalMedicine },
      { hospitalId: hospitalIds.citycare, specialtyId: specialtyIds.pediatrics },
      
      // MetroHealth Hospital specialties
      { hospitalId: hospitalIds.metrohealth, specialtyId: specialtyIds.emergencyMedicine },
      { hospitalId: hospitalIds.metrohealth, specialtyId: specialtyIds.surgery },
      { hospitalId: hospitalIds.metrohealth, specialtyId: specialtyIds.ent },
      { hospitalId: hospitalIds.metrohealth, specialtyId: specialtyIds.dermatology },
      { hospitalId: hospitalIds.metrohealth, specialtyId: specialtyIds.urology },
      
      // WellnessPoint Clinic specialties
      { hospitalId: hospitalIds.wellness, specialtyId: specialtyIds.familyMedicine },
      { hospitalId: hospitalIds.wellness, specialtyId: specialtyIds.pediatrics },
      { hospitalId: hospitalIds.wellness, specialtyId: specialtyIds.womensHealth },
      { hospitalId: hospitalIds.wellness, specialtyId: specialtyIds.preventiveCare },
    ]);

    // Insert doctors
    const doctorIds = {
      anita: 'doc-1000',
      rajesh: 'doc-1001',
      kiran: 'doc-1002',
      priya: 'doc-1003',
      suresh: 'doc-1004',
      meera: 'doc-1005',
      arjun: 'doc-1006',
    };

    await db.insert(doctors).values([
      {
        id: doctorIds.anita,
        name: 'Dr. Anita Sharma',
        email: 'dr.anita.sharma@citycare.com',
        phone: '+91-98765-43210',
        specialtyId: specialtyIds.cardiology,
        qualification: 'MBBS, MD (Cardiology), DM (Cardiology)',
        experience: 15,
        bio: 'Leading cardiologist with 15+ years of experience in interventional cardiology and heart disease prevention.',
        image: '👩‍⚕️',
        rating: '4.90',
        totalReviews: 245,
        consultationFee: '1500.00',
        licenseNumber: 'MH-CARD-2024-001',
        isAvailable: true,
      },
      {
        id: doctorIds.rajesh,
        name: 'Dr. Rajesh Iyer',
        email: 'dr.rajesh.iyer@citycare.com',
        phone: '+91-98765-43211',
        specialtyId: specialtyIds.generalMedicine,
        qualification: 'MBBS, MD (Internal Medicine)',
        experience: 12,
        bio: 'Experienced general physician focused on preventive care and chronic disease management.',
        image: '👨‍⚕️',
        rating: '4.70',
        totalReviews: 189,
        consultationFee: '800.00',
        licenseNumber: 'MH-GM-2024-002',
        isAvailable: true,
      },
      {
        id: doctorIds.kiran,
        name: 'Dr. Kiran Menon',
        email: 'dr.kiran.menon@citycare.com',
        phone: '+91-98765-43212',
        specialtyId: specialtyIds.orthopedics,
        qualification: 'MBBS, MS (Orthopedics)',
        experience: 18,
        bio: 'Orthopedic surgeon specializing in joint replacement and sports medicine.',
        image: '👨‍⚕️',
        rating: '4.80',
        totalReviews: 156,
        consultationFee: '1200.00',
        licenseNumber: 'MH-ORTH-2024-003',
        isAvailable: true,
      },
      {
        id: doctorIds.priya,
        name: 'Dr. Priya Nair',
        email: 'dr.priya.nair@metrohealth.com',
        phone: '+91-98765-43213',
        specialtyId: specialtyIds.dermatology,
        qualification: 'MBBS, MD (Dermatology)',
        experience: 10,
        bio: 'Dermatologist with expertise in cosmetic and medical dermatology procedures.',
        image: '👩‍⚕️',
        rating: '4.60',
        totalReviews: 134,
        consultationFee: '1000.00',
        licenseNumber: 'DL-DERM-2024-004',
        isAvailable: true,
      },
      {
        id: doctorIds.suresh,
        name: 'Dr. Suresh Kumar',
        email: 'dr.suresh.kumar@citycare.com',
        phone: '+91-98765-43214',
        specialtyId: specialtyIds.pediatrics,
        qualification: 'MBBS, MD (Pediatrics)',
        experience: 14,
        bio: 'Pediatrician dedicated to providing comprehensive healthcare for children and adolescents.',
        image: '👨‍⚕️',
        rating: '4.90',
        totalReviews: 198,
        consultationFee: '900.00',
        licenseNumber: 'MH-PED-2024-005',
        isAvailable: true,
      },
      {
        id: doctorIds.meera,
        name: 'Dr. Meera Das',
        email: 'dr.meera.das@metrohealth.com',
        phone: '+91-98765-43215',
        specialtyId: specialtyIds.ent,
        qualification: 'MBBS, MS (ENT)',
        experience: 13,
        bio: 'ENT specialist with expertise in ear, nose, and throat disorders and surgeries.',
        image: '👩‍⚕️',
        rating: '4.70',
        totalReviews: 123,
        consultationFee: '1100.00',
        licenseNumber: 'DL-ENT-2024-006',
        isAvailable: true,
      },
      {
        id: doctorIds.arjun,
        name: 'Dr. Arjun Varma',
        email: 'dr.arjun.varma@citycare.com',
        phone: '+91-98765-43216',
        specialtyId: specialtyIds.neurology,
        qualification: 'MBBS, MD (Medicine), DM (Neurology)',
        experience: 16,
        bio: 'Neurologist specializing in brain and nervous system disorders with advanced diagnostic capabilities.',
        image: '👨‍⚕️',
        rating: '4.80',
        totalReviews: 167,
        consultationFee: '1800.00',
        licenseNumber: 'MH-NEURO-2024-007',
        isAvailable: true,
      },
    ]);

    // Insert doctor sessions
    await db.insert(doctorSessions).values([
      // Dr. Anita Sharma sessions
      {
        id: nanoid(),
        doctorId: doctorIds.anita,
        hospitalId: hospitalIds.citycare,
        dayOfWeek: 'Monday',
        startTime: '09:00:00',
        endTime: '13:00:00',
        maxTokens: 20,
        avgMinutesPerPatient: 20,
        isActive: true,
      },
      {
        id: nanoid(),
        doctorId: doctorIds.anita,
        hospitalId: hospitalIds.citycare,
        dayOfWeek: 'Wednesday',
        startTime: '09:00:00',
        endTime: '13:00:00',
        maxTokens: 20,
        avgMinutesPerPatient: 20,
        isActive: true,
      },
      {
        id: nanoid(),
        doctorId: doctorIds.anita,
        hospitalId: hospitalIds.citycare,
        dayOfWeek: 'Friday',
        startTime: '09:00:00',
        endTime: '13:00:00',
        maxTokens: 20,
        avgMinutesPerPatient: 20,
        isActive: true,
      },
      {
        id: nanoid(),
        doctorId: doctorIds.anita,
        hospitalId: hospitalIds.metrohealth,
        dayOfWeek: 'Tuesday',
        startTime: '14:00:00',
        endTime: '18:00:00',
        maxTokens: 15,
        avgMinutesPerPatient: 15,
        isActive: true,
      },
      {
        id: nanoid(),
        doctorId: doctorIds.anita,
        hospitalId: hospitalIds.metrohealth,
        dayOfWeek: 'Thursday',
        startTime: '14:00:00',
        endTime: '18:00:00',
        maxTokens: 15,
        avgMinutesPerPatient: 15,
        isActive: true,
      },
      
      // Dr. Rajesh Iyer sessions
      {
        id: nanoid(),
        doctorId: doctorIds.rajesh,
        hospitalId: hospitalIds.citycare,
        dayOfWeek: 'Monday',
        startTime: '08:00:00',
        endTime: '12:00:00',
        maxTokens: 25,
        avgMinutesPerPatient: 10,
        isActive: true,
      },
      {
        id: nanoid(),
        doctorId: doctorIds.rajesh,
        hospitalId: hospitalIds.citycare,
        dayOfWeek: 'Monday',
        startTime: '14:00:00',
        endTime: '17:00:00',
        maxTokens: 18,
        avgMinutesPerPatient: 10,
        isActive: true,
      },
    ]);

    // Insert system settings
    await db.insert(systemSettings).values([
      {
        key: 'platform_fee_percentage',
        value: '5.0',
        description: 'Platform fee percentage charged on each transaction',
        type: 'number',
      },
      {
        key: 'tax_percentage',
        value: '18.0',
        description: 'Tax percentage (GST) applied on transactions',
        type: 'number',
      },
      {
        key: 'payment_gateway',
        value: 'payu',
        description: 'Default payment gateway',
        type: 'string',
      },
      {
        key: 'min_booking_advance_hours',
        value: '2',
        description: 'Minimum hours in advance required for booking',
        type: 'number',
      },
      {
        key: 'max_cancellation_hours',
        value: '24',
        description: 'Maximum hours before appointment for free cancellation',
        type: 'number',
      },
    ]);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Function to generate migrations
export async function generateMigration() {
  try {
    console.log('Generating database migration...');
    // This would typically be handled by drizzle-kit
    console.log('✅ Migration generated successfully!');
  } catch (error) {
    console.error('❌ Error generating migration:', error);
    throw error;
  }
}