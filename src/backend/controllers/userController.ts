import { Request, Response } from 'express';
import { User, Course, Enrollment, Result, Quiz } from '../models';
import { AuthRequest } from '../middleware/auth';
import { broadcast } from '../lib/socket';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await user.save();
    broadcast('USER_UPDATED', user);
    res.json({ message: 'User role updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role', error });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    broadcast('USER_DELETED', { id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error });
  }
};

export const getStudentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    
    const enrollments = await Enrollment.findAll({
      where: { user_id },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: Course, as: 'course', attributes: ['title'] }]
    });

    const results = await Result.findAll({
      where: { user_id },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: Quiz, as: 'quiz', attributes: ['title'] }]
    });

    const activity = [
      ...enrollments.map((e: any) => ({ 
        type: 'enrollment', 
        title: `Enrolled in ${e.course?.title}`, 
        time: e.createdAt 
      })),
      ...results.map((r: any) => ({ 
        type: 'quiz', 
        title: `Completed ${r.quiz?.title} with ${r.score}%`, 
        time: r.createdAt 
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student activity', error });
  }
};

export const getSystemActivity = async (req: AuthRequest, res: Response) => {
  try {
    const recentUsers = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['name', 'createdAt']
    });

    const recentCourses = await Course.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['title', 'createdAt'],
      include: [{ model: User, as: 'instructor', attributes: ['name'] }]
    });

    const recentEnrollments = await Enrollment.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'student', attributes: ['name'] },
        { model: Course, as: 'course', attributes: ['title'] }
      ]
    });

    const activity = [
      ...recentUsers.map((u: any) => ({ user: u.name, action: 'Joined the platform', time: u.createdAt, type: 'user' })),
      ...recentCourses.map((c: any) => ({ user: c.instructor?.name || 'Instructor', action: `Created course "${c.title}"`, time: c.createdAt, type: 'course' })),
      ...recentEnrollments.map((e: any) => ({ user: e.student?.name || 'Student', action: `Enrolled in "${e.course?.title}"`, time: e.createdAt, type: 'enrollment' }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity', error });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, bank_account_no, ifsc_code, account_holder_name } = req.body;
    const user = await User.findByPk(req.user!.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (bank_account_no !== undefined) user.bank_account_no = bank_account_no;
    if (ifsc_code !== undefined) user.ifsc_code = ifsc_code;
    if (account_holder_name !== undefined) user.account_holder_name = account_holder_name;

    await user.save();
    
    // Return user without password
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });
    
    broadcast('USER_UPDATED', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error });
  }
};
