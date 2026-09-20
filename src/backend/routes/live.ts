import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getLiveRoomData,
  sendLiveMessage,
  pinLiveMessage,
  updateLiveStatus
} from '../controllers/liveController';

const router = express.Router();

router.get('/:lessonId/messages', authenticate, getLiveRoomData);
router.post('/:lessonId/messages', authenticate, sendLiveMessage);
router.post('/:lessonId/pin', authenticate, pinLiveMessage);
router.post('/:lessonId/status', authenticate, updateLiveStatus);

export default router;
