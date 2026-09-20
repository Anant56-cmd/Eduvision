import express from 'express';
import { createQuiz, getQuizByCourse, submitQuiz, getUserResults, getQuizById } from '../controllers/quizController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/course/:courseId', authenticate, getQuizByCourse);
router.get('/results', authenticate, getUserResults);
router.get('/:id', authenticate, getQuizById);
router.post('/', authenticate, authorize(['instructor', 'admin']), createQuiz);
router.post('/submit', authenticate, submitQuiz);

export default router;
