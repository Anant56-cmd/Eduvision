import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getLeaderboard } from '../controllers/leaderboardController';

const router = Router();

router.get('/', authenticate, getLeaderboard);

export default router;
