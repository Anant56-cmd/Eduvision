import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Security check: NEVER allow registering as admin via public endpoint
    const safeRole = role === 'instructor' ? 'instructor' : 'student';

    const hashedPassword = await bcrypt.hash(password, 10);
    const today = new Date().toISOString().split('T')[0];
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: safeRole,
      streak_count: 1,
      last_active_date: today,
      xp_points: 100,
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak_count: user.streak_count,
        xp_points: user.xp_points,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) {
      if (cleanEmail === 'instructor@eduvision.com') {
        user = await User.findOne({ where: { email: 'ashis@nova.com' } });
      } else if (cleanEmail === 'admin@eduvision.com') {
        user = await User.findOne({ where: { email: 'admin@nova.com' } });
      } else if (cleanEmail === 'student@eduvision.com') {
        user = await User.findOne({ where: { email: 'student@edustream.com' } });
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Daily streak calculation
    const today = new Date().toISOString().split('T')[0];
    if (user.last_active_date) {
      const lastDate = new Date(user.last_active_date);
      const currentDate = new Date(today);
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays === 1) {
        user.streak_count += 1;
        user.xp_points += 20; // Daily streak bonus
      } else if (diffDays > 1) {
        user.streak_count = 1;
      }
    } else {
      user.streak_count = 1;
    }
    user.last_active_date = today;
    await user.save();

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        streak_count: user.streak_count,
        xp_points: user.xp_points,
        avatar_url: user.avatar_url,
        bio: user.bio,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
};
