import { Response } from 'express';
import { Quiz, Question, Result, User } from '../models';
import { AuthRequest } from '../middleware/auth';

export const createQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, title, questions } = req.body;
    const quiz = await Quiz.create({ course_id, title });
    
    if (questions && questions.length > 0) {
      const questionsData = questions.map((q: any) => ({
        quiz_id: quiz.id,
        question: q.question,
        options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
        answer: q.answer,
      }));
      await Question.bulkCreate(questionsData);
    }
    
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create quiz', error });
  }
};

export const getQuizByCourse = async (req: AuthRequest, res: Response) => {
  try {
    const quizzes = await Quiz.findAll({
      where: { course_id: req.params.courseId },
      include: [{ model: Question, as: 'questions' }],
    });

    const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'instructor';
    const sanitizedQuizzes = quizzes.map(quiz => {
      const plain = (quiz as any).toJSON();
      if (!isPrivileged) {
        plain.questions = plain.questions.map((q: any) => {
          const { answer, ...rest } = q;
          return rest;
        });
      }
      return plain;
    });

    res.json(sanitizedQuizzes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error });
  }
};

export const getQuizById = async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [{ model: Question, as: 'questions' }],
    });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'instructor';
    const plain = (quiz as any).toJSON();
    if (!isPrivileged) {
      plain.questions = plain.questions.map((q: any) => {
        const { answer, ...rest } = q;
        return rest;
      });
    }

    res.json(plain);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz', error });
  }
};

export const submitQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { quizId, answers, timeTakenSeconds } = req.body;
    const questions = await Question.findAll({ where: { quiz_id: quizId } });
    
    if (questions.length === 0) {
      return res.status(400).json({ message: 'This quiz has no questions' });
    }

    let correctCount = 0;
    const breakdown = questions.map(q => {
      const selected = answers[q.id];
      const isCorrect = selected === q.answer;
      if (isCorrect) correctCount++;
      return {
        id: q.id,
        question: q.question,
        options: JSON.parse(q.options),
        selectedAnswer: selected || null,
        correctAnswer: q.answer,
        isCorrect
      };
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    // Save or update Result (allows retaking to improve score)
    let result = await Result.findOne({
      where: { user_id: req.user!.id, quiz_id: quizId }
    });

    if (result) {
      result.score = scorePercentage;
      await result.save();
    } else {
      result = await Result.create({
        user_id: req.user!.id,
        quiz_id: quizId,
        score: scorePercentage,
      });
    }

    // Award XP
    const user = await User.findByPk(req.user!.id);
    if (user) {
      const earnedXp = scorePercentage >= 70 ? 50 : 20;
      user.xp_points = (user.xp_points || 0) + earnedXp;
      await user.save();
    }

    res.json({
      result,
      score: scorePercentage,
      totalQuestions: questions.length,
      correctCount,
      timeTakenSeconds: timeTakenSeconds || 0,
      breakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit quiz', error });
  }
};

export const getUserResults = async (req: AuthRequest, res: Response) => {
  try {
    const results = await Result.findAll({
      where: { user_id: req.user!.id },
      include: [{ model: Quiz, as: 'quiz' }],
      order: [['updatedAt', 'DESC']]
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch results', error });
  }
};
