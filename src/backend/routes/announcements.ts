import express from 'express';
import { getAnnouncements, createAnnouncement } from '../controllers/announcementController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', authenticate, authorize(['instructor', 'admin']), createAnnouncement);

export default router;
