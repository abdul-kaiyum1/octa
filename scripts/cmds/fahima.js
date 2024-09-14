const axios = require("axios");
const Prefixes = ['aiko'];
const AbdulUID = "100057399829870"; // Replace this with Abdul's actual user ID

module.exports = {
  config: {
    name: "aiko",
    version: "1.1",
    author: "Abdul Kaiyum",
    category: "simSimi-bn",
    cooldown: 0,
    role: 0,
    guide: {
      en: "{p}aiko hi\nfor deleting: {p}aiko delete hi\nfor teaching: {p}aiko teach hi | hello"
    }
  },
  onStart: async function () {},
  onChat: async function ({ api, event, args, message }) {
    const prefix = Prefixes.find((p) => event.body && event.body.toLowerCase().startsWith(p));

    if (!prefix) {
      return;
    }

    const subCommand = args[0];

    // Check if the subCommand is 'teach' or 'delete' and if Abdul is the sender
    if ((subCommand === 'teach' || subCommand === 'delete') && event.senderID !== AbdulUID) {
      return message.reply("Only Abdul can use this command.");
    }

    try {
      if (subCommand === 'teach') {
        const content = args.slice(1).join(" ").split("|").map((item) => item.trim());

        if (content.length < 2) {
          return message.reply("Please provide both the question and the answer separated by '|'.");
        }

        const question = content[0];
        const answer = content.slice(1).join('|');

        try {
          const teachUrl = `https://simsimi.vyturex.com/teach?ques=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}`;
          const teachResponse = await axios.get(teachUrl);
          message.reply(teachResponse.data);
        } catch (error) {
          console.error(error);
          message.reply("Try again later dear.");
        }

      } else if (subCommand === 'delete') {
        try {
          const questionToDelete = args.slice(1).join(' ');
          if (!questionToDelete) {
            message.reply('Please provide the question you want to delete.');
            return;
          }

          const deleteUrl = `https://simsimi.vyturex.com/delete?ques=${encodeURIComponent(questionToDelete)}`;
          const deleteResponse = await axios.get(deleteUrl);

          message.reply(deleteResponse.data);

        } catch (error) {
          console.error(error);
          message.reply(error.message);
        }

      } else {
        const name = args.join(' ');

        try {
          const response = await axios.get(`https://simsimi.vyturex.com/chat?ques=${encodeURIComponent(name)}`);
          const r = response.data;
          message.reply(r);
        } catch (error) {
          console.error(error);
          message.reply('Oops! An error occurred.');
        }
      }

    } catch (error) {
      message.reply('Oops! An error occurred: ' + error.message);
    }
  }
};
