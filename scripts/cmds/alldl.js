const fs = require("fs-extra");
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const tinyurl = require("tinyurl");
const { getStreamFromURL, randomString } = global.utils;

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
  threadStates: {},
  config: {
    name: 'alldl',
    version: '5.1',
    author: 'Abdul Kaiyum',
    countDown: 5,
    role: 0,
    shortDescription: 'Download videos from Instagram, Facebook, TikTok, Twitter, Pinterest, and YouTube',
    longDescription: '',
    category: 'media',
    guide: {
      en: '{p}{n} [URL or reply to a message containing a link]',
    }
  },
  onStart: async function ({ api, event }) {
    const threadID = event.threadID;

    if (!this.threadStates[threadID]) {
      this.threadStates[threadID] = {};
    }
  },
  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const message = event.body ? event.body.trim() : "";
    const replyMessage = event.messageReply ? event.messageReply.body : "";

    let url = this.extractUrl(message) || this.extractUrl(replyMessage);
    if (url) {
      console.log(`Attempting to download from URL: ${url}`);
      this.downLoad(url, api, event);
      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
    }
  },
  downLoad: function (url, api, event) {
    const time = Date.now();
    const path = __dirname + `/cache/${time}.mp4`;

    if (url.includes("instagram")) {
      this.downloadInstagram(url, api, event, path);
    } else if (url.includes("facebook") || url.includes("fb.watch")) {
      this.downloadFacebook(url, api, event, path);
    } else if (url.includes("tiktok")) {
      this.downloadTikTok(url, api, event, path);
    } else if (url.includes("x.com")) {
      this.downloadTwitter(url, api, event, path);
    } else if (url.includes("pin.it")) {
      this.downloadPinterest(url, api, event, path);
    } else if (url.includes("youtu")) {
      this.downloadYouTube(url, api, event, path);
    }
  },
  downloadInstagram: async function (url, api, event, path) {
    try {
      const res = await this.getLink(url, api, event, path);
      const response = await axios({
        method: "GET",
        url: res,
        responseType: "arraybuffer"
      });
      fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));
      if (fs.statSync(path).size / 1024 / 1024 > 25) {
        return api.sendMessage("❌ The file is too large, cannot be sent", event.threadID, () => fs.unlinkSync(path), event.messageID);
      }

      const shortUrl = await shortenURL(res);
      const messageBody = `✅ 🔗 Download Url: ${shortUrl}`;
      api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path), event.messageID);
    } catch (err) {
      console.error(err);
    }
  },
  downloadFacebook: async function (url, api, event, path) {
    try {
      const res = await fbDownloader(url);
      if (res.success && res.download && res.download.length > 0) {
        const videoUrl = res.download[0].url;
        const response = await axios({
          method: "GET",
          url: videoUrl,
          responseType: "stream"
        });
        if (response.headers['content-length'] > 87031808) {
          return api.sendMessage("❌ The file is too large, cannot be sent", event.threadID, () => fs.unlinkSync(path), event.messageID);
        }
        response.data.pipe(fs.createWriteStream(path));
        response.data.on('end', async () => {
          const shortUrl = await shortenURL(videoUrl);
          const messageBody = `✅ 🔗 Download Url: ${shortUrl}`;

          api.sendMessage({
            body: messageBody,
            attachment: fs.createReadStream(path)
          }, event.threadID, () => fs.unlinkSync(path), event.messageID);
        });
      } else {
        api.sendMessage("❌ Unable to download the video.", event.threadID, event.messageID);
      }
    } catch (err) {
      console.error(err);
    }
  },
  downloadTikTok: async function (url, api, event, path) {
    try {
      const res = await axios.get(`https://tikdl-video.vercel.app/tiktok?url=${encodeURIComponent(url)}`);
      if (res.data.videoUrl) {
        const videoUrl = res.data.videoUrl;
        const response = await axios({
          method: "GET",
          url: videoUrl,
          responseType: "stream"
        });
        if (response.headers['content-length'] > 87031808) {
          return api.sendMessage("❌ The file is too large, cannot be sent", event.threadID, () => fs.unlinkSync(path), event.messageID);
        }
        response.data.pipe(fs.createWriteStream(path));
        response.data.on('end', async () => {
          const shortUrl = await shortenURL(videoUrl);
          const messageBody = `✅ 🔗 Download Url: ${shortUrl}`;

          api.sendMessage({
            body: messageBody,
            attachment: fs.createReadStream(path)
          }, event.threadID, () => fs.unlinkSync(path), event.messageID);
        });
      } else {
        api.sendMessage("❌ Unable to download the video.", event.threadID, event.messageID);
      }
    } catch (err) {
      console.error(err);
    }
  },
  downloadTwitter: async function (url, api, event, path) {
    try {
      const res = await axios.get(`https://xdl-twitter.vercel.app/kshitiz?url=${encodeURIComponent(url)}`);
      const videoUrl = res.data.videoUrl;

      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream"
      });

      if (response.headers['content-length'] > 87031808) {
        return api.sendMessage("❌ The file is too large, cannot be sent", event.threadID, () => fs.unlinkSync(path), event.messageID);
      }

      response.data.pipe(fs.createWriteStream(path));
      response.data.on('end', async () => {
        const shortUrl = await shortenURL(videoUrl);
        const messageBody = `✅ 🔗 Download Url: ${shortUrl}`;

        api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(path)
        }, event.threadID, () => fs.unlinkSync(path), event.messageID);
      });
    } catch (err) {
      console.error(err);
    }
  },
  downloadPinterest: async function (url, api, event, path) {
    try {
      const res = await axios.get(`https://pindl-pinterest.vercel.app/kshitiz?url=${encodeURIComponent(url)}`);
      const videoUrl = res.data.url;

      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream"
      });

      if (response.headers['content-length'] > 87031808) {
        return api.sendMessage("❌ The file is too large, cannot be sent", event.threadID, () => fs.unlinkSync(path), event.messageID);
      }

      response.data.pipe(fs.createWriteStream(path));
      response.data.on('end', async () => {
        const shortUrl = await shortenURL(videoUrl);
        const messageBody = `✅ 🔗 Download Url: ${shortUrl}`;

        api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(path)
        }, event.threadID, () => fs.unlinkSync(path), event.messageID);
      });
    } catch (err) {
      console.error(err);
    }
  },
  downloadYouTube: async function (url, api, event, path) {
    try {
      const res = await axios.get(`https://yt-downloader-eta.vercel.app/kshitiz?url=${encodeURIComponent(url)}`);
      const videoUrl = res.data.url;

      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream"
      });

      if (response.headers['content-length'] > 87031808) {
        return api.sendMessage("❌ The file is too large, cannot be sent", event.threadID, () => fs.unlinkSync(path), event.messageID);
      }

      response.data.pipe(fs.createWriteStream(path));
      response.data.on('end', async () => {
        const shortUrl = await shortenURL(videoUrl);
        const messageBody = `✅ 🔗 Download Url: ${shortUrl}`;

        api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(path)
        }, eventthreadID, () => fs.unlinkSync(path), event.messageID);
      });
    } catch (err) {
      console.error(err);
    }
  },
  
  extractUrl: function (message) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlPattern);
    return urls ? urls[0] : null;
  },

  getLink: async function (url, api, event, path) {
    try {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data);
      let result = $('meta[property="og:video"]').attr('content') || $('meta[property="og:video:url"]').attr('content') || $('meta[name="twitter:player"]').attr('content');
      if (!result) {
        api.sendMessage("❌ Unable to download the video.", event.threadID, event.messageID);
      }
      return result;
    } catch (error) {
      console.error(error);
    }
  },

  fbDownloader: async function (url) {
    try {
      const res = await axios({
        method: "POST",
        url: "https://fbdownloader.net/download.php",
        data: qs.stringify({ URL: url }),
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      });
      const $ = cheerio.load(res.data);
      const videoUrl = $("a[download]").attr("href");
      return { success: !!videoUrl, download: [{ url: videoUrl }] };
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  },
};

