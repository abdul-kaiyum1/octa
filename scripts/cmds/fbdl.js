const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const tinyurl = require("tinyurl");

module.exports = {
  config: {
    name: "fbdl",
    aliases: ["fb", "videofb", "fbvid"],
    version: "1.0",
    author: "Abdul Kaiyum",
    longDescription: "Download Facebook videos and send them in Messenger.",
    role: 0,
    category: "Media",
    guide: {
      en: "{pn} [video_url]\n\nExample:\n{pn} https://www.facebook.com/watch/?v=1234567890",
    },
  },
  langs: {
    en: {
      invalid_url: "Please enter a valid Facebook video URL.",
      downloading: "Downloading the video...",
      download_success: "Successfully downloaded the video: %1\nQuality: %2\nTinyURL: %3\nProcessing time: %4 seconds",
      download_error: "There was an error downloading the video. Please try again later.",
      media_ban: "Media is banned. Here is the video link:\n%1\nQuality: %2\nTinyURL: %3\nProcessing time: %4 seconds",
    },
  },
  onStart: async function ({ message, args, isMediaBanned }) {
    const videoUrl = args.join(" ");

    if (!videoUrl || !isValidUrl(videoUrl)) {
      return message.reply("Please enter a valid Facebook video URL.");
    }

    const startTime = Date.now();
    message.reply("Downloading the video...");

    const options = {
      method: 'GET',
      url: 'https://apis-samir.onrender.com/fbdl',
      params: { vid_url: videoUrl },
    };

    try {
      const response = await axios.request(options);
      const data = response.data;

      if (!data || !data.links) {
        return message.reply("There was an error downloading the video. Please try again later.");
      }

      const downloadUrl = data.links["Download High Quality"] || data.links["Download Low Quality"];
      const videoTitle = data.title || "video";
      const videoQuality = data.links["Download High Quality"] ? "High Quality" : "Low Quality";

      if (!downloadUrl) {
        return message.reply("There was an error downloading the video. Please try again later.");
      }

      const shortUrl = await tinyurl.shorten(downloadUrl);
      const modifiedShortUrl = shortUrl.replace('.', '*');

      if (isMediaBanned) {
        const endTime = Date.now();
        const processingTime = ((endTime - startTime) / 1000).toFixed(2);
        return message.reply(`Media is banned in this chat. Here is the video link:\n${downloadUrl}\nQuality: ${videoQuality}\nTinyURL: ${modifiedShortUrl}\nPlease copy the link and replace '*' with '.' to access it.\nProcessing time: ${processingTime} seconds`);
      }

      const videoPath = path.join(__dirname, "tmp", `${videoTitle}.mp4`);
      await fs.ensureDir(path.dirname(videoPath));
      await downloadFile(downloadUrl, videoPath);

      const endTime = Date.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);

      await message.reply({
        body: `Successfully downloaded the video: ${videoTitle}\nQuality: ${videoQuality}\nTinyURL: ${modifiedShortUrl}\nPlease copy the link and replace '*' with '.' to access it.\nProcessing time: ${processingTime} seconds`,
        attachment: fs.createReadStream(videoPath),
      });

      fs.unlinkSync(videoPath);
    } catch (error) {
      console.error(error);
      return message.reply("There was an error downloading the video. Please try again later.");
    }
  },
};

function isValidUrl(url) {
  const regex = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+/;
  return regex.test(url);
}

async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios.get(url, { responseType: "stream" });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}