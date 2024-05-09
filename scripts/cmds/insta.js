const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "insta",
    version: 1.0,
    author: "Subash",
    longDescription: "Downloader",
    role: 0,
    category: "Media",
    guide: {
      en: "{pn} <link>",
    },
  },

  onStart: async function ({ message, args }) {
    try {
      const url = args.join(" ");
      if (!url) {
        return message.reply("please provide a url");
      }

      const instaResponse = await axios.get(`https://sandipbaruwal.onrender.com/insta?url=${url}`);
      const videoUrl = instaResponse.data.url;

      if (!videoUrl) {
        return message.reply("Sorry! I can't.");
      }

      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream",
      });

      const videoPath = "./video.mp4";
      const videoStream = fs.createWriteStream(videoPath);
      response.data.pipe(videoStream);

      await new Promise((resolve, reject) => {
        videoStream.on("finish", resolve);
        videoStream.on("error", reject);
      });

      message.reply({
        body: "meaoww Downloaded✅",
        attachment: fs.createReadStream(videoPath),
      });
    } catch (error) {
      console.error("Error:", error.message);
      message.reply({ body: "ERROR" });
    }
  }
};