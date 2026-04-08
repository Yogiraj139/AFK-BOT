const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const express = require('express');
const mineflayer = require('mineflayer');

// ===== WEB SERVER =====
const app = express();
app.get("/", (req, res) => res.send("Bot Alive 24/7"));
app.listen(3000, () => console.log("Web server running"));

// ===== DISCORD BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check bot'),
  new SlashCommandBuilder().setName('status').setDescription('MC bot status'),
  new SlashCommandBuilder().setName('start').setDescription('Start MC bot'),
  new SlashCommandBuilder().setName('stop').setDescription('Stop MC bot')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// ===== REGISTER COMMANDS =====
(async () => {
  try {
    console.log("Registering slash commands...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("Slash commands ready ✅");
  } catch (err) {
    console.error(err);
  }
})();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== MINECRAFT BOT =====
let mcBot = null;

function startBot() {
  if (mcBot) return;

  mcBot = mineflayer.createBot({
    host: "YOUR_SERVER_IP", // CHANGE THIS
    port: 25565,
    username: "AFK_BOT"
  });

  mcBot.on('spawn', () => {
    console.log("MC bot joined");

    // SMART AFK (camera movement)
    setInterval(() => {
      mcBot.look(mcBot.entity.yaw + 0.5, mcBot.entity.pitch);
    }, 8000);
  });

  // ===== MC → DISCORD CHAT =====
  mcBot.on('chat', (username, message) => {
    if (username === mcBot.username) return;

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    if (channel) {
      channel.send(`💬 ${username}: ${message}`);
    }
  });

  mcBot.on('end', () => {
    console.log("MC bot reconnecting...");
    mcBot = null;
    setTimeout(startBot, 5000);
  });

  mcBot.on('error', err => console.log(err));
}

// ===== DISCORD → MC CHAT =====
client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  if (mcBot) {
    mcBot.chat(msg.content);
  }
});

// ===== SLASH COMMAND HANDLER =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('🏓 Pong!');
  }

  if (interaction.commandName === 'status') {
    if (mcBot) {
      await interaction.reply('🟢 MC Bot is ONLINE');
    } else {
      await interaction.reply('🔴 MC Bot is OFFLINE');
    }
  }

  if (interaction.commandName === 'start') {
    startBot();
    await interaction.reply('🚀 MC Bot Started');
  }

  if (interaction.commandName === 'stop') {
    if (mcBot) {
      mcBot.quit();
      mcBot = null;
      await interaction.reply('❌ MC Bot Stopped');
    } else {
      await interaction.reply('Already stopped');
    }
  }
});

client.login(process.env.TOKEN);
