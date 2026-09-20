import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCourseFlashcards,
  createFlashcard,
  reviewFlashcard,
} from '../controllers/flashcardController';

const router = Router();

router.get('/course/:courseId', authenticate, getCourseFlashcards);
router.post('/', authenticate, createFlashcard);
router.post('/:id/review', authenticate, reviewFlashcard);

export default router;
