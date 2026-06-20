import express from 'express';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import {
  applyLeave,
  getPendingLeaveRequests,
  getMyLeaveRequests,
  approveLeaveRequest,
  getAllLeaveRequests,
} from '../controllers/leaveController.js';

const router = express.Router();

router.post('/apply', verifyToken, requireRole(['doctor']), applyLeave);
router.get('/pending', verifyToken, requireRole(['admin']), getPendingLeaveRequests);
router.get('/my', verifyToken, requireRole(['doctor']), getMyLeaveRequests);
router.get('/all', verifyToken, requireRole(['admin']), getAllLeaveRequests);
router.put('/:id/approve', verifyToken, requireRole(['admin']), approveLeaveRequest);

export default router;
