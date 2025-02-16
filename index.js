const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN);
const app = express();

// Middleware
app.use(bodyParser.json());

// Set Webhook URL
const WEBHOOK_URL = `https://stylaxx-telebot.onrender.com/${TOKEN}`;
bot.setWebHook(WEBHOOK_URL);

// Handle incoming messages
app.post(`/${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Bot Commands
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome! You can set reminders using /addreminder.");
});

//add
bot.onText(/\/addreminder (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const reminder = match[1];

  try {
      await pool.query("INSERT INTO reminders (chat_id, text) VALUES ($1, $2)", [chatId, reminder]);
      bot.sendMessage(chatId, `✅ Reminder added: ${reminder}`);
  } catch (error) {
      console.error("Database error:", error);
      bot.sendMessage(chatId, "❌ Failed to save reminder. Try again!");
  }
});


//list
bot.onText(/\/listreminders/, async (msg) => {
  const chatId = msg.chat.id;

  try {
      const res = await pool.query("SELECT text FROM reminders WHERE chat_id = $1", [chatId]);
      const reminders = res.rows.map((row, index) => `${index + 1}. ${row.text}`).join("\n");

      bot.sendMessage(chatId, reminders ? `📋 Your reminders:\n${reminders}` : "⚠️ No reminders found.");
  } catch (error) {
      console.error("Database error:", error);
      bot.sendMessage(chatId, "❌ Failed to fetch reminders. Try again!");
  }
});

//delete
bot.onText(/\/deletereminder (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const reminderId = parseInt(match[1]);

  try {
      const result = await pool.query("DELETE FROM reminders WHERE id = $1 AND chat_id = $2 RETURNING *", [reminderId, chatId]);

      if (result.rowCount > 0) {
          bot.sendMessage(chatId, `✅ Reminder ${reminderId} deleted successfully.`);
      } else {
          bot.sendMessage(chatId, "❌ Reminder not found.");
      }
  } catch (error) {
      console.error("Database error:", error);
      bot.sendMessage(chatId, "❌ Failed to delete reminder. Try again!");
  }
});

//update
bot.onText(/\/updatereminder (\d+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const reminderId = parseInt(match[1]);
  const newReminder = match[2];

  try {
      const result = await pool.query("UPDATE reminders SET text = $1 WHERE id = $2 AND chat_id = $3 RETURNING *", [newReminder, reminderId, chatId]);

      if (result.rowCount > 0) {
          bot.sendMessage(chatId, `🔄 Reminder ${reminderId} updated to: ${newReminder}`);
      } else {
          bot.sendMessage(chatId, "❌ Reminder not found.");
      }
  } catch (error) {
      console.error("Database error:", error);
      bot.sendMessage(chatId, "❌ Failed to update reminder. Try again!");
  }
});




// Webhook Test Route
app.get("/", (req, res) => {
    res.send("Telegram Bot is running!");
});

// Start Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot is running on port ${PORT}`);
});
