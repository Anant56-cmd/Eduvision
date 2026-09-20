import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Course extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public instructor_id!: number;
  public is_approved!: boolean;
  public price!: number;
  public category!: string;
  public level!: 'Beginner' | 'Intermediate' | 'Advanced';
  public thumbnail_url?: string;
  public rating!: number;
}

Course.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    instructor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'General',
    },
    level: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
      defaultValue: 'Beginner',
    },
    thumbnail_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 4.8,
    },
  },
  {
    sequelize: db,
    modelName: 'Course',
  }
);

export default Course;
