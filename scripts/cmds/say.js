const axios = require("axios");

module.exports = {
  config: {
    name: "say",
    version: "1.1.1.1",
    author: "JARiF@Cat",
    countDown: 0,
    role: 0,
    category: "Voice",
    shortDescription: "",
    longDescription: "",
    guide: {
      en: "-say [prompt]",
    },
  },
  onStart: async function ({ api, args, message, event }) {
    try {
      let p = args.join(' ');

      const response = await axios.get(`https://www.api.vyturex.com/carly?query=${encodeURIComponent(p)}`);

      const audio = response.data.audio;
      const text = response.data.txt;

      api.sendMessage({
        body: text,
        attachment: await global.utils.getStreamFromURL(audio),
      }, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID
        });
      });
    } catch (error) {
      message.reply("Error" + error);
    }
  },
  onReply: async function ({ api, event, Reply, message, args }) {
    let { author, commandName } = Reply;
    if (event.senderID != author) return;

    let p = args.join(' ');

    const response = await axios.get(`https://www.api.vyturex.com/carly?query=${encodeURIComponent(p)}`);

    const audio = response.data.audio;
    const text = response.data.txt;

    api.sendMessage({
      body: text,
      attachment: await global.utils.getStreamFromURL(audio),
    }, event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID
      });
    });
  }
};