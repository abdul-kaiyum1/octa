const { createCanvas } = require('canvas');
const path = require('path');
const fs = require('fs');
const config = require('./config.json');
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect(config.database.uriMongodb, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a schema and model for command usage
const commandUsageSchema = new mongoose.Schema({
  name: String,
  usage: Number
});
const CommandUsage = mongoose.model('CommandUsage', commandUsageSchema);

const prefixes = {};
const unlistedCommands = ["eval", "usage", "restart", "spamkick", "cmd"];
const maxBarsToShow = 15;

module.exports = {
  config: {
    name: "usage",
    version: "3.0",
    author: "Abdul Kaiyum",
    role: 0,
    shortDescription: { en: "Show command usage" },
    longDescription: { en: "Displays a chart of the top 15 most used commands." },
    category: "admin",
    guide: { en: "{pn}" },
  },

  onStart: async function({ api, args, message, event, role }) {
    if (role !== 2) return message.reply("Unauthorized Access");
    try {
      const commandUsage = await CommandUsage.find().sort({ usage: -1 }).limit(maxBarsToShow);

      if (!commandUsage.length) return message.reply("No command usage data available.");

      const totalCommands = commandUsage.length;
      const canvasWidth = totalCommands * 120;
      const canvasHeight = 400;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      gradient.addColorStop(0, '#f6f8fa');
      gradient.addColorStop(1, '#dfe6e9');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Title and labels
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px Arial';
      ctx.fillText("Commands", canvasWidth / 2 - 30, canvasHeight - 5);
      ctx.save();
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Usage Count", -canvasHeight / 2, 20);
      ctx.restore();

      // Grid lines
      const numGridLines = 5;
      const gridSpacing = (canvasHeight - 100) / numGridLines;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      for (let i = 1; i <= numGridLines; i++) {
        const y = canvasHeight - 50 - (gridSpacing * i);
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }

      // Bars
      const barWidth = 50;
      const spacing = 20;
      let xPos = 50;
      const maxUsage = Math.max(...commandUsage.map(cmd => cmd.usage));
      commandUsage.forEach(cmd => {
        const barHeight = (cmd.usage / maxUsage) * (canvasHeight - 100);
        const hue = Math.floor(Math.random() * 360);
        const gradientBar = ctx.createLinearGradient(xPos, canvasHeight - barHeight - 50, xPos + barWidth, canvasHeight);
        gradientBar.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
        gradientBar.addColorStop(1, `hsl(${hue}, 50%, 70%)`);
        ctx.fillStyle = gradientBar;
        ctx.fillRect(xPos, canvasHeight - barHeight - 50, barWidth, barHeight);
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.strokeRect(xPos, canvasHeight - barHeight - 50, barWidth, barHeight);
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(cmd.name, xPos + (barWidth / 2), canvasHeight - 30);
        ctx.fillText(cmd.usage, xPos + (barWidth / 2), canvasHeight - barHeight - 60);
        xPos += barWidth + spacing;
      });

      // Save and send the image
      const buffer = canvas.toBuffer('image/png');
      const cacheFolderPath = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const cachedImagePath = path.join(cacheFolderPath, 'usage_chart.png');
      fs.writeFileSync(cachedImagePath, buffer);

      message.reply({
        body: "",
        attachment: fs.createReadStream(cachedImagePath),
      });
    } catch (error) {
      message.reaction("❌", event.messageID);
      message.reply(error.message);
    }
  },

  onChat: async function({ event, message }) {
    const text = event.body;
    if (!text) return;
    let prefix = prefixes[event.threadID];
    if (!prefix) {
      prefix = await global.utils.getPrefix(event.threadID);
      prefixes[event.threadID] = prefix;
    }

    if (text.startsWith(prefix)) {
      const commandText = text.slice(prefix.length).split(" ")[0].toLowerCase();
      if (unlistedCommands.includes(commandText)) return;

      const existingCommand = await CommandUsage.findOne({ name: commandText });
      if (existingCommand) {
        existingCommand.usage++;
        await existingCommand.save();
      } else {
        const newCommand = new CommandUsage({ name: commandText, usage: 1 });
        await newCommand.save();
      }
    }
  }
};
