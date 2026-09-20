import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Result extends Model {
  public id!: number;
  public user_id!: number;
  public quiz_id!: number;
  public score!: number;
}

Result.init(
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
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Result',
  }
);

export default Result;
