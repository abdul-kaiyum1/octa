const axios = require('axios');
const fs = require('fs');
const path = require('path');
const TinyURL = require('tinyurl');

module.exports = {
  config: {
    name: "fbdl",
    version: "1.0",
    author: "Abdul Kaiyum",
    shortDescription: "Download Facebook videos by link",
    longDescription: "Download Facebook videos",
    category: "download",
    guide: "{pn} link or reply to a link with {pn}"
  },

  onStart: async function ({ message, args, event }) {
    let link = args.join(" ");
    if (!link && event.messageReply && event.messageReply.body) {
      link = event.messageReply.body.trim();
    }

    if (!link) {
      return message.reply("Please provide the Facebook video link.");
    }

    const apiKey = 'api1'; // Your API key here
    const apiUrl = `https://for-devs.onrender.com/api/fbdl?url=${encodeURIComponent(link)}&apikey=${apiKey}`;

    message.reply("Processing your request... Please wait.");

    try {
      const res = await axios.get(apiUrl);
      if (res.status !== 200) {
        return message.reply(`Failed to retrieve content. Status code: ${res.status}`);
      }

      if (!res.data.downloadUrl) {
        return message.reply("No download URL found.");
      }

      // Generate a TinyURL for the download link
      const tinyUrl = await TinyURL.shorten(res.data.downloadUrl);

      message.reply(`Here's your Facebook video download link: ${tinyUrl}`);

      // Download the video
      const videoFileName = 'fbdl69.mp4';
      const videoFilePath = path.join(__dirname, 'cache', videoFileName);

      const writer = fs.createWriteStream(videoFilePath);
      const response = await axios.get(res.data.downloadUrl, { responseType: 'stream' });

      response.data.pipe(writer);

      writer.on('finish', async () => {
        try {
          await message.reply({
            body: "Here's your Facebook video:",
            attachment: fs.createReadStream(videoFilePath)
          });
          // Clean up the downloaded file
          fs.unlinkSync(videoFilePath);
        } catch (error) {
          console.error("Error sending Facebook video:", error);
          message.reply(`Failed to send Facebook video: ${error.message}`);
        }
      });
    } catch (error) {
      console.error(error);
      message.reply(`Sorry, an error occurred while processing your request: ${error.message}`);
    }
  }
};