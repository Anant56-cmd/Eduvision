import { Response } from 'express';
import { Payment, Course, Enrollment } from '../models';
import { AuthRequest } from '../middleware/auth';

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, amount, transaction_id } = req.body;
    const user_id = req.user!.id;

    // Platform earns 20% commission
    const admin_commission = amount * 0.2;
    const instructor_revenue = amount - admin_commission;

    // In a real app, you'd verify the transaction with Razorpay/Stripe here
    const payment = await Payment.create({
      user_id,
      course_id,
      amount,
      admin_commission,
      instructor_revenue,
      currency: 'INR',
      payment_status: 'completed',
      transaction_id,
    });

    // Automatically enroll the user after successful payment
    await Enrollment.create({
      user_id,
      course_id,
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Payment processing failed', error });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.findAll({
      where: { user_id: req.user!.id },
      include: [{ model: Course, as: 'course' }],
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payments', error });
  }
};

export const getInstructorRevenue = async (req: AuthRequest, res: Response) => {
  try {
    const instructor_id = req.user!.id;
    const courses = await Course.findAll({ where: { instructor_id } });
    const courseIds = courses.map(c => c.id);

    const payments = await Payment.findAll({
      where: { course_id: courseIds, payment_status: 'completed' },
      include: [{ model: Course, as: 'course' }],
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch revenue data', error });
  }
};

export const getPlatformAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const totalPayments = await Payment.findAll({
      where: { payment_status: 'completed' }
    });

    const totalRevenue = totalPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalCommission = totalPayments.reduce((acc, curr) => acc + Number(curr.admin_commission), 0);
    const totalInstructorRevenue = totalPayments.reduce((acc, curr) => acc + Number(curr.instructor_revenue), 0);

    res.json({
      totalRevenue,
      totalCommission,
      totalInstructorRevenue,
      transactionCount: totalPayments.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch platform analytics', error });
  }
};
