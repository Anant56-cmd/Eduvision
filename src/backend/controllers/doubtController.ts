import { Response } from 'express';
import { Doubt, DoubtReply, User, Lesson } from '../models';
import { AuthRequest } from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';
import { broadcast } from '../lib/socket.js';

export const getDoubts = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { lessonId } = req.query;
    const where: any = { course_id: courseId };
    if (lessonId) {
      where.lesson_id = lessonId;
    }

    const doubts = await Doubt.findAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar_url', 'role'] },
        { 
          model: DoubtReply, 
          as: 'replies',
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar_url', 'role'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch doubts', error });
  }
};

export const createDoubt = async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, lesson_id, title, question, timestamp_seconds } = req.body;
    const user_id = req.user!.id;

    const doubt = await Doubt.create({
      user_id,
      course_id,
      lesson_id: lesson_id || null,
      title,
      question,
      timestamp_seconds: timestamp_seconds || 0,
      upvotes: 0,
      is_resolved: false,
    });

    // Attempt AI auto-assistance for fast doubt resolution
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      let aiText = '';
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a top mentor at EduVision (industry-leading standard). A student asked a doubt:
Title: "${title}"
Question: "${question}"
Timestamp: ${timestamp_seconds ? `${Math.floor(timestamp_seconds / 60)}m ${timestamp_seconds % 60}s` : 'General'}

Provide a crystal-clear, pedagogical, step-by-step solution to help the student understand immediately. Keep it under 150 words.`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        aiText = response.text || '';
      } else {
        aiText = `Great question! When analyzing "${title}", make sure to review the core fundamentals covered in this lesson. Breaking the problem down into inputs, edge cases, and algorithmic complexity will clarify the solution.`;
      }

      if (aiText) {
        await DoubtReply.create({
          doubt_id: doubt.id,
          reply: aiText,
          is_ai_reply: true,
          is_instructor_reply: false,
        });
      }
    } catch (aiErr) {
      console.warn('AI Doubt Assistant fallback triggered:', aiErr);
    }

    const populatedDoubt = await Doubt.findByPk(doubt.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar_url', 'role'] },
        { 
          model: DoubtReply, 
          as: 'replies',
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar_url', 'role'] }]
        }
      ]
    });

    broadcast('DOUBT_CREATED', populatedDoubt);
    res.status(201).json(populatedDoubt);
  } catch (error) {
    res.status(500).json({ message: 'Failed to post doubt', error });
  }
};

export const replyDoubt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const user_id = req.user!.id;
    const is_instructor = req.user!.role === 'instructor' || req.user!.role === 'admin';

    const doubtReply = await DoubtReply.create({
      doubt_id: parseInt(id),
      user_id,
      reply,
      is_instructor_reply: is_instructor,
      is_ai_reply: false,
    });

    // Reward active mentors and peers with +10 XP
    const user = await User.findByPk(user_id);
    if (user) {
      user.xp_points = (user.xp_points || 0) + 10;
      await user.save();
    }

    const populatedReply = await DoubtReply.findByPk(doubtReply.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar_url', 'role'] }]
    });

    broadcast('DOUBT_REPLIED', { doubtId: id, reply: populatedReply });
    res.status(201).json(populatedReply);
  } catch (error) {
    res.status(500).json({ message: 'Failed to post reply', error });
  }
};

export const upvoteDoubt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doubt = await Doubt.findByPk(id);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    doubt.upvotes += 1;
    await doubt.save();

    res.json({ upvotes: doubt.upvotes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upvote', error });
  }
};

export const toggleResolveDoubt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doubt = await Doubt.findByPk(id);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    doubt.is_resolved = !doubt.is_resolved;
    await doubt.save();

    res.json({ is_resolved: doubt.is_resolved });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update doubt status', error });
  }
};
