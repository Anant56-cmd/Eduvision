import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Lesson extends Model {
  public id!: number;
  public course_id!: number;
  public title!: string;
  public video_url!: string;
  public embed_code!: string;
  public content!: string;
  public duration!: string;
  public is_live!: boolean;
  public live_status!: string;
  public pinned_message!: string | null;
}

Lesson.init(
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
    video_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    embed_code: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '0:00'
    },
    is_live: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    live_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'ended', // 'live' | 'upcoming' | 'ended'
    },
    pinned_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Lesson',
  }
);

export default Lesson;
