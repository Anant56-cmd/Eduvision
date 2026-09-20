import express from 'express';
import { getAllUsers, updateUserRole, deleteUser, getSystemActivity, getStudentActivity, updateProfile } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, authorize(['admin']), getAllUsers);
router.get('/activity', authenticate, authorize(['admin']), getSystemActivity);
router.get('/student-activity', authenticate, getStudentActivity);
router.put('/profile', authenticate, updateProfile);
router.put('/:id/role', authenticate, authorize(['admin']), updateUserRole);
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);

export default router;
