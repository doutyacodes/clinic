// Script to add Government Medical College, Kottayam to the database
// Run: node scripts/add-gmc-kottayam.js

import { db } from '../lib/db/index.js';
import { hospitals, specialties, doctors, doctorSessions, hospitalSpecialties } from '../lib/db/schema.js';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

const HOSPITAL_ID = 'gmc-kottayam-' + nanoid(10);

// Hospital data
const hospitalData = {
  id: HOSPITAL_ID,
  name: 'Government Medical College, Kottayam',
  address: 'Arpookara, Gandhinagar P.O',
  city: 'Kottayam',
  state: 'Kerala',
  zipCode: '686008',
  phone: '0481-2597005',
  email: 'principal@gmckottayam.ac.in',
  description: 'Government Medical College, Kottayam is a premier medical institution in Kerala, India. Established in 1965, it is one of the oldest and most reputable government medical colleges in the state. The institution is affiliated with Kerala University of Health Sciences and offers undergraduate (MBBS) and postgraduate medical education. GMC Kottayam is also a Regional Centre in Medical Education Technologies, providing advanced medical training and research facilities. The hospital attached to the college serves as a major healthcare center for the region, offering comprehensive medical services across multiple specialties.',
  image: 'https://kottayammedicalcollege.org/wp-content/uploads/2023/06/slide-5.jpeg',
  rating: '4.50',
  totalReviews: 0,
  totalDoctors: 0,
  established: 1965,
  website: 'https://kottayammedicalcollege.org',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Specialties to add (based on doctors' departments)
const specialtiesToAdd = [
  { id: 'spec-general-medicine', name: 'General Medicine', description: 'Internal medicine and general medical care', icon: 'Stethoscope' },
  { id: 'spec-pharmacology', name: 'Pharmacology', description: 'Study of drugs and their effects', icon: 'Pill' },
  { id: 'spec-paediatrics', name: 'Paediatrics', description: 'Medical care for infants, children, and adolescents', icon: 'Baby' },
  { id: 'spec-obstetrics-gynecology', name: 'Obstetrics & Gynaecology', description: 'Women\'s health, pregnancy, and childbirth', icon: 'Heart' },
  { id: 'spec-community-medicine', name: 'Community Medicine', description: 'Public health and preventive medicine', icon: 'Users' },
  { id: 'spec-physiology', name: 'Physiology', description: 'Study of body functions and systems', icon: 'Activity' },
];

// Doctors data from GMC Kottayam (filtered from the participant list)
const doctorsData = [
  {
    name: 'Dr. Dhanya SP',
    email: 'dr.spdhanya@gmail.com',
    phone: '9747263211',
    specialtyName: 'Pharmacology',
    qualification: 'MBBS, MD (Pharmacology)',
    experience: 12,
    bio: 'Assistant Professor in Department of Pharmacology at Government Medical College, Kottayam. Specializes in clinical pharmacology and drug therapy. Experienced in teaching medical students and conducting pharmacological research.',
    consultationFee: 500.00,
    licenseNumber: 'KMC-PHARM-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    designation: 'Assistant Professor',
  },
  {
    name: 'Dr. Jiji Mary Antony',
    email: 'jijimaryantony@yahoo.com',
    phone: '9447521855',
    specialtyName: 'Paediatrics',
    qualification: 'MBBS, MD (Paediatrics), DCH',
    experience: 15,
    bio: 'Assistant Professor in Department of Paediatrics at Government Medical College, Kottayam. Expert in child healthcare, neonatal care, and pediatric emergencies. Dedicated to providing comprehensive care for children from infancy through adolescence.',
    consultationFee: 600.00,
    licenseNumber: 'KMC-PAED-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    designation: 'Assistant Professor',
  },
  {
    name: 'Dr. Shaila S',
    email: 'dr.shailas@gmckottayam.ac.in',
    phone: '9447493080',
    specialtyName: 'Obstetrics & Gynaecology',
    qualification: 'MBBS, MD (OBG), DGO',
    experience: 20,
    bio: 'Professor in Department of Obstetrics & Gynaecology at Government Medical College, Kottayam. Highly experienced in high-risk pregnancy management, gynecological surgeries, and women\'s reproductive health. Known for compassionate patient care and excellence in teaching.',
    consultationFee: 700.00,
    licenseNumber: 'KMC-OBG-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    designation: 'Professor',
  },
  {
    name: 'Dr. Sujatha Y',
    email: 'dr.sujathay@gmckottayam.ac.in',
    phone: '9487850444',
    specialtyName: 'Obstetrics & Gynaecology',
    qualification: 'MBBS, MD (OBG), FMAS',
    experience: 22,
    bio: 'Professor in Department of Obstetrics & Gynaecology at Government Medical College, Kottayam. Expert in minimal access surgery, infertility management, and high-risk obstetrics. Committed to advancing women\'s healthcare through clinical excellence and research.',
    consultationFee: 700.00,
    licenseNumber: 'KMC-OBG-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    designation: 'Professor',
  },
  {
    name: 'Dr. Kala Kesavan',
    email: 'dr.kalakesavan@yahoo.co.in',
    phone: '9847034504',
    specialtyName: 'Pharmacology',
    qualification: 'MBBS, MD (Pharmacology)',
    experience: 18,
    bio: 'Professor in Department of Pharmacology at Government Medical College, Kottayam. Also serves as MEU (Medical Education Unit) coordinator. Extensive experience in rational drug therapy, adverse drug reaction monitoring, and pharmacovigilance. Active in medical education technology and curriculum development.',
    consultationFee: 600.00,
    licenseNumber: 'KMC-PHARM-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    designation: 'Professor',
  },
];

// Doctor sessions (sample schedules)
const sessions = [
  // Dr. Dhanya SP - Pharmacology
  { doctorEmail: 'dr.spdhanya@gmail.com', dayOfWeek: 'Monday', startTime: '09:00:00', endTime: '13:00:00', maxTokens: 40 },
  { doctorEmail: 'dr.spdhanya@gmail.com', dayOfWeek: 'Wednesday', startTime: '09:00:00', endTime: '13:00:00', maxTokens: 40 },
  { doctorEmail: 'dr.spdhanya@gmail.com', dayOfWeek: 'Friday', startTime: '14:00:00', endTime: '17:00:00', maxTokens: 30 },

  // Dr. Jiji Mary Antony - Paediatrics
  { doctorEmail: 'jijimaryantony@yahoo.com', dayOfWeek: 'Monday', startTime: '10:00:00', endTime: '14:00:00', maxTokens: 50 },
  { doctorEmail: 'jijimaryantony@yahoo.com', dayOfWeek: 'Tuesday', startTime: '10:00:00', endTime: '14:00:00', maxTokens: 50 },
  { doctorEmail: 'jijimaryantony@yahoo.com', dayOfWeek: 'Thursday', startTime: '10:00:00', endTime: '14:00:00', maxTokens: 50 },
  { doctorEmail: 'jijimaryantony@yahoo.com', dayOfWeek: 'Saturday', startTime: '09:00:00', endTime: '12:00:00', maxTokens: 35 },

  // Dr. Shaila S - OBG
  { doctorEmail: 'dr.shailas@gmckottayam.ac.in', dayOfWeek: 'Tuesday', startTime: '09:00:00', endTime: '13:00:00', maxTokens: 45 },
  { doctorEmail: 'dr.shailas@gmckottayam.ac.in', dayOfWeek: 'Thursday', startTime: '09:00:00', endTime: '13:00:00', maxTokens: 45 },
  { doctorEmail: 'dr.shailas@gmckottayam.ac.in', dayOfWeek: 'Friday', startTime: '09:00:00', endTime: '13:00:00', maxTokens: 45 },

  // Dr. Sujatha Y - OBG
  { doctorEmail: 'dr.sujathay@gmckottayam.ac.in', dayOfWeek: 'Monday', startTime: '14:00:00', endTime: '17:00:00', maxTokens: 40 },
  { doctorEmail: 'dr.sujathay@gmckottayam.ac.in', dayOfWeek: 'Wednesday', startTime: '14:00:00', endTime: '17:00:00', maxTokens: 40 },
  { doctorEmail: 'dr.sujathay@gmckottayam.ac.in', dayOfWeek: 'Saturday', startTime: '09:00:00', endTime: '12:00:00', maxTokens: 35 },

  // Dr. Kala Kesavan - Pharmacology
  { doctorEmail: 'dr.kalakesavan@yahoo.co.in', dayOfWeek: 'Tuesday', startTime: '10:00:00', endTime: '13:00:00', maxTokens: 35 },
  { doctorEmail: 'dr.kalakesavan@yahoo.co.in', dayOfWeek: 'Thursday', startTime: '14:00:00', endTime: '17:00:00', maxTokens: 35 },
  { doctorEmail: 'dr.kalakesavan@yahoo.co.in', dayOfWeek: 'Friday', startTime: '10:00:00', endTime: '13:00:00', maxTokens: 35 },
];

async function addGMCKottayam() {
  console.log('🏥 Starting to add Government Medical College, Kottayam...\n');

  try {
    // 1. Add specialties (if they don't exist)
    console.log('📚 Adding/verifying specialties...');
    const specialtyMap = {};

    for (const specialty of specialtiesToAdd) {
      const existing = await db.query.specialties.findFirst({
        where: eq(specialties.name, specialty.name),
      });

      if (existing) {
        console.log(`   ✓ Specialty "${specialty.name}" already exists`);
        specialtyMap[specialty.name] = existing.id;
      } else {
        await db.insert(specialties).values({
          id: specialty.id,
          name: specialty.name,
          description: specialty.description,
          icon: specialty.icon,
          createdAt: new Date(),
        });
        specialtyMap[specialty.name] = specialty.id;
        console.log(`   ✓ Added specialty: ${specialty.name}`);
      }
    }
    console.log('');

    // 2. Add hospital
    console.log('🏥 Adding hospital...');
    await db.insert(hospitals).values(hospitalData);
    console.log(`   ✓ Added: ${hospitalData.name}`);
    console.log(`   📍 Location: ${hospitalData.city}, ${hospitalData.state}`);
    console.log(`   📞 Phone: ${hospitalData.phone}`);
    console.log(`   🌐 Website: ${hospitalData.website}`);
    console.log('');

    // 3. Link hospital to specialties
    console.log('🔗 Linking hospital to specialties...');
    const hospitalSpecialtyData = specialtiesToAdd.map(spec => ({
      hospitalId: HOSPITAL_ID,
      specialtyId: specialtyMap[spec.name],
    }));

    await db.insert(hospitalSpecialties).values(hospitalSpecialtyData);
    console.log(`   ✓ Linked ${hospitalSpecialtyData.length} specialties to hospital`);
    console.log('');

    // 4. Add doctors
    console.log('👨‍⚕️ Adding doctors...');
    const doctorIdMap = {};
    let doctorCount = 0;

    for (const doctorInfo of doctorsData) {
      const doctorId = 'doc-' + nanoid(12);
      const specialtyId = specialtyMap[doctorInfo.specialtyName];

      await db.insert(doctors).values({
        id: doctorId,
        name: doctorInfo.name,
        email: doctorInfo.email,
        phone: doctorInfo.phone,
        specialtyId: specialtyId,
        qualification: doctorInfo.qualification,
        experience: doctorInfo.experience,
        bio: doctorInfo.bio,
        image: null,
        rating: '4.50',
        totalReviews: 0,
        consultationFee: doctorInfo.consultationFee,
        isAvailable: true,
        licenseNumber: doctorInfo.licenseNumber,
        dateOfBirth: null,
        address: hospitalData.address,
        city: hospitalData.city,
        state: hospitalData.state,
        zipCode: hospitalData.zipCode,
        bankAccount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      doctorIdMap[doctorInfo.email] = doctorId;
      doctorCount++;
      console.log(`   ✓ ${doctorInfo.name} - ${doctorInfo.specialtyName} (${doctorInfo.designation})`);
      console.log(`     Fee: ₹${doctorInfo.consultationFee} | Experience: ${doctorInfo.experience} years`);
    }
    console.log(`\n   Total doctors added: ${doctorCount}`);
    console.log('');

    // 5. Add doctor sessions
    console.log('📅 Creating doctor sessions...');
    let sessionCount = 0;

    for (const session of sessions) {
      const doctorId = doctorIdMap[session.doctorEmail];
      if (!doctorId) {
        console.log(`   ⚠ Warning: Doctor not found for email ${session.doctorEmail}`);
        continue;
      }

      const sessionId = 'sess-' + nanoid(12);
      await db.insert(doctorSessions).values({
        id: sessionId,
        doctorId: doctorId,
        hospitalId: HOSPITAL_ID,
        dayOfWeek: session.dayOfWeek,
        startTime: session.startTime,
        endTime: session.endTime,
        maxTokens: session.maxTokens,
        avgMinutesPerPatient: 15,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      sessionCount++;
      console.log(`   ✓ ${session.dayOfWeek} ${session.startTime}-${session.endTime} (${session.maxTokens} tokens)`);
    }
    console.log(`\n   Total sessions created: ${sessionCount}`);
    console.log('');

    // 6. Update hospital's total doctors
    await db.update(hospitals)
      .set({ totalDoctors: doctorCount })
      .where(eq(hospitals.id, HOSPITAL_ID));

    console.log('✅ SUCCESS! Government Medical College, Kottayam has been added to the system!\n');
    console.log('📊 Summary:');
    console.log(`   • Hospital ID: ${HOSPITAL_ID}`);
    console.log(`   • Specialties: ${specialtiesToAdd.length}`);
    console.log(`   • Doctors: ${doctorCount}`);
    console.log(`   • Sessions: ${sessionCount}`);
    console.log('\n🎉 You can now view the hospital and book appointments!\n');

  } catch (error) {
    console.error('❌ Error adding GMC Kottayam:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the script
addGMCKottayam()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
