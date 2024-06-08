module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt"],
    version: "1.0",
    author: " Sahadat",
    shortDescription: {
      en: "uptime",
    },
    longDescription: {
      en: "shows uptime and Speed of bot.",
    },
    category: "system",
    guide: {
      en: "Use {p}uptime Or {p}upt to see uptime and Speed of bot.",
    },
  },

  onStart: async function ({ api, event, args, usersData, threadsData }) {
    try {
      const allUsers = await usersData.getAll();
      const allThreads = await threadsData.getAll();
      const uptime = process.uptime();

      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const uptimeString = `${hours}Hrs ${minutes}min ${seconds}sec`;

      const currentDate = new Date();
      const options = { year: "numeric", month: "numeric", day: "numeric" };
      const date = currentDate.toLocaleDateString("en-US", options);
      const time = currentDate.toLocaleTimeString("en-US", {
        timeZone: "Asia/Dhaka",
        hour12: true,
      });

      const timeStart = Date.now();
      await api.sendMessage({
        body: "⏳ | Wait a second ",
      }, event.threadID);

      const ping = Date.now() - timeStart;

      let pingStatus = " 🟢 | Very Good ";
      if (ping > 200) {
        pingStatus = " 🟩 | Good";
      }
      if (ping > 300) {
        pingStatus = " ✅ | Medium..!!";
      }
      if (ping > 700) {
        pingStatus = " ⭕ | Bad";
      }
      if (ping > 1300) {
        pingStatus = "🔴 | Very Bad";
      }

      api.sendMessage({
        body: `🚀 » Bot running time\n➡ ${uptimeString}\n\n👥 » Total Users\n➡ ${allUsers.length}\n\n✅ » Total threads\n➡ ${allThreads.length}\n\n📅 » Date\n➡ ${date}\n\n⏰ » Time\n➡ ${time}\n\n🚀 » Speed ${ping}ms\nSpeed Status » ${pingStatus}`,
   
      }, event.threadID);
    } catch (error) {
      console.error(error);
      api.sendMessage("An error occurred while retrieving data.", event.threadID);
    }
  }
};