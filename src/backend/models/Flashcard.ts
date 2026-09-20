import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

export class Flashcard extends Model {
  public id!: number;
  public user_id!: number;
  public course_id!: number;
  public lesson_id!: number | null;
  public front_prompt!: string;
  public back_solution!: string;
  public interval_days!: number;
  public ease_factor!: number;
  public repetitions!: number;
  public next_review_date!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Flashcard.init(
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
    front_prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    back_solution: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    interval_days: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    ease_factor: {
      type: DataTypes.FLOAT,
      defaultValue: 2.5,
    },
    repetitions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    next_review_date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: 'flashcards',
  }
);
