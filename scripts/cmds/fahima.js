const axios = require('axios');
const AbdulUID = "100057399829870"; // Replace with Abdul's actual user ID

module.exports = {
  config: {
    name: "aiko",
    version: "2.0",
    author: "Abdul Kaiyum",
    category: "simSimi-bn",
    description: "AI chatbot with teach and delete functionality",
    role: 0,
    guide: {
      en: "{p}aiko <message> - Start a conversation.\n{p}aiko teach <question> | <answer> - Teach Aiko.\n{p}aiko delete <question> - Delete a question."
    },
  },

  onStart: async function ({ message, event, args }) {
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
          console.error("Error in teaching:", error.message);
          message.reply("Server error while teaching. Try again later.");
        }

      } else if (subCommand === 'delete') {
        const questionToDelete = args.slice(1).join(' ');
        if (!questionToDelete) {
          return message.reply('Please provide the question you want to delete.');
        }

        try {
          const deleteUrl = `https://simsimi.vyturex.com/delete?ques=${encodeURIComponent(questionToDelete)}`;
          const deleteResponse = await axios.get(deleteUrl);
          message.reply(deleteResponse.data);
        } catch (error) {
          console.error("Error in deletion:", error.message);
          message.reply("Server error while deleting. Try again later.");
        }

      } else {
        const prompt = args.join(" ");
        const encodedPrompt = encodeURIComponent(prompt);

        try {
          const res = await axios.get(`https://simsimi.vyturex.com/chat?ques=${encodedPrompt}`);
          const result = res.data;

          message.reply(result, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              messageID: info.messageID,
              author: event.senderID
            });
          });
        } catch (error) {
          console.error("Error in conversation:", error.message);
          message.reply("Server error while fetching response. Try again later.");
        }
      }

    } catch (error) {
      console.error("General error:", error.message);
      message.reply('An unexpected error occurred: ' + error.message);
    }
  },

  onReply: async function ({ message, event, args }) {
    try {
      const prompt = args.join(" ");
      const encodedPrompt = encodeURIComponent(prompt);

      try {
        const res = await axios.get(`https://simsimi.vyturex.com/chat?ques=${encodedPrompt}`);
        const result = res.data;

        message.reply(result, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID
          });
        });
      } catch (error) {
        console.error("Error in conversation (onReply):", error.message);
        message.reply("Server error while fetching response. Try again later.");
      }

    } catch (error) {
      console.error("General error in onReply:", error.message);
      message.reply('An unexpected error occurred: ' + error.message);
    }
  }
};
