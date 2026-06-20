import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'hospital_management';

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
});

let db = null;

export async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      db = client.db(dbName);
      console.log('✅ Connected to MongoDB');
      await createIndexes();
    }
    return db;
  } catch (error) {
    console.error('⚠️  MongoDB connection error:', error.message);
    console.log('Attempting to continue with offline mode...');
    return null;
  }
}

export async function createIndexes() {
  try {
    const database = client.db(dbName);
    
    await database.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await database.collection('doctors').createIndex({ user_id: 1 }).catch(() => {});
    await database.collection('doctors').createIndex({ specialization: 1 }).catch(() => {});
    await database.collection('patients').createIndex({ user_id: 1 }).catch(() => {});
    await database.collection('appointments').createIndex({ patient_id: 1 }).catch(() => {});
    await database.collection('appointments').createIndex({ doctor_id: 1 }).catch(() => {});
    await database.collection('appointments').createIndex({ appointment_date: 1 }).catch(() => {});
    await database.collection('invoices').createIndex({ patient_id: 1 }).catch(() => {});
    await database.collection('invoices').createIndex({ status: 1 }).catch(() => {});
    await database.collection('medical_records').createIndex({ patient_id: 1 }).catch(() => {});
    await database.collection('leave_requests').createIndex({ doctor_id: 1 }).catch(() => {});
    await database.collection('leave_requests').createIndex({ status: 1 }).catch(() => {});
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.warn('⚠️  Index creation warning:', error.message);
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB first');
  }
  return db;
}

export async function closeDB() {
  if (client) {
    await client.close();
    db = null;
    console.log('MongoDB connection closed');
  }
}
