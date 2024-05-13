const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const bot = "Octa";

module.exports = {
  config: {
    name: "help",
    version: "1.17",
    author: "sheikh",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View command usage and list all commands directly" },
    longDescription: { en: "View command usage and list all commands directly" },
    category: "Info 📜",
    guide: { en: "{pn} / help cmdName" },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);

    if (args.length === 0) {
      const categories = {};
      let msg = "";

      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;

        const category = value.config.category || "Uncategorized";
        categories[category] = categories[category] || { commands: [] };
        categories[category].commands.push(name);
      }

      Object.keys(categories).forEach((category) => {
        if (category !== "info") {
          msg += `╭── ${category.toUpperCase()} \n│ ✧`;

          const names = categories[category].commands.sort();
          msg += `${names.join(",\n│ ✧")}`;

          msg += `\n╰────────♢\n\n`;
        }
      });

      const totalCommands = commands.size;
      msg += `◎ Octa\nTotal Commands » ${totalCommands}\nUse help (cmd name) to see cmd usage details`;

      await message.reply({ body: msg });
    } else {
      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));

      if (!command) {
        await message.reply(`Command "${commandName}" not found.`);
      } else {
        const configCommand = command.config;
        const roleText = roleTextToString(configCommand.role);
        const countDown = configCommand.countDown || "N/A";
        const version = configCommand.version || "N/A";
        const author = configCommand.author || "Unknown";

        const longDescription = configCommand.longDescription ? configCommand.longDescription.en || "No description" : "No description";

        const guideBody = configCommand.guide?.en || "No guide available.";
        const usage = guideBody.replace(/{p}/g, prefix).replace(/{n}/g, configCommand.name);

        const response = `♢ Command Help ♢\n\nName » ${configCommand.name} \nAuthor » ${author} \nRole » ${roleText} \nCountDown » ${countDown} \nVersion » ${version} \nAliases » ${configCommand.aliases ? configCommand.aliases.join(", ") : "None"} \nDescription » ${longDescription} \nUsage » ${usage} \nExample » ${usage}`;

        await message.reply(response);
      }
    }
  },
};

function roleTextToString(roleText) {
  switch (roleText) {
    case 0:
      return "0 (All users)";
    case 1:
      return "1 (Group administrators)";
    case 2:
      return "2 (Admin bot)";
    default:
      return "Unknown role";
  }
}