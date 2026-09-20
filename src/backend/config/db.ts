import { Sequelize } from 'sequelize';
import path from 'path';

const db = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.cwd(), 'database.sqlite'),
  logging: false,
});

export default db;
