import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LiveMessage, Lesson, User, Course } from '../models';
import { broadcast, getLiveViewerCount } from '../lib/socket.js';

export const getLiveRoomData = async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }

    const lesson = await Lesson.findByPk(lessonId, {
      include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'instructor_id'] }]
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const messages = await LiveMessage.findAll({
      where: { lesson_id: lessonId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar_url', 'role']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: 150
    });

    res.json({
      lesson: {
        id: lesson.id,
        course_id: lesson.course_id,
        title: lesson.title,
        video_url: lesson.video_url,
        embed_code: lesson.embed_code,
        is_live: lesson.is_live,
        live_status: lesson.live_status,
        pinned_message: lesson.pinned_message,
        instructor_id: (lesson as any).course?.instructor_id
      },
      viewerCount: Math.max(1, getLiveViewerCount(lessonId)),
      messages
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch live room data', error: error.message });
  }
};

export const sendLiveMessage = async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const { message } = req.body;
    const userId = req.user!.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const liveMsg = await LiveMessage.create({
      lesson_id: lessonId,
      user_id: userId,
      message: message.trim().slice(0, 300),
      is_pinned: false
    });

    const fullMessage = await LiveMessage.findByPk(liveMsg.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar_url', 'role']
        }
      ]
    });

    // Reward +2 XP for student participation in live class
    if (req.user?.role === 'student') {
      const user = await User.findByPk(userId);
      if (user) {
        user.xp_points = (user.xp_points || 0) + 2;
        await user.save();
      }
    }

    // Broadcast instant WebSocket message
    broadcast('LIVE_CHAT_MESSAGE', {
      lessonId,
      message: fullMessage
    });

    res.status(201).json(fullMessage);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to send live message', error: error.message });
  }
};

export const pinLiveMessage = async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const { pinnedMessage } = req.body;

    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    lesson.pinned_message = pinnedMessage || null;
    await lesson.save();

    broadcast('LIVE_MESSAGE_PINNED', {
      lessonId,
      pinnedMessage: lesson.pinned_message
    });

    res.json({ success: true, pinned_message: lesson.pinned_message });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to pin message', error: error.message });
  }
};

export const updateLiveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const { is_live, live_status, video_url } = req.body;

    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (is_live !== undefined) lesson.is_live = is_live;
    if (live_status !== undefined) lesson.live_status = live_status;
    if (video_url !== undefined && video_url.trim()) lesson.video_url = video_url.trim();

    await lesson.save();

    broadcast('LIVE_STATUS_CHANGED', {
      lessonId,
      is_live: lesson.is_live,
      live_status: lesson.live_status,
      video_url: lesson.video_url
    });

    res.json(lesson);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update live status', error: error.message });
  }
};
