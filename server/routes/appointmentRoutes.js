import express from 'express';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import {
  getAppointments,
  getAppointmentById,
  bookAppointment,
  updateAppointmentStatus,
  cancelAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/', verifyToken, getAppointments);
router.get('/:id', verifyToken, getAppointmentById);
router.post('/', verifyToken, requireRole(['patient']), bookAppointment);
router.put('/:id/status', verifyToken, requireRole(['doctor', 'admin']), updateAppointmentStatus);
router.delete('/:id', verifyToken, cancelAppointment);

export default router;
