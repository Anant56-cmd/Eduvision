import { Response } from 'express';
import { Note } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params;
    const notes = await Note.findAll({
      where: {
        user_id: req.user!.id,
        lesson_id: lessonId,
      },
      order: [['timestamp_seconds', 'ASC']]
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes', error });
  }
};

export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, lesson_id, timestamp_seconds, content } = req.body;
    const note = await Note.create({
      user_id: req.user!.id,
      course_id,
      lesson_id,
      timestamp_seconds: timestamp_seconds || 0,
      content,
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create note', error });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findByPk(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.user_id !== req.user!.id) return res.status(403).json({ message: 'Unauthorized' });

    await note.destroy();
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete note', error });
  }
};
