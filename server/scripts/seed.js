import bcrypt from 'bcryptjs';
import { connectDB, getDB, closeDB } from '../db/config.js';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding MongoDB database...');

    await connectDB();
    const db = getDB();

    // ── Clear existing data (keep admin) ──────────────────────
    const existingAdmin = await db.collection('users').findOne({ email: 'admin@hospital.com' });

    await db.collection('doctors').deleteMany({});
    await db.collection('patients').deleteMany({});
    await db.collection('appointments').deleteMany({});
    await db.collection('invoices').deleteMany({});
    await db.collection('prescriptions').deleteMany({});
    await db.collection('medical_records').deleteMany({});
    await db.collection('leave_requests').deleteMany({});

    if (!existingAdmin) {
      await db.collection('users').deleteMany({ role: 'admin' });
    }
    await db.collection('users').deleteMany({ role: { $ne: 'admin' } });
    console.log('🗑️  Cleared existing data (preserved admin)');

    // ── Hash passwords ───────────────────────────────────────
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const doctorPass = await bcrypt.hash('Doctor@123', 10);
    const patientPass = await bcrypt.hash('Patient@123', 10);

    // ══════════════════════════════════════════════════════════
    //  ADMIN
    // ══════════════════════════════════════════════════════════
    if (!existingAdmin) {
      await db.collection('users').insertOne({
        email: 'admin@hospital.com',
        password_hash: adminPass,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        phone: '+1000000000',
        approval_status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
    console.log('✅ Admin user preserved/created');

    // ══════════════════════════════════════════════════════════
    //  DOCTORS (5)
    // ══════════════════════════════════════════════════════════
    const doctors = [
      { first_name: 'Raj',    last_name: 'Patel',    email: 'doctor1@email.com',    specialization: 'Cardiology',   license: 'LIC1001', qualification: 'MD, DM Cardiology',     experience_years: 12 },
      { first_name: 'Priya',  last_name: 'Sharma',   email: 'doctor2@email.com',   specialization: 'Neurology',    license: 'LIC1002', qualification: 'MD, DM Neurology',      experience_years: 9  },
      { first_name: 'Amit',   last_name: 'Verma',    email: 'doctor3@email.com',    specialization: 'Orthopedics',  license: 'LIC1003', qualification: 'MS Orthopedics',         experience_years: 15 },
      { first_name: 'Sunita', last_name: 'Reddy',    email: 'doctor4@email.com',   specialization: 'Pediatrics',   license: 'LIC1004', qualification: 'MD Pediatrics',           experience_years: 8  },
      { first_name: 'Vikram', last_name: 'Singh',    email: 'doctor5@email.com',    specialization: 'Dermatology',  license: 'LIC1005', qualification: 'MD, DVD Dermatology',   experience_years: 10 },
    ];

    const doctorIds = [];
    for (const doc of doctors) {
      const userResult = await db.collection('users').insertOne({
        email: doc.email,
        password_hash: doctorPass,
        first_name: doc.first_name,
        last_name: doc.last_name,
        role: 'doctor',
        phone: doc.specialization === 'Cardiology' ? '+911234567801' :
               doc.specialization === 'Neurology' ? '+911234567802' :
               doc.specialization === 'Orthopedics' ? '+911234567803' :
               doc.specialization === 'Pediatrics' ? '+911234567804' : '+911234567805',
        approval_status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const doctorResult = await db.collection('doctors').insertOne({
        user_id: userResult.insertedId,
        specialization: doc.specialization,
        license_number: doc.license,
        qualification: doc.qualification,
        experience_years: doc.experience_years,
        availability_status: 'available',
        approval_status: 'approved',
        created_at: new Date(),
      });
      doctorIds.push({ userId: userResult.insertedId, doctorId: doctorResult.insertedId });
    }
    console.log(`✅ ${doctors.length} doctors created`);

    // ══════════════════════════════════════════════════════════
    //  PATIENTS (4)
    // ══════════════════════════════════════════════════════════
    const patients = [
      {
        first_name: 'Rahul',
        last_name: 'Kumar',
        email: 'patient1@email.com',
        phone: '+919876543201',
        blood_group: 'O+',
        allergies: 'Pollen, Dust',
        emergency_contact_name: 'Sita Kumar',
        emergency_contact_phone: '+919876543251',
        medical_history: 'No major illnesses. Vaccinated for COVID-19.',
      },
      {
        first_name: 'Anjali',
        last_name: 'Deshmukh',
        email: 'patient2@email.com',
        phone: '+919876543202',
        blood_group: 'A+',
        allergies: 'Penicillin, Shellfish',
        emergency_contact_name: 'Ravi Deshmukh',
        emergency_contact_phone: '+919876543252',
        medical_history: 'Asthma (controlled with inhaler). Seasonal allergies.',
      },
      {
        first_name: 'Vijay',
        last_name: 'Nair',
        email: 'patient3@email.com',
        phone: '+919876543203',
        blood_group: 'B+',
        allergies: 'None known',
        emergency_contact_name: 'Lakshmi Nair',
        emergency_contact_phone: '+919876543253',
        medical_history: 'Type 2 Diabetes (diagnosed 2022). Hypertension.',
      },
      {
        first_name: 'Neha',
        last_name: 'Gupta',
        email: 'patient4@email.com',
        phone: '+919876543204',
        blood_group: 'AB+',
        allergies: 'Latex, Sulfa drugs',
        emergency_contact_name: 'Arun Gupta',
        emergency_contact_phone: '+919876543254',
        medical_history: 'Hypothyroidism (on medication). Previous appendectomy (2019).',
      },
    ];

    const patientIds = [];
    for (const pat of patients) {
      const userResult = await db.collection('users').insertOne({
        email: pat.email,
        password_hash: patientPass,
        first_name: pat.first_name,
        last_name: pat.last_name,
        role: 'patient',
        phone: pat.phone,
        approval_status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await db.collection('patients').insertOne({
        user_id: userResult.insertedId,
        blood_group: pat.blood_group,
        allergies: pat.allergies,
        medical_history: pat.medical_history,
        emergency_contact_name: pat.emergency_contact_name,
        emergency_contact_phone: pat.emergency_contact_phone,
        created_at: new Date(),
      });
      patientIds.push(userResult.insertedId);
    }
    console.log(`✅ ${patients.length} patients created`);

    // ══════════════════════════════════════════════════════════
    //  APPOINTMENTS
    // ══════════════════════════════════════════════════════════
    const now = new Date();
    const appointmentsData = [
      { patientIdx: 0, doctorIdx: 0, date: new Date(now.getTime() - 7 * 86400000), status: 'completed', notes: 'Regular cardiac checkup', summary: 'ECG normal. BP under control. Advised to continue medication and follow up in 3 months.' },
      { patientIdx: 1, doctorIdx: 1, date: new Date(now.getTime() - 5 * 86400000), status: 'completed', notes: 'Neurological evaluation for headaches', summary: 'Migraine diagnosed. Prescribed preventive therapy. Patient advised to maintain headache diary.' },
      { patientIdx: 2, doctorIdx: 2, date: new Date(now.getTime() - 3 * 86400000), status: 'cancelled', notes: 'Knee pain consultation', cancellation_reason: 'Patient had a scheduling conflict and requested to reschedule.' },
      { patientIdx: 3, doctorIdx: 3, date: new Date(now.getTime() + 2 * 86400000), status: 'scheduled', notes: 'Annual pediatric checkup for child' },
      { patientIdx: 0, doctorIdx: 4, date: new Date(now.getTime() + 5 * 86400000), status: 'scheduled', notes: 'Skin rash consultation' },
      { patientIdx: 1, doctorIdx: 0, date: new Date(now.getTime() + 7 * 86400000), status: 'scheduled', notes: 'Follow-up cardiology appointment' },
    ];

    for (const apt of appointmentsData) {
      const patient = await db.collection('patients').findOne({ user_id: patientIds[apt.patientIdx] });
      const doctor = await db.collection('doctors').findOne({ user_id: doctorIds[apt.doctorIdx].userId });

      const doc = {
        patient_id: patient._id,
        doctor_id: doctor._id,
        appointment_date: apt.date,
        status: apt.status,
        notes: apt.notes,
        created_at: new Date(),
        updated_at: new Date(),
      };
      if (apt.summary) doc.summary = apt.summary;
      if (apt.cancellation_reason) doc.cancellation_reason = apt.cancellation_reason;

      await db.collection('appointments').insertOne(doc);
    }
    console.log(`✅ ${appointmentsData.length} appointments created`);

    // ── Summary ──────────────────────────────────────────────
    console.log('\n✅ Database seeded successfully!\n');
    console.log('📝 Credentials:');
    console.log('   Admin:   admin@hospital.com      / Admin@123');
    console.log('   Doctor:  doctor1@email.com        / Doctor@123');
    console.log('   Doctor:  doctor2@email.com        / Doctor@123');
    console.log('   Doctor:  doctor3@email.com        / Doctor@123');
    console.log('   Doctor:  doctor4@email.com        / Doctor@123');
    console.log('   Doctor:  doctor5@email.com        / Doctor@123');
    console.log('   Patient: patient1@email.com       / Patient@123');
    console.log('   Patient: patient2@email.com       / Patient@123');
    console.log('   Patient: patient3@email.com       / Patient@123');
    console.log('   Patient: patient4@email.com       / Patient@123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

seedDatabase();
