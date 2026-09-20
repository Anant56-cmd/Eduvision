import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Quiz extends Model {
  public id!: number;
  public course_id!: number;
  public title!: string;
}

Quiz.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Quiz',
  }
);

export default Quiz;
