import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, Enrollment } from '../models';

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'avatar_url', 'xp_points', 'streak_count', 'role'],
      order: [
        ['xp_points', 'DESC'],
        ['streak_count', 'DESC']
      ],
      limit: 100
    });

    const totalCount = users.length;
    const currentUserId = req.user?.id;
    let currentUserRank = -1;

    const rankedUsers = users.map((u, index) => {
      const rank = index + 1;
      if (u.id === currentUserId) {
        currentUserRank = rank;
      }

      let tier = "Rising Star";
      let tierColor = "text-slate-600 bg-slate-100";

      if (rank === 1) {
        tier = "Principal Grandmaster";
        tierColor = "text-amber-700 bg-amber-100 border-amber-300";
      } else if (rank <= 3) {
        tier = "Staff Master";
        tierColor = "text-indigo-700 bg-indigo-100 border-indigo-300";
      } else if (rank <= 10) {
        tier = "Diamond Scholar";
        tierColor = "text-cyan-700 bg-cyan-100 border-cyan-300";
      } else if (rank <= 25) {
        tier = "Emerald Prodigy";
        tierColor = "text-emerald-700 bg-emerald-100 border-emerald-300";
      }

      return {
        id: u.id,
        name: u.name,
        avatar_url: u.avatar_url,
        xp_points: u.xp_points || 0,
        streak_count: u.streak_count || 1,
        role: u.role,
        rank,
        tier,
        tierColor,
      };
    });

    res.json({
      leaderboard: rankedUsers,
      totalUsers: totalCount,
      currentUserRank: currentUserRank > 0 ? currentUserRank : rankedUsers.length + 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leaderboard', error });
  }
};
