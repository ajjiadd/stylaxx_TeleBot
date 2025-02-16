const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();

const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN);
const app = express();

// Middleware
app.use(bodyParser.json());

// Set Webhook URL
const WEBHOOK_URL = `https://your-app-name.onrender.com/${TOKEN}`;
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

bot.onText(/\/addreminder (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const reminder = match[1];

    // Here, you'd normally save the reminder in PostgreSQL
    bot.sendMessage(chatId, `✅ Reminder added: ${reminder}`);
});

bot.onText(/\/listreminders/, (msg) => {
    // Here, you'd normally fetch reminders from PostgreSQL
    bot.sendMessage(msg.chat.id, "📋 Your reminders:\n1. Example reminder");
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
