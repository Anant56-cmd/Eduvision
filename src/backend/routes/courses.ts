import express from 'express';
import { 
  getAllCourses, 
  getCourseById, 
  createCourse, 
  addLesson, 
  enrollCourse, 
  getEnrolledCourses,
  getInstructorCourses,
  approveCourse,
  getPendingCourses,
  updateLessonProgress,
  getCourseProgress,
  getInstructorAnalytics,
  deleteCourse,
  deleteLesson,
  updateCourse,
  updateLesson
} from '../controllers/courseController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', getAllCourses);
router.get('/enrolled', authenticate, getEnrolledCourses);
router.get('/instructor', authenticate, authorize(['instructor', 'admin']), getInstructorCourses);
router.get('/analytics', authenticate, authorize(['instructor', 'admin']), getInstructorAnalytics);
router.get('/pending', authenticate, authorize(['admin']), getPendingCourses);
router.get('/:courseId/progress', authenticate, getCourseProgress);
router.get('/:id', getCourseById);

router.post('/', authenticate, authorize(['instructor', 'admin']), createCourse);
router.post('/progress', authenticate, updateLessonProgress);
router.post('/:courseId/lessons', authenticate, authorize(['instructor', 'admin']), addLesson);
router.post('/:id/enroll', authenticate, enrollCourse);
router.post('/:id/approve', authenticate, authorize(['admin']), approveCourse);
router.put('/:id', authenticate, authorize(['instructor', 'admin']), updateCourse);
router.put('/:courseId/lessons/:id', authenticate, authorize(['instructor', 'admin']), updateLesson);
router.delete('/:courseId/lessons/:id', authenticate, authorize(['instructor', 'admin']), deleteLesson);
router.delete('/:id', authenticate, authorize(['instructor', 'admin']), deleteCourse);

export default router;
