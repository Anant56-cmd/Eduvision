import express from 'express';
import { generateSummary, generateQuiz, askAssistant } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/summary', authenticate, generateSummary);
router.post('/quiz', authenticate, generateQuiz);
router.post('/ask', authenticate, askAssistant);

export default router;
