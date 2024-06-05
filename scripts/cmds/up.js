const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Dhaka');
const os = require('os');

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up","upt"],
    version: "1.0",
    countDown: 10,
    author: "Sahadat",
    role: 1,
    shortDescription: {
      en: "status bot"
    },
    longDescription: {
      en: "status bot"
    },
    category: "system",
    guide: {
      en: "{pn}"
    }
  },
  
  onStart: async function ({ message, event, usersData, threadsData }) {
    try {
      const nehallovesMetaUptime = process.uptime();
      const nehallovesMetaStartTime = Date.now();
      const nehallovesMetaHours = Math.floor(nehallovesMetaUptime / 3600);
      const nehallovesMetaMinutes = Math.floor((nehallovesMetaUptime % 3600) / 60);
      const nehallovesMetaSeconds = Math.floor(nehallovesMetaUptime % 60);

      const nehallovesMetaUptimeString = `${nehallovesMetaHours} Hr(s) ${nehallovesMetaMinutes} Min(s) ${nehallovesMetaSeconds} sec(s)`;

      const now = moment();
      const nehallovesMetaServerTime = now.format('DD-MMMM-Y || hh.mm.ss A');

      
      const nehallovesMetaUsers = await usersData.getAll();
      const nehallovesMetaThreads = await threadsData.getAll(); 
      
      

      const nehallovesMetaEndTime = Date.now();
      const nehallovesMetaBotPing = nehallovesMetaEndTime - nehallovesMetaStartTime;

     
      const nehallovesMediaBanStatus = false; 

      const nehallovesMediaBanText = nehallovesMediaBanStatus ? "❯ Media Banned: Yes 😿" : "❯ Media Banned: No ✅";

      const statusMessage = `🟢 Bot Has Been Working For
❯ Uptime: ${nehallovesMetaUptimeString}
❯ Bot Ping: ${nehallovesMetaBotPing} ms
❯ Total Users: ${nehallovesMetaUsers.length}
❯ Total Threads: ${nehallovesMetaThreads.length}
❯ D/T: ${nehallovesMetaServerTime}
${nehallovesMediaBanText}`;

      message.reply(statusMessage);
      message.reaction("✅", event.messageID);
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while retrieving status data.");
      message.reaction("❌", event.messageID);
    }
  },
};
