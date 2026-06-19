import express from 'express';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getStaffSchedule,
  updateStaffSchedule,
  getSystemStatus,
  getPendingDoctors,
  approveDoctorRequest
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/dashboard', verifyToken, requireRole(['admin']), getDashboardStats);
router.get('/staff-schedule', verifyToken, requireRole(['admin']), getStaffSchedule);
router.put('/staff-schedule', verifyToken, requireRole(['admin']), updateStaffSchedule);
router.get('/system-status', verifyToken, requireRole(['admin']), getSystemStatus);
router.get('/pending-doctors', verifyToken, requireRole(['admin']), getPendingDoctors);
router.post('/approve-doctor', verifyToken, requireRole(['admin']), approveDoctorRequest);

export default router;
