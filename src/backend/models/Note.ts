import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Note extends Model {
  public id!: number;
  public user_id!: number;
  public course_id!: number;
  public lesson_id!: number;
  public timestamp_seconds!: number;
  public content!: string;
}

Note.init(
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
    timestamp_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Note',
  }
);

export default Note;
