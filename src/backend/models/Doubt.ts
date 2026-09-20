import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Doubt extends Model {
  public id!: number;
  public user_id!: number;
  public course_id!: number;
  public lesson_id?: number;
  public title!: string;
  public question!: string;
  public timestamp_seconds?: number;
  public upvotes!: number;
  public is_resolved!: boolean;
}

Doubt.init(
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
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Doubt',
  }
);

export default Doubt;
