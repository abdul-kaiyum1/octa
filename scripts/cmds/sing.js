const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const TinyURL = require('tinyurl');

const API_KEYS = [
    'b38444b5b7mshc6ce6bcd5c9e446p154fa1jsn7bbcfb025b3b',
    '719775e815msh65471c929a0203bp10fe44jsndcb70c04bc42',
    'a2743acb5amsh6ac9c5c61aada87p156ebcjsnd25f1ef87037',
    '8e938a48bdmshcf5ccdacbd62b60p1bffa7jsn23b2515c852d',
    'f9649271b8mshae610e65f24780cp1fff43jsn808620779631',
    '8e906ff706msh33ffb3d489a561ap108b70jsne55d8d497698',
    '4bd76967f9msh2ba46c8cf871b4ep1eab38jsn19c9067a90bb'
];

module.exports = {
  config: {
    name: "sing",
    aliases: ["song"],
    version: "2.0",
    author: "Abdul Kaiyum",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Play songs, get lyrics, and manage a playlist.",
    },
    longDescription: {
      en: "Play songs by name, fetch lyrics, or manage a playlist.",
    },
    category: "music",
    guide: {
      en: "{pn} <song name>\n{pn} playlist -a <song name>\n{pn} playlist -p <index>\n{pn} lyrics <song name>\n\nTo play a song from your playlist, use 'sing playlist play [number]'.",
    },
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const userID = event.senderID;
    const userName = await usersData.getName(userID);

    try {
      if (args[0] === "playlist") {
        const action = args[1];
        const playlists = await this.getPlaylists();
        const userPlaylist = playlists[userID] || [];

        if (action === "-a" || action === "add") {
          const songName = args.slice(2).join(" ");
          userPlaylist.push(songName);
          playlists[userID] = userPlaylist;
          await this.savePlaylists(playlists);
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          return api.sendMessage(`🎵 Added "${songName}" to your playlist, ${userName}.`, event.threadID);
        } else if (action === "-p" || action === "play") {
          const index = parseInt(args[2]) - 1;
          if (isNaN(index) || index < 0 || index >= userPlaylist.length) {
            api.setMessageReaction("⚠", event.messageID, () => {}, true);
            return api.sendMessage("⚠ Invalid playlist index.", event.threadID);
          }
          const songName = userPlaylist[index];
          api.setMessageReaction("⏳", event.messageID, () => {}, true);
          await this.playSong(api, event.threadID, songName, userName, event.messageID);
        } else if (action === "list") {
          let reply = `🎵 Here's your playlist, ${userName}:\n` + userPlaylist.map((song, i) => `${i + 1}. ${song}`).join("\n");
          reply += "\nReply by number or use 'sing playlist play [number]' to play.";
          const replyMessage = await api.sendMessage(reply, event.threadID);
          api.setMessageReaction("✅", event.messageID, () => {}, true);

          global.GoatBot.onReply.set(replyMessage.messageID, {
            commandName: this.config.name,
            userID,
            userPlaylist,
          });
        } else {
          api.setMessageReaction("❌", event.messageID, () => {}, true);
          return api.sendMessage("Invalid action. Use 'playlist -a' to add, 'playlist -p' to play, or 'playlist list' to view your playlist.", event.threadID);
        }
      } else if (args[0] === "lyrics") {
        const songName = args.slice(1).join(" ");
        api.setMessageReaction("⏳", event.messageID, () => {}, true);
        await this.fetchLyrics(api, event.threadID, songName, userName, event.messageID);
      } else {
        const songName = args.join(" ");
        api.setMessageReaction("⏳", event.messageID, () => {}, true);
        await this.playSong(api, event.threadID, songName, userName, event.messageID);
      }
    } catch (error) {
      console.error("Error processing command:", error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage("❌ An error occurred while processing your request.", event.threadID);
    }
  },

  async getPlaylists() {
    try {
      const playlistsData = await fs.readFile("playlists.json", "utf8");
      return JSON.parse(playlistsData);
    } catch (error) {
      return {};
    }
  },

  async savePlaylists(playlists) {
    await fs.writeFile("playlists.json", JSON.stringify(playlists), "utf8");
  },

  async playSong(api, threadID, songName, userName, messageID) {
    try {
      const searchResponse = await axios.get(`https://youtube-kshitiz-gamma.vercel.app/yt?search=${encodeURIComponent(songName)}`);
      if (searchResponse.data.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ No videos found for that song.", threadID);
      }
      const video = searchResponse.data[0];
      const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

      const downloadResponse = await axios.get(`https://yt-kshitiz.vercel.app/download?id=${encodeURIComponent(video.videoId)}&apikey=${this.getRandomApiKey()}`);
      if (downloadResponse.data.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ Failed to retrieve download link.", threadID);
      }
      const shortUrl = await TinyURL.shorten(videoUrl);
      const videoDownloadUrl = downloadResponse.data[0];

      const writer = fs.createWriteStream(path.join(__dirname, "cache", `${video.videoId}.mp3`));
      const response = await axios({
        url: videoDownloadUrl,
        method: 'GET',
        responseType: 'stream'
      });

      response.data.pipe(writer);
      const messageBody = `🎵 Here's the song you requested, ${userName}. Enjoy!\n\nYouTube Link: ${videoUrl}`;

      writer.on('finish', () => {
        const videoStream = fs.createReadStream(path.join(__dirname, "cache", `${video.videoId}.mp3`));
        api.sendMessage({
          body: messageBody,
          attachment: videoStream
        }, threadID, () => {
          fs.unlinkSync(path.join(__dirname, "cache", `${video.videoId}.mp3`));
          api.setMessageReaction("✅", messageID, () => {}, true);
        });
      });

      writer.on('error', (error) => {
        console.error("Error:", error);
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("❌ An error occurred while downloading the song.", threadID);
      });
    } catch (error) {
      console.error("Error playing song:", error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ An error occurred while playing the song.", threadID);
    }
  },

  async fetchLyrics(api, threadID, songName, userName, messageID) {
    try {
      const apiUrl = `https://lyrist-woad.vercel.app/api/${encodeURIComponent(songName)}`;
      const response = await axios.get(apiUrl);

      if (response.data.lyrics) {
        api.setMessageReaction("✅", messageID, () => {}, true);
        api.sendMessage(`🎤 Lyrics for "${response.data.title}" by ${response.data.artist}:\n\n${response.data.lyrics}`, threadID);
      } else {
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("❌ No lyrics found for that song.", threadID);
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ An error occurred while fetching the lyrics.", threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const replyIndex = parseInt(event.body);
    const { userPlaylist } = Reply;

        if (isNaN(replyIndex) || replyIndex < 1 || replyIndex > userPlaylist.length) {
      return api.sendMessage("⚠ Invalid playlist number. Please enter a valid number from your playlist.", event.threadID);
    }

    const songName = userPlaylist[replyIndex - 1];
    const userName = await api.getUserInfo(event.senderID);
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    await this.playSong(api, event.threadID, songName, userName[event.senderID].name, event.messageID);
  },

  getRandomApiKey() {
    return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
  }
};
