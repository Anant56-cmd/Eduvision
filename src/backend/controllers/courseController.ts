import { Request, Response } from 'express';
import { Course, Lesson, Enrollment, User, Progress, Payment } from '../models';
import { AuthRequest } from '../middleware/auth';
import { broadcast } from '../lib/socket.js';

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const { search, category, level, priceType, sort } = req.query;
    const { Op } = await import('sequelize');
    const whereClause: any = { is_approved: true };
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (level && level !== 'All') {
      whereClause.level = level;
    }

    if (priceType === 'free') {
      whereClause.price = 0;
    } else if (priceType === 'paid') {
      whereClause.price = { [Op.gt]: 0 };
    }

    let order: any = [['createdAt', 'DESC']];
    if (sort === 'rating') {
      order = [['rating', 'DESC']];
    } else if (sort === 'price-low') {
      order = [['price', 'ASC']];
    } else if (sort === 'price-high') {
      order = [['price', 'DESC']];
    }

    const courses = await Course.findAll({
      where: whereClause,
      order,
      include: [
        { model: User, as: 'instructor', attributes: ['id', 'name', 'avatar_url', 'bio'] },
        { model: Lesson, as: 'lessons', attributes: ['id', 'title', 'duration'] }
      ],
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses', error });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: Lesson, as: 'lessons' },
        { model: User, as: 'instructor', attributes: ['id', 'name', 'avatar_url', 'bio'] },
      ],
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course', error });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, price, category, level, thumbnail_url } = req.body;
    const course = await Course.create({
      title,
      description,
      price: parseFloat(price) || 0,
      category: category || 'General',
      level: level || 'Beginner',
      thumbnail_url: thumbnail_url || null,
      rating: 4.9,
      instructor_id: req.user!.id,
      is_approved: req.user!.role === 'admin', // Admin courses auto-approved
    });
    broadcast('COURSE_CREATED', course);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course', error });
  }
};

export const addLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { title, video_url, embed_code, content, duration, is_live, live_status, pinned_message } = req.body;
    const course = await Course.findByPk(req.params.courseId);
    
    if (!course || (course.instructor_id !== req.user!.id && req.user!.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const lesson = await Lesson.create({
      course_id: parseInt(req.params.courseId),
      title,
      video_url,
      embed_code,
      content,
      duration: duration || '0:00',
      is_live: Boolean(is_live),
      live_status: live_status || 'ended',
      pinned_message: pinned_message || null,
    });
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add lesson', error });
  }
};

export const enrollCourse = async (req: AuthRequest, res: Response) => {
  try {
    const courseId = parseInt(req.params.id);
    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Security check: if course is paid, verify a completed payment exists
    if (course.price > 0) {
      const payment = await Payment.findOne({
        where: { user_id: req.user!.id, course_id: courseId, payment_status: 'completed' }
      });
      if (!payment) {
        return res.status(402).json({ message: 'Payment required to enroll in this course' });
      }
    }

    const existing = await Enrollment.findOne({
      where: { user_id: req.user!.id, course_id: courseId },
    });

    if (existing) return res.status(400).json({ message: 'Already enrolled' });

    const enrollment = await Enrollment.create({
      user_id: req.user!.id,
      course_id: courseId,
      status: 'approved',
    });
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ message: 'Enrollment failed', error });
  }
};

export const getEnrolledCourses = async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { user_id: req.user!.id },
      include: [
        { 
          model: Course, 
          as: 'course', 
          include: [
            { model: User, as: 'instructor', attributes: ['name'] },
            { model: Lesson, as: 'lessons', attributes: ['id'] },
            { 
              model: Progress, 
              as: 'progressRecords', 
              where: { user_id: req.user!.id },
              required: false 
            }
          ] 
        }
      ],
    });
    res.json(enrollments.map((e: any) => e.course));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrollments', error });
  }
};

export const getInstructorCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.findAll({
      where: { instructor_id: req.user!.id },
      include: [{ model: Lesson, as: 'lessons' }],
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch instructor courses', error });
  }
};

export const approveCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    course.is_approved = true;
    await course.save();
    broadcast('COURSE_APPROVED', course);
    res.json({ message: 'Course approved' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve course', error });
  }
};

export const getPendingCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.findAll({
      where: { is_approved: false },
      include: [{ model: User, as: 'instructor', attributes: ['name'] }],
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending courses', error });
  }
};

export const updateLessonProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, lessonId, completed } = req.body;
    const [progress, created] = await Progress.findOrCreate({
      where: { 
        user_id: req.user!.id, 
        course_id: courseId, 
        lesson_id: lessonId 
      },
      defaults: { completion_status: completed }
    });

    if (!created) {
      progress.completion_status = completed;
      await progress.save();
    }

    if (completed) {
      const user = await User.findByPk(req.user!.id);
      if (user) {
        user.xp_points = (user.xp_points || 0) + 15;
        await user.save();
      }
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update progress', error });
  }
};

export const getCourseProgress = async (req: AuthRequest, res: Response) => {
  try {
    const progress = await Progress.findAll({
      where: { 
        user_id: req.user!.id, 
        course_id: req.params.courseId 
      }
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch progress', error });
  }
};

export const getInstructorAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const instructor_id = req.user!.id;
    
    // Get all courses by this instructor
    const courses = await Course.findAll({
      where: { instructor_id },
      include: [
        { model: Lesson, as: 'lessons', attributes: ['id'] },
        { model: Enrollment, as: 'enrollments', attributes: ['id', 'user_id', 'createdAt'] },
        { model: Progress, as: 'progressRecords', attributes: ['id', 'user_id', 'completion_status'] }
      ]
    });

    // Calculate stats
    let totalStudents = 0;
    let totalCompletions = 0;
    const studentIds = new Set();
    const courseStats = courses.map(course => {
      const enrollments = (course as any).enrollments || [];
      const progress = (course as any).progressRecords || [];
      const lessons = (course as any).lessons || [];
      
      enrollments.forEach((e: any) => studentIds.add(e.user_id));
      totalStudents += enrollments.length;

      // Calculate completions for this course
      // A student completes a course if they have progress records for all lessons
      const studentProgress: Record<number, number> = {};
      progress.forEach((p: any) => {
        if (p.completion_status) {
          studentProgress[p.user_id] = (studentProgress[p.user_id] || 0) + 1;
        }
      });

      let courseCompletions = 0;
      if (lessons.length > 0) {
        Object.values(studentProgress).forEach(count => {
          if (count === lessons.length) courseCompletions++;
        });
      }
      totalCompletions += courseCompletions;

      return {
        id: course.id,
        title: course.title,
        students: enrollments.length,
        completions: courseCompletions
      };
    });

    // Calculate time-series data for the last 7 days
    const last7Days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days[dayName] = 0;
    }

    courses.forEach(course => {
      const enrollments = (course as any).enrollments || [];
      enrollments.forEach((e: any) => {
        const dayName = new Date(e.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        if (last7Days[dayName] !== undefined) {
          last7Days[dayName]++;
        }
      });
    });

    const timeSeriesData = Object.entries(last7Days).map(([name, students]) => ({ name, students }));

    res.json({
      totalUniqueStudents: studentIds.size,
      totalEnrollments: totalStudents,
      totalCompletions,
      courseStats,
      timeSeriesData
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Only admin or the instructor who created it can delete
    if (req.user!.role !== 'admin' && course.instructor_id !== req.user!.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await course.destroy();
    broadcast('COURSE_DELETED', { id: req.params.id });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course', error });
  }
};

export const deleteLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, id } = req.params;
    const lesson = await Lesson.findByPk(id);
    
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    
    const course = await Course.findByPk(courseId);
    if (!course || (course.instructor_id !== req.user!.id && req.user!.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await lesson.destroy();
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete lesson', error });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    if (req.user!.role !== 'admin' && course.instructor_id !== req.user!.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, description, price, category, level, thumbnail_url } = req.body;
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (price !== undefined) course.price = parseFloat(price) || 0;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (thumbnail_url !== undefined) course.thumbnail_url = thumbnail_url;

    await course.save();
    broadcast('COURSE_UPDATED', course);
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course', error });
  }
};

export const updateLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, id } = req.params;
    const lesson = await Lesson.findByPk(id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    
    const course = await Course.findByPk(courseId);
    if (!course || (course.instructor_id !== req.user!.id && req.user!.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, duration, video_url, embed_code, content, is_live, live_status, pinned_message } = req.body;
    if (title !== undefined) lesson.title = title;
    if (duration !== undefined) lesson.duration = duration;
    if (video_url !== undefined) lesson.video_url = video_url;
    if (embed_code !== undefined) lesson.embed_code = embed_code;
    if (content !== undefined) lesson.content = content;
    if (is_live !== undefined) lesson.is_live = is_live;
    if (live_status !== undefined) lesson.live_status = live_status;
    if (pinned_message !== undefined) lesson.pinned_message = pinned_message;

    await lesson.save();
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update lesson', error });
  }
};
