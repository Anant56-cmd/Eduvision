import express from 'express';
import { createPayment, getPayments, getInstructorRevenue, getPlatformAnalytics } from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getPayments);
router.get('/revenue', authenticate, authorize(['instructor', 'admin']), getInstructorRevenue);
router.get('/analytics', authenticate, authorize(['admin']), getPlatformAnalytics);
router.post('/', authenticate, createPayment);

export default router;
