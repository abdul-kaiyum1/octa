const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Dhaka');
const os = require('os');

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "69",
    countDown: 10,
    author: "sheikh",
    role: 1,
    shortDescription: {
      en: "Displays bot uptime and ping"
    },
    longDescription: {
      en: "Displays bot uptime and ping"
    },
    category: "system",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {
    try {
      const startTime = Date.now();
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeString = `${hours} Hr(s) ${minutes} Min(s) ${seconds} sec(s)`;

      const endTime = Date.now();
      const botPing = endTime - startTime;

      const statusMessage = `Bot Uptime: ${uptimeString}`;

      message.reply(statusMessage);
      message.reaction("✅", message.id);
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while retrieving status data.");
      message.reaction("❌", message.id);
    }
  },
};