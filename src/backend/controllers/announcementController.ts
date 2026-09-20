import { Request, Response } from 'express';
import { Announcement, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { broadcast } from '../lib/socket.js';

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;
    const { Op } = await import('sequelize');
    const where: any = {};
    if (courseId) {
      where[Op.or] = [{ course_id: courseId }, { course_id: null }];
    }

    const announcements = await Announcement.findAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcements', error });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, title, content, priority } = req.body;
    const author_id = req.user!.id;

    const announcement = await Announcement.create({
      author_id,
      course_id: course_id ? parseInt(course_id) : null,
      title,
      content,
      priority: priority || 'normal',
    });

    const populated = await Announcement.findByPk(announcement.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }]
    });

    broadcast('ANNOUNCEMENT_CREATED', populated);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error });
  }
};
