import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getChallenges, executeCode } from '../controllers/codeLabController';

const router = Router();

router.get('/challenges', getChallenges);
router.post('/execute', authenticate, executeCode);

export default router;
