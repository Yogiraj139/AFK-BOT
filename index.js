const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const mineflayer = require('mineflayer');
const express = require('express');

// ===== ENV =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1490983833284120596";
const CHANNEL_ID = process.env.CHANNEL_ID;

// ===== STATE =====
let mcBot = null;

let CONFIG = {
  host: "play.bananasmp.net",
  port: 25565,
  username: "AFK_BOT",
  version: false,
  password: null
};

// ===== WEB =====
const app = express();
app.get("/", (req, res) => res.send("Running"));
app.listen(3000);

// ===== DISCORD =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== COMMANDS =====
const commands = [

  new SlashCommandBuilder().setName('start').setDescription('Start MC bot'),
  new SlashCommandBuilder().setName('stop').setDescription('Stop MC bot'),
  new SlashCommandBuilder().setName('status').setDescription('Bot status'),

  new SlashCommandBuilder()
    .setName('setip')
    .setDescription('Set server IP')
    .addStringOption(o => o.setName('ip').setRequired(true)),

  new SlashCommandBuilder()
    .setName('setuser')
    .setDescription('Set username')
    .addStringOption(o => o.setName('name').setRequired(true)),

  new SlashCommandBuilder()
    .setName('setversion')
    .setDescription('Set version')
    .addStringOption(o => o.setName('ver').setRequired(true)),

  new SlashCommandBuilder()
    .setName('setpass')
    .setDescription('Set password')
    .addStringOption(o => o.setName('pass').setRequired(true)),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send chat')
    .addStringOption(o => o.setName('msg').setRequired(true))

].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// ===== READY =====
client.once('ready', async () => {
  console.log("Discord Ready");

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log("Commands Registered");
});

// ===== DISCORD LOG =====
function sendLog(msg) {
  const ch = client.channels.cache.get(CHANNEL_ID);
  if (ch) ch.send(msg);
}

// ===== START BOT =====
function startBot() {
  if (mcBot) return;

  sendLog("🚀 Starting MC bot...");

  mcBot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version
  });

  mcBot.on('login', () => {
    sendLog("✅ Logged into MC");
  });

  mcBot.on('spawn', () => {
    sendLog("🟢 Joined world");

    setInterval(() => {
      mcBot.look(mcBot.entity.yaw + 0.2, mcBot.entity.pitch);
    }, 10000);
  });

  // ===== LOGIN =====
  mcBot.on('messagestr', msg => {

    sendLog(`💬 ${msg}`);

    if (!CONFIG.password) return;

    if (msg.includes("/register")) {
      mcBot.chat(`/register ${CONFIG.password} ${CONFIG.password}`);
    }

    if (msg.includes("/login")) {
      mcBot.chat(`/login ${CONFIG.password}`);
    }
  });

  mcBot.on('kicked', r => {
    sendLog(`❌ KICKED: ${r}`);
  });

  mcBot.on('error', e => {
    sendLog(`❌ ERROR: ${e.message}`);
  });

  mcBot.on('end', () => {
    sendLog("🔁 Reconnecting...");
    mcBot = null;
    setTimeout(startBot, 5000);
  });
}

// ===== COMMAND HANDLER =====
client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;

  if (i.commandName === 'start') {
    startBot();
    return i.reply("Starting...");
  }

  if (i.commandName === 'stop') {
    if (mcBot) mcBot.quit();
    mcBot = null;
    return i.reply("Stopped");
  }

  if (i.commandName === 'status') {
    return i.reply(mcBot ? "🟢 ONLINE" : "🔴 OFFLINE");
  }

  if (i.commandName === 'setip') {
    CONFIG.host = i.options.getString('ip');
    return i.reply(`IP set: ${CONFIG.host}`);
  }

  if (i.commandName === 'setuser') {
    CONFIG.username = i.options.getString('name');
    return i.reply(`Username set`);
  }

  if (i.commandName === 'setversion') {
    CONFIG.version = i.options.getString('ver');
    return i.reply(`Version set`);
  }

  if (i.commandName === 'setpass') {
    CONFIG.password = i.options.getString('pass');
    return i.reply("Password saved");
  }

  if (i.commandName === 'say') {
    const msg = i.options.getString('msg');

    if (!mcBot) return i.reply("Offline");

    mcBot.chat(msg);
    return i.reply(`Sent: ${msg}`);
  }
});

client.login(TOKEN);
