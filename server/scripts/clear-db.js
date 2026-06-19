import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'hospital_management';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

async function clearDatabase() {
  try {
    await client.connect();
    const db = client.db(dbName);
    
    // Clear all collections
    const collections = ['users', 'doctors', 'patients', 'appointments', 'invoices', 'medical_records', 'prescriptions'];
    
    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
      console.log(`✅ Cleared ${collection} collection`);
    }
    
    console.log('\n✅ All collections cleared successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

clearDatabase();
