import jwt from 'jsonwebtoken';
import { getDB } from '../db/config.js';
import { ObjectId } from 'mongodb';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireDoctorApproval = async (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    try {
      const db = getDB();
      const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });
      if (!user || user.approval_status !== 'approved') {
        return res.status(403).json({ 
          error: 'Doctor account pending approval',
          approval_status: user ? user.approval_status : 'pending'
        });
      }
    } catch (error) {
      console.error('Error in requireDoctorApproval:', error);
      return res.status(500).json({ error: 'Failed to verify doctor approval status' });
    }
  }
  next();
};

