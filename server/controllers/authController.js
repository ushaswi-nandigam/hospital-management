import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../db/config.js';
import { ObjectId } from 'mongodb';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'patient', phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDB();
    
    // Check if user exists
    const userExists = await db.collection('users').findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await db.collection('users').insertOne({
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role,
      phone,
      approval_status: role === 'doctor' ? 'pending' : 'approved',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const userId = userResult.insertedId;
    const user = { id: userId, email, role, approval_status: role === 'doctor' ? 'pending' : 'approved' };

    // If registering as doctor
    if (role === 'doctor') {
      const { specialization, licenseNumber } = req.body;
      await db.collection('doctors').insertOne({
        user_id: userId,
        specialization,
        license_number: licenseNumber,
        availability_status: 'available',
        approval_status: 'pending',
        created_at: new Date(),
      });
    }

    // If registering as patient
    if (role === 'patient') {
      await db.collection('patients').insertOne({
        user_id: userId,
        created_at: new Date(),
      });
    }

    const token = jwt.sign(
      { id: userId.toString(), email, role, approval_status: role === 'doctor' ? 'pending' : 'approved' },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = getDB();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email, 
        role: user.role,
        approval_status: user.approval_status 
      },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.first_name,
        role: user.role,
        approval_status: user.approval_status,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
