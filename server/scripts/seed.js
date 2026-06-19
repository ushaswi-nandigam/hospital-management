import bcrypt from 'bcryptjs';
import { connectDB, getDB, closeDB } from '../db/config.js';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding MongoDB database...');

    await connectDB();
    const db = getDB();

    // ── Clear existing data ──────────────────────────────────
    await db.collection('users').deleteMany({});
    await db.collection('doctors').deleteMany({});
    await db.collection('patients').deleteMany({});
    await db.collection('appointments').deleteMany({});
    await db.collection('invoices').deleteMany({});
    await db.collection('prescriptions').deleteMany({});
    await db.collection('medical_records').deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ── Hash passwords ───────────────────────────────────────
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const doctorPass = await bcrypt.hash('Doctor@123', 10);
    const patientPass = await bcrypt.hash('Patient@123', 10);

    // ══════════════════════════════════════════════════════════
    //  ADMIN
    // ══════════════════════════════════════════════════════════
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
    console.log('✅ Admin user created');

    // ══════════════════════════════════════════════════════════
    //  DOCTORS
    // ══════════════════════════════════════════════════════════
    const doctors = [
      { first_name: 'John',    last_name: 'Smith',   email: 'john.smith@hospital.com',    specialization: 'Cardiology',   license: 'LICENSE101' },
      { first_name: 'Sarah',   last_name: 'Johnson', email: 'sarah.johnson@hospital.com', specialization: 'Neurology',    license: 'LICENSE102' },
      { first_name: 'Michael', last_name: 'Brown',   email: 'michael.brown@hospital.com', specialization: 'Orthopedics',  license: 'LICENSE103' },
      { first_name: 'Emily',   last_name: 'Davis',   email: 'emily.davis@hospital.com',   specialization: 'Pediatrics',   license: 'LICENSE104' },
      { first_name: 'Robert',  last_name: 'Wilson',  email: 'robert.wilson@hospital.com', specialization: 'Dermatology',  license: 'LICENSE105' },
    ];

    for (const doc of doctors) {
      const userResult = await db.collection('users').insertOne({
        email: doc.email,
        password_hash: doctorPass,
        first_name: doc.first_name,
        last_name: doc.last_name,
        role: 'doctor',
        phone: '',
        approval_status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await db.collection('doctors').insertOne({
        user_id: userResult.insertedId,
        specialization: doc.specialization,
        license_number: doc.license,
        qualification: 'MD, MBBS',
        experience_years: 5,
        availability_status: 'available',
        approval_status: 'approved',
        created_at: new Date(),
      });
    }
    console.log(`✅ ${doctors.length} doctors created`);

    // ══════════════════════════════════════════════════════════
    //  PATIENTS
    // ══════════════════════════════════════════════════════════
    const patients = [
      { first_name: 'Alice',    last_name: 'Thompson',  email: 'alice.thompson@gmail.com'  },
      { first_name: 'James',    last_name: 'Anderson',  email: 'james.anderson@gmail.com'  },
      { first_name: 'Olivia',   last_name: 'Martinez',  email: 'olivia.martinez@gmail.com' },
      { first_name: 'William',  last_name: 'Garcia',    email: 'william.garcia@gmail.com'  },
      { first_name: 'Sophia',   last_name: 'Rodriguez', email: 'sophia.rodriguez@gmail.com'},
      { first_name: 'Benjamin', last_name: 'Lee',       email: 'benjamin.lee@gmail.com'    },
      { first_name: 'Emma',     last_name: 'Walker',    email: 'emma.walker@gmail.com'     },
      { first_name: 'Daniel',   last_name: 'Hall',      email: 'daniel.hall@gmail.com'     },
    ];

    for (const pat of patients) {
      const userResult = await db.collection('users').insertOne({
        email: pat.email,
        password_hash: patientPass,
        first_name: pat.first_name,
        last_name: pat.last_name,
        role: 'patient',
        phone: '',
        approval_status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await db.collection('patients').insertOne({
        user_id: userResult.insertedId,
        blood_group: '',
        allergies: '',
        medical_history: '',
        created_at: new Date(),
      });
    }
    console.log(`✅ ${patients.length} patients created`);

    // ── Summary ──────────────────────────────────────────────
    console.log('\n✅ Database seeded successfully!\n');
    console.log('📝 Credentials:');
    console.log('   Admin:   admin@hospital.com       / Admin@123');
    console.log('   Doctor:  john.smith@hospital.com   / Doctor@123');
    console.log('   Patient: alice.thompson@gmail.com  / Patient@123');
    console.log('   (All doctors use Doctor@123, all patients use Patient@123)');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

seedDatabase();
