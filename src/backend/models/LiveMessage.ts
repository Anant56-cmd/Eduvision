import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

export class LiveMessage extends Model {
  public id!: number;
  public lesson_id!: number;
  public user_id!: number;
  public message!: string;
  public is_pinned!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LiveMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: db,
    modelName: 'LiveMessage',
  }
);

export default LiveMessage;
