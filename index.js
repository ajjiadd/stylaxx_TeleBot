require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { Reminder, sequelize } = require('./models/reminder');
const cron = require('node-cron');

const app = express();
const bot = new TelegramBot(process.env.TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome! Use /add [message] [time] (YYYY-MM-DD HH:mm) to set a reminder.');
});

bot.onText(/\/add (.+) (\d{4}-\d{2}-\d{2} \d{2}:\d{2})/, async (msg, match) => {
  const chatId = msg.chat.id;
  const message = match[1];
  const time = match[2];

  try {
    await Reminder.create({ chat_id: chatId, message, time });
    bot.sendMessage(chatId, `Reminder added: "${message}" at ${time}`);
  } catch (error) {
    bot.sendMessage(chatId, 'Failed to add reminder.');
  }
});

bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;
  const reminders = await Reminder.findAll({ where: { chat_id: chatId } });

  if (reminders.length === 0) {
    bot.sendMessage(chatId, 'No reminders set.');
  } else {
    const reminderList = reminders.map(r => `${r.id}. ${r.message} - ${r.time}`).join("\n");
    bot.sendMessage(chatId, `Your Reminders:\n${reminderList}`);
  }
});

bot.onText(/\/delete (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const id = match[1];

  const deleted = await Reminder.destroy({ where: { id, chat_id: chatId } });

  if (deleted) {
    bot.sendMessage(chatId, 'Reminder deleted.');
  } else {
    bot.sendMessage(chatId, 'Reminder not found.');
  }
});

bot.onText(/\/update (\d+) (.+) (\d{4}-\d{2}-\d{2} \d{2}:\d{2})/, async (msg, match) => {
  const chatId = msg.chat.id;
  const id = match[1];
  const newMessage = match[2];
  const newTime = match[3];

  const updated = await Reminder.update(
    { message: newMessage, time: newTime },
    { where: { id, chat_id: chatId } }
  );

  if (updated[0] > 0) {
    bot.sendMessage(chatId, 'Reminder updated.');
  } else {
    bot.sendMessage(chatId, 'Reminder not found.');
  }
});

// Cron job to send reminders
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const reminders = await Reminder.findAll({ where: { time: { [Sequelize.Op.lte]: now } } });

  reminders.forEach(async (reminder) => {
    bot.sendMessage(reminder.chat_id, `Reminder: ${reminder.message}`);
    await Reminder.destroy({ where: { id: reminder.id } }); // Delete after sending
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
