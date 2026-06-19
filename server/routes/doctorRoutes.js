import express from 'express';
import { verifyToken, requireRole, requireDoctorApproval } from '../middleware/authMiddleware.js';
import {
  getDoctors,
  getDoctorById,
  getDoctorAppointments,
  updateDoctorProfile,
  createPrescription,
  getDoctorSchedule
} from '../controllers/doctorController.js';

const router = express.Router();

router.get('/', verifyToken, getDoctors);
router.get('/:id', verifyToken, getDoctorById);
router.get('/:id/appointments', verifyToken, requireRole(['doctor', 'admin']), requireDoctorApproval, getDoctorAppointments);
router.get('/:id/schedule', verifyToken, requireDoctorApproval, getDoctorSchedule);
router.put('/:id', verifyToken, requireRole(['doctor', 'admin']), requireDoctorApproval, updateDoctorProfile);
router.post('/prescription', verifyToken, requireRole(['doctor']), requireDoctorApproval, createPrescription);

export default router;
