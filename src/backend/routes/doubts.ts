import express from 'express';
import { getDoubts, createDoubt, replyDoubt, upvoteDoubt, toggleResolveDoubt } from '../controllers/doubtController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/course/:courseId', authenticate, getDoubts);
router.post('/', authenticate, createDoubt);
router.post('/:id/reply', authenticate, replyDoubt);
router.post('/:id/upvote', authenticate, upvoteDoubt);
router.post('/:id/resolve', authenticate, toggleResolveDoubt);

export default router;
