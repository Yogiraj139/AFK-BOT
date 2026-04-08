
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.get("/", (req, res) => res.send("Bot Alive 24/7"));
app.listen(3000, () => console.log("Web server running"));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong 🏓');
  }
});

client.login(process.env.TOKEN);
