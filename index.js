const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const express = require('express');
const mineflayer = require('mineflayer');

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1490983833284120596";
const CHANNEL_ID = process.env.CHANNEL_ID;

// ===== WEB SERVER =====
const app = express();
app.get("/", (req, res) => res.send("Bot Alive 24/7"));
app.listen(3000, () => console.log("Web server running"));

// ===== DISCORD BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check bot'),
  new SlashCommandBuilder().setName('status').setDescription('MC bot status'),
  new SlashCommandBuilder().setName('start').setDescription('Start MC bot'),
  new SlashCommandBuilder().setName('stop').setDescription('Stop MC bot')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// ===== REGISTER COMMANDS (ON READY) =====
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    console.log("Registering slash commands...");
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("Slash commands ready ✅");
  } catch (err) {
    console.error("Slash error:", err);
  }
});

// ===== MC BOT =====
let mcBot = null;

function startBot() {
  if (mcBot) return;

  mcBot = mineflayer.createBot({
    host: "YOUR_SERVER_IP", // CHANGE THIS
    port: 25565,
    username: "AFK_BOT"
  });

  mcBot.on('spawn', () => {
    console.log("✅ MC bot joined");

    setInterval(() => {
      mcBot.look(mcBot.entity.yaw + 0.5, mcBot.entity.pitch);
    }, 8000);
  });

  // ===== MC → DISCORD CHAT =====
  mcBot.on('chat', (username, message) => {
    if (username === mcBot.username) return;

    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel) {
      channel.send(`💬 ${username}: ${message}`);
    }
  });

  mcBot.on('error', err => console.log("MC ERROR:", err));

  mcBot.on('end', () => {
    console.log("MC reconnecting...");
    mcBot = null;
    setTimeout(startBot, 5000);
  });
}

// ===== SLASH COMMANDS =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    return interaction.reply('🏓 Pong!');
  }

  if (interaction.commandName === 'status') {
    return interaction.reply(mcBot ? '🟢 MC ONLINE' : '🔴 MC OFFLINE');
  }

  if (interaction.commandName === 'start') {
    startBot();
    return interaction.reply('🚀 MC Bot Starting...');
  }

  if (interaction.commandName === 'stop') {
    if (mcBot) {
      mcBot.quit();
      mcBot = null;
      return interaction.reply('❌ MC Bot Stopped');
    }
    return interaction.reply('Already stopped');
  }
});

client.login(TOKEN);
