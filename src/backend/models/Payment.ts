import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Payment extends Model {
  public id!: number;
  public user_id!: number;
  public course_id!: number;
  public amount!: number;
  public admin_commission!: number;
  public instructor_revenue!: number;
  public currency!: string;
  public payment_status!: string; // 'pending', 'completed', 'failed'
  public transaction_id!: string;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    admin_commission: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    instructor_revenue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'INR',
    },
    payment_status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Payment',
  }
);

export default Payment;
