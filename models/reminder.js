//DATABASE MODEL

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const Reminder = sequelize.define('Reminder', {
  chat_id: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  time: { type: DataTypes.DATE, allowNull: false },
});

sequelize.sync();

module.exports = { sequelize, Reminder };
