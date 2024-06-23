const axios = require("axios");

module.exports = {
  config: {
      name: "lyrics",
      version: "1.0",
      author: "Rishad",
      countDown: 25,
      role: 0,
      shortDescription: {
          en: "search and Get lyrics .",
      },
      longDescription: {
          en: "search and Get lyrics.",
      },
      category: "music",
      guide: {
          en: "  {pn} song name\n{pn} believer \nyou can use artist name for better results\n{pn} (song) by (artist)\n{pn} lily by Alan walker",
      },
  },


onStart: async function ({ api, event, args, message }) {
  const query = args.join(" ");

  if (!query) {
    return message.reply("Please provide a song name to search for lyrics.");
  }

  const searchApiUrl = `https://for-devs.onrender.com/api/lyrics/search?query=${encodeURIComponent(query)}&apikey=rishadbosss`;

  try {
    const response = await axios.get(searchApiUrl);
    const searchResults = response.data.slice(0, 6); 

    if (searchResults.length === 0) {
      return message.reply("❌ No lyrics found for the given query.");
    }

    const resultText = searchResults.map((result, index) =>
      `${index + 1}. ${result.title} by ${result.artist}`
    ).join("\n\n");

    const thumbnails = searchResults.map((result) => result.imageUrl);

    const attachments = await Promise.all(
      thumbnails.map((thumbnail) =>
        global.utils.getStreamFromURL(thumbnail)
      )
    );

    const replyMessage = await message.reply({
      body: `${resultText}\n\nReply with the song number to get lyrics.`,
      attachment: attachments
    });

    const data = {
      commandName: this.config.name,
      messageID: replyMessage.messageID,
      searchResults,
    };
    global.GoatBot.onReply.set(replyMessage.messageID, data);
  } catch (error) {
    console.error(error);
    api.sendMessage("Error: " + error, event.threadID);
  }
},

  onReply: async function ({ api, event, Reply, args, message }) {
    const userInput = args[0].toLowerCase();
    const { searchResults } = Reply;

    if (!isNaN(userInput) && userInput >= 1 && userInput <= searchResults.length) {
      const selectedResult = searchResults[userInput - 1];
      message.unsend(Reply.messageID);

      const infoApiUrl = `https://for-devs.onrender.com/api/lyrics/info?songUrl=${encodeURIComponent(selectedResult.songUrl)}&apikey=api1`;

      try {
        const infoResponse = await axios.get(infoApiUrl);
        const songInfo = infoResponse.data.data;

        const messageData = {
  body: `❏Title: ${songInfo.title}\n\n❏Artist: ${songInfo.artist}\n\n❏Lyrics:\n\n ${songInfo.lyrics}`,
  attachment: await global.utils.getStreamFromURL(songInfo.imageUrl)
};

      message.reply(messageData);
      } catch (error) {
        console.error(error);
        message.reply("Sorry, an error occurred while getting song details.");
      }
    }
  }
};