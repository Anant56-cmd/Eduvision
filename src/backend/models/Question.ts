import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Question extends Model {
  public id!: number;
  public quiz_id!: number;
  public question!: string;
  public options!: string; // JSON string
  public answer!: string;
}

Question.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.TEXT, // Store as JSON string
      allowNull: false,
    },
    answer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Question',
  }
);

export default Question;
