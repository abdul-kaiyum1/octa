const axios = require('axios');
const fs = require('fs');
const TinyURL = require('tinyurl');

module.exports = {
  config: {
    name: "alldl",
    version: "2.0",
    author: "ABDUL KAIYUM",
    countDown: 5,
    role: 0,
    shortDescription: "Download content by link",
    longDescription: "Download content from various sources",
    category: "download",
    guide: "{pn} link or reply to a link with {pn}"
  },

  onStart: async function ({ message, args, event }) {
    let link = args.join(" ");
    if (!link && event.messageReply && event.messageReply.body) {
      link = event.messageReply.body.trim();
    }

    if (!link) {
      return message.reply(`Please provide the link.`);
    }

    const apiUrlMap = {
      facebook: `https://for-devs.onrender.com/api/fbdl?url=${encodeURIComponent(link)}&apikey=api1`,
      twitter: `https://for-devs.onrender.com/api/twitterdl?url=${encodeURIComponent(link)}&apikey=api1`,
      tiktok: `https://for-devs.onrender.com/api/tiktokdl?url=${encodeURIComponent(link)}&apikey=api1`,
      instagram: `https://for-devs.onrender.com/api/instadl?url=${encodeURIComponent(link)}&apikey=api1`,
      terabox: `https://for-devs.onrender.com/api/teraboxdl?url=${encodeURIComponent(link)}&apikey=api1`
    };

    const backupUrl = `https://for-devs.onrender.com/api/alldl?url=${encodeURIComponent(link)}&apikey=api1`;

    let BASE_URL;
    if (link.includes("facebook.com") || link.includes("fb.watch")) {
      BASE_URL = apiUrlMap.facebook;
    } else if (link.includes("twitter.com") || link.includes("x.com")) {
      BASE_URL = apiUrlMap.twitter;
    } else if (link.includes("tiktok.com")) {
      BASE_URL = apiUrlMap.tiktok;
    } else if (link.includes("instagram.com")) {
      BASE_URL = apiUrlMap.instagram;
    } else if (link.includes("terabox.com")) {
      BASE_URL = apiUrlMap.terabox;
    } else {
      return message.reply(`Unsupported source.`);
    }

    async function fetchData(url) {
      try {
        const res = await axios.get(url);
        if (res.status !== 200) {
          throw new Error(`Failed to retrieve content. Status code: ${res.status}`);
        }
        return res.data;
      } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        throw error;
      }
    }

    message.reply("Processing your request... Please wait.");

    try {
      let resData = await fetchData(BASE_URL);

      // Fallback to backup URL if no download URLs found in the initial response
      if (!resData.downloadUrl && (!resData.downloadUrls || resData.downloadUrls.length === 0)) {
        resData = await fetchData(backupUrl);
      }

      let downloadUrl;
      let title = "Downloaded Content";

      if (link.includes("facebook.com") || link.includes("fb.watch")) {
        downloadUrl = resData.downloadUrl;
      } else if (link.includes("tiktok.com")) {
        downloadUrl = resData.no_watermark || resData.watermark;
        title = resData.title || title;
      } else if (link.includes("instagram.com")) {
        downloadUrl = resData.video;
        title = resData.author ? resData.author.name : title;
      } else if (resData.downloadUrls && resData.downloadUrls.length > 0) {
        downloadUrl = resData.downloadUrls[0].url;
        title = resData.title || title;
      } else {
        return message.reply("No download URLs found.");
      }

      // Generate a TinyURL for the download link
      const tinyUrl = await TinyURL.shorten(downloadUrl);

      message.reply(`• Title: ${title}\n• Download link: ${tinyUrl}`);

      // Download the video and send it
      const videoResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      const videoPath = `${__dirname}/cache/video.mp4`;
      fs.writeFileSync(videoPath, Buffer.from(videoResponse.data));

      await message.reply({
        body: "Here's your video:",
        attachment: fs.createReadStream(videoPath)
      });

      // Clean up the downloaded file
      fs.unlinkSync(videoPath);
    } catch (error) {
      console.error(error);
      message.reply(`Sorry, an error occurred while processing your request: ${error.message}`);
    }
  }
};
