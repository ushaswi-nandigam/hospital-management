import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('🔍 Testing MongoDB Connection...\n');
console.log(`📍 URI: ${uri.substring(0, 60)}...`);
console.log(`🔐 User: ushaswinandigam_db_user`);
console.log(`📊 Database: hospital_management\n`);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
});

async function testConnection() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Get admin for command testing
    const admin = client.db('admin');
    const response = await admin.command({ ping: 1 });
    console.log('✅ Ping successful:', response);

    // List databases
    const databases = await admin.listDatabases();
    console.log('\n📚 Databases on server:');
    databases.databases.forEach(db => console.log(`   - ${db.name}`));

    // Create/Access hospital_management db
    const db = client.db('hospital_management');
    console.log('\n📝 Creating collections...');
    
    // Create a test collection
    await db.collection('users').insertOne({
      test: true,
      created_at: new Date(),
    });
    console.log('✅ Test insert successful');

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections in hospital_management:');
    collections.forEach(col => console.log(`   - ${col.name}`));

    console.log('\n✅ All tests passed! MongoDB is working correctly.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify password in MongoDB Atlas matches: mongodb123');
    console.error('2. Check Network Access includes 0.0.0.0/0');
    console.error('3. Verify user permissions: Atlas admin or Read/Write to any database');
    console.error('4. Try creating a new user in MongoDB Atlas');
    console.error('5. Check if 2FA is interfering - temporarily disable for testing');
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

testConnection();
