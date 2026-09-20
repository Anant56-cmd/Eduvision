import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Announcement extends Model {
  public id!: number;
  public course_id?: number; // Optional: null means platform-wide
  public author_id!: number;
  public title!: string;
  public content!: string;
  public priority!: 'normal' | 'important' | 'urgent';
}

Announcement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('normal', 'important', 'urgent'),
      defaultValue: 'normal',
    },
  },
  {
    sequelize: db,
    modelName: 'Announcement',
  }
);

export default Announcement;
