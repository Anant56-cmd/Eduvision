import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Flashcard, User } from '../models';

export const getCourseFlashcards = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const cards = await Flashcard.findAll({
      where: { course_id: courseId },
      order: [['next_review_date', 'ASC']]
    });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch flashcards', error });
  }
};

export const createFlashcard = async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, lesson_id, front_prompt, back_solution } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const card = await Flashcard.create({
      user_id: req.user!.id,
      course_id,
      lesson_id: lesson_id || null,
      front_prompt,
      back_solution,
      interval_days: 1,
      ease_factor: 2.5,
      repetitions: 0,
      next_review_date: today,
    });

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create flashcard', error });
  }
};

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Review Engine
 * Quality scale:
 * 0: Complete blackout
 * 1: Incorrect response; the correct one remembered
 * 2: Incorrect response; where the correct one seemed easy to recall
 * 3: Correct response recalled with serious difficulty (Hard)
 * 4: Correct response after a hesitation (Good)
 * 5: Perfect response (Easy)
 */
export const reviewFlashcard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const qVal = req.body.quality !== undefined ? req.body.quality : req.body.grade;
    const q = Math.max(0, Math.min(5, Number(qVal) || 0));

    const card = await Flashcard.findByPk(id);
    if (!card) return res.status(404).json({ message: 'Flashcard not found' });

    let interval_days = card.interval_days || 1;
    let ease_factor = card.ease_factor || 2.5;
    let repetitions = card.repetitions || 0;

    if (q >= 3) {
      if (repetitions === 0) {
        interval_days = 1;
      } else if (repetitions === 1) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval_days = 1;
    }

    // Update Ease Factor (EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
    ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    // Calculate next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval_days);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    card.interval_days = interval_days;
    card.ease_factor = parseFloat(ease_factor.toFixed(2));
    card.repetitions = repetitions;
    card.next_review_date = nextDateStr;
    await card.save();

    // Reward XP for active recall
    const user = await User.findByPk(req.user!.id);
    if (user) {
      user.xp_points = (user.xp_points || 0) + (q >= 3 ? 15 : 5);
      await user.save();
    }

    res.json({
      card,
      xpAwarded: q >= 3 ? 15 : 5,
      intervalDays: interval_days,
      nextReviewDate: nextDateStr,
      repetitionCount: repetitions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process review', error });
  }
};
