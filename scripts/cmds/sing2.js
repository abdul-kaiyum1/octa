const fs = require("fs-extra");
const axios = require("axios");
const yts = require("yt-search");
const ytdlExec = require("youtube-dl-exec");

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
        const apiUrl = `https://lyrist-woad.vercel.app/api/${encodeURIComponent(songName)}`;
        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        try {
          const response = await axios.get(apiUrl);
          if (response.data.lyrics) {
            api.setMessageReaction("✅", event.messageID, () => {}, true);
            return api.sendMessage(`🎵 Lyrics for "${response.data.title}" by ${response.data.artist}:\n\n${response.data.lyrics}`, event.threadID);
          } else {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return api.sendMessage("❌ No lyrics found for that song.", event.threadID);
          }
        } catch (error) {
          console.error("Error fetching lyrics:", error);
          api.setMessageReaction("❌", event.messageID, () => {}, true);
          return api.sendMessage("❌ An error occurred while fetching the lyrics.", event.threadID);
        }
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
      const searchResults = await yts(songName);
      if (searchResults.videos.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ No videos found for that song.", threadID);
      }
      const video = searchResults.videos[0];
      const videoUrl = video.url;

      const fileName = `music.mp3`;
      const filePath = `./cache/${fileName}`;

      await ytdlExec(videoUrl, {
        extractAudio: true,
        audioFormat: "mp3",
        output: filePath
      });

      const fileStats = fs.statSync(filePath);
      if (fileStats.size > 25 * 1024 * 1024) {
        fs.unlinkSync(filePath);
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ The song is too large to send (>25MB).", threadID);
      }

      const messageBody = `🎵 Here's the song you requested, ${userName}. Enjoy!\n\nTitle: ${video.title}\nDuration: ${video.timestamp}\nYouTube Link: ${videoUrl}`;

      api.sendMessage(
        {
          body: messageBody,
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => {
          fs.unlinkSync(filePath);
          api.setMessageReaction("✅", messageID, () => {}, true);
        }
      );
    } catch (error) {
      console.error("Error playing song:", error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ An error occurred while playing the song.", threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const replyIndex = parseInt(event.body);
    const { userPlaylist } = Reply;

    if (isNaN(replyIndex) || replyIndex < 1 || replyIndex > userPlaylist.length) {
      api.setMessageReaction("⚠", event.messageID, () => {}, true);
      return api.sendMessage("⚠ Invalid playlist index.", event.threadID);
    }

    const songName = userPlaylist[replyIndex - 1];
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    await this.playSong(api, event.threadID, songName, undefined, event.messageID);
  },
};