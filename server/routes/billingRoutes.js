import express from 'express';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  getPatientBilling
} from '../controllers/billingController.js';

const router = express.Router();

router.get('/', verifyToken, requireRole(['admin', 'doctor']), getInvoices);
router.get('/patient/:patientId', verifyToken, getPatientBilling);
router.get('/:id', verifyToken, getInvoiceById);
router.post('/', verifyToken, requireRole(['admin', 'doctor']), createInvoice);
router.put('/:id/status', verifyToken, requireRole(['admin']), updateInvoiceStatus);

export default router;
