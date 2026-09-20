import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Enrollment extends Model {
  public id!: number;
  public user_id!: number;
  public course_id!: number;
  public status!: 'pending' | 'approved' | 'rejected';
}

Enrollment.init(
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
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'approved', // Auto-approve for simplicity in demo, or keep pending
    },
  },
  {
    sequelize: db,
    modelName: 'Enrollment',
  }
);

export default Enrollment;
