import User from './User';
import Course from './Course';
import Lesson from './Lesson';
import Enrollment from './Enrollment';
import Quiz from './Quiz';
import Question from './Question';
import Result from './Result';
import Progress from './Progress';
import Payment from './Payment';

// User - Course (Instructor)
User.hasMany(Course, { foreignKey: 'instructor_id', as: 'instructedCourses' });
Course.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

// Course - Lesson
Course.hasMany(Lesson, { foreignKey: 'course_id', as: 'lessons' });
Lesson.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// User - Enrollment - Course
User.hasMany(Enrollment, { foreignKey: 'user_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'user_id', as: 'student' });
Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Course - Quiz
Course.hasMany(Quiz, { foreignKey: 'course_id', as: 'quizzes' });
Quiz.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Quiz - Question
Quiz.hasMany(Question, { foreignKey: 'quiz_id', as: 'questions' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// User - Result - Quiz
User.hasMany(Result, { foreignKey: 'user_id', as: 'results' });
Result.belongsTo(User, { foreignKey: 'user_id', as: 'student' });
Quiz.hasMany(Result, { foreignKey: 'quiz_id', as: 'results' });
Result.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// User - Progress - Course/Lesson
User.hasMany(Progress, { foreignKey: 'user_id', as: 'progressRecords' });
Progress.belongsTo(User, { foreignKey: 'user_id', as: 'student' });
Course.hasMany(Progress, { foreignKey: 'course_id', as: 'progressRecords' });
Progress.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Lesson.hasMany(Progress, { foreignKey: 'lesson_id', as: 'progressRecords' });
Progress.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// User - Payment - Course
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Course.hasMany(Payment, { foreignKey: 'course_id', as: 'payments' });
Payment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

import Doubt from './Doubt';
import DoubtReply from './DoubtReply';
import Note from './Note';
import Announcement from './Announcement';
import { Flashcard } from './Flashcard';

// User - Doubt - Course / Lesson
User.hasMany(Doubt, { foreignKey: 'user_id', as: 'doubts' });
Doubt.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
Course.hasMany(Doubt, { foreignKey: 'course_id', as: 'doubts' });
Doubt.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Lesson.hasMany(Doubt, { foreignKey: 'lesson_id', as: 'doubts' });
Doubt.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// Doubt - DoubtReply
Doubt.hasMany(DoubtReply, { foreignKey: 'doubt_id', as: 'replies' });
DoubtReply.belongsTo(Doubt, { foreignKey: 'doubt_id', as: 'doubt' });
User.hasMany(DoubtReply, { foreignKey: 'user_id', as: 'doubtReplies' });
DoubtReply.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// User - Note - Course / Lesson
User.hasMany(Note, { foreignKey: 'user_id', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Course.hasMany(Note, { foreignKey: 'course_id', as: 'notes' });
Note.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Lesson.hasMany(Note, { foreignKey: 'lesson_id', as: 'notes' });
Note.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// User/Course - Announcement
User.hasMany(Announcement, { foreignKey: 'author_id', as: 'announcements' });
Announcement.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
Course.hasMany(Announcement, { foreignKey: 'course_id', as: 'announcements' });
Announcement.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Flashcard associations
User.hasMany(Flashcard, { foreignKey: 'user_id', as: 'flashcards' });
Flashcard.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Course.hasMany(Flashcard, { foreignKey: 'course_id', as: 'flashcards' });
Flashcard.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Lesson.hasMany(Flashcard, { foreignKey: 'lesson_id', as: 'flashcards' });
Flashcard.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

import LiveMessage from './LiveMessage';

// LiveMessage associations
Lesson.hasMany(LiveMessage, { foreignKey: 'lesson_id', as: 'liveMessages' });
LiveMessage.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });
User.hasMany(LiveMessage, { foreignKey: 'user_id', as: 'liveMessages' });
LiveMessage.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

export {
  User,
  Course,
  Lesson,
  Enrollment,
  Quiz,
  Question,
  Result,
  Progress,
  Payment,
  Doubt,
  DoubtReply,
  Note,
  Announcement,
  Flashcard,
  LiveMessage,
};
