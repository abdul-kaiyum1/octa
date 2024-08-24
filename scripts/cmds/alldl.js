const fs = require("fs-extra");
const axios = require("axios");
const tinyurl = require("tinyurl");

async function shortenURL(url) {
  try {
    const shortUrl = await tinyurl.shorten(url);
    return shortUrl;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to shorten URL");
  }
}

module.exports = {
  config: {
    name: 'alldl',
    version: '5.1',
    author: 'Abdul Kaiyum',
    countDown: 5,
    role: 0,
    shortDescription: 'Download videos from various platforms using one API',
    longDescription: '',
    category: 'media',
    guide: {
      en: '{p}{n} [reply to a message containing a link]',
    }
  },

  onStart: function () {
    // This function is required but may remain empty if no initialization is needed
    console.log("alldl command has been initialized");
  },

  onChat: async function ({ api, event }) {
    // Only proceed if the user replied to a message with the command
    if (event.type !== 'message_reply' || !event.body || !event.body.startsWith(this.config.name)) {
      return;
    }

    const replyMessage = event.messageReply.body;

    // Check if the reply message contains a URL
    let url = this.extractUrl(replyMessage);

    if (!url) {
      return api.sendMessage("❌ | No URL found in the replied message.", event.threadID, event.messageID);
    }

    // Proceed to download the video from the URL
    console.log(`Attempting to download from URL: ${url}`);
    this.download(url, api, event);
    api.setMessageReaction("✅", event.messageID, (err) => {}, true);
  },

  download: async function (url, api, event) {
    try {
      const apiUrl = `https://samirxpikachuio.onrender.com/alldl?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const videoUrl = response.data?.medias?.[0]?.url;
      const videoTitle = response.data?.title;

      if (!videoUrl) {
        return api.sendMessage("❌ | Unable to download the video.", event.threadID, event.messageID);
      }

      const path = __dirname + `/cache/${Date.now()}.mp4`;
      const videoResponse = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "arraybuffer",
      });

      fs.writeFileSync(path, Buffer.from(videoResponse.data, "utf-8"));

      if (fs.statSync(path).size / 1024 / 1024 > 25) {
        return api.sendMessage("❌ | The file is too large, cannot be sent", event.threadID, () => fs.unlinkSync(path), event.messageID);
      }

      const shortUrl = await shortenURL(videoUrl);
      const messageBody = `✅ | **${videoTitle}**\n🔗 **Download URL:** ${shortUrl}`;

      api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(path),
      }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ | Failed to download the video. Please try again later.", event.threadID, event.messageID);
    }
  },

  extractUrl: function (message) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlPattern);
    return urls ? urls[0] : null;
  },
};