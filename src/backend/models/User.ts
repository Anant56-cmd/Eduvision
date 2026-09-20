import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'student' | 'instructor' | 'admin';
  public bank_account_no?: string;
  public ifsc_code?: string;
  public account_holder_name?: string;
  public streak_count!: number;
  public last_active_date?: string;
  public xp_points!: number;
  public avatar_url?: string;
  public bio?: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'instructor', 'admin'),
      defaultValue: 'student',
    },
    bank_account_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ifsc_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    account_holder_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    streak_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    last_active_date: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    xp_points: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'User',
  }
);

export default User;
