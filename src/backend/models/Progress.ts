import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Progress extends Model {
  public id!: number;
  public user_id!: number;
  public course_id!: number;
  public lesson_id!: number;
  public completion_status!: boolean;
}

Progress.init(
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
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    completion_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Progress',
  }
);

export default Progress;
