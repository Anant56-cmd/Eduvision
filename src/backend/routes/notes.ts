import express from 'express';
import { getNotes, createNote, deleteNote } from '../controllers/noteController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/lesson/:lessonId', authenticate, getNotes);
router.post('/', authenticate, createNote);
router.delete('/:id', authenticate, deleteNote);

export default router;
