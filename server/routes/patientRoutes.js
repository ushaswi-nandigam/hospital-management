import express from 'express';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import {
  getPatients,
  getPatientById,
  updatePatient,
  getPatientMedicalHistory,
  getPatientAppointments
} from '../controllers/patientController.js';

const router = express.Router();

router.get('/', verifyToken, requireRole(['admin', 'doctor']), getPatients);
router.get('/:id', verifyToken, getPatientById);
router.put('/:id', verifyToken, updatePatient);
router.get('/:id/medical-history', verifyToken, getPatientMedicalHistory);
router.get('/:id/appointments', verifyToken, getPatientAppointments);

export default router;
