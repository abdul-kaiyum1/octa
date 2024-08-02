const fs = require("fs-extra");
const axios = require("axios");
const ytdl = require("youtube-dl-exec"); // Changed from ytdl-core to youtube-dl-exec
const yts = require("yt-search");

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

    if (args[0] === "playlist") {
      const action = args[1];
      const playlists = await this.getPlaylists();
      const userPlaylist = playlists[userID] || [];

      if (action === "-a" || action === "add") {
        const songName = args.slice(2).join(" ");
        userPlaylist.push(songName);
        playlists[userID] = userPlaylist;
        await this.savePlaylists(playlists);
        api.setMessageReaction('👍', event.messageID, () => {}, true);
        return message.reply(`🎵 Added "${songName}" to your playlist, ${userName}.`);
      } else if (action === "-p" || action === "play") {
        const index = parseInt(args[2]) - 1;
        if (isNaN(index) || index < 0 || index >= userPlaylist.length) {
          api.setMessageReaction('⚠️', event.messageID, () => {}, true);
          return message.reply("⚠ Invalid playlist index.");
        }
        const songName = userPlaylist[index];
        await this.playSong(api, event.threadID, songName, userName);
        api.setMessageReaction('▶️', event.messageID, () => {}, true);
      } else if (action === "list") {
        let reply = `🎵 Here's your playlist, ${userName}:\n` + userPlaylist.map((song, i) => `${i + 1}. ${song}`).join("\n");
        reply += "\nReply by number or use 'sing playlist play [number]' to play.";
        const replyMessage = await message.reply(reply);
        global.GoatBot.onReply.set(replyMessage.messageID, {
          commandName: this.config.name,
          userID,
          userPlaylist,
        });
        api.setMessageReaction('📄', event.messageID, () => {}, true);
      } else {
        api.setMessageReaction('❓', event.messageID, () => {}, true);
        return message.reply("Invalid action. Use 'playlist -a' to add, 'playlist -p' to play, or 'playlist list' to view your playlist.");
      }
    } else if (args[0] === "lyrics") {
      const songName = args.slice(1).join(" ");
      const apiUrl = `https://lyrist-woad.vercel.app/api/${encodeURIComponent(songName)}`;
      try {
        const response = await axios.get(apiUrl);
        if (response.data.lyrics) {
          api.setMessageReaction('🎼', event.messageID, () => {}, true);
          return message.reply(`🎵 Lyrics for "${response.data.title}" by ${response.data.artist}:\n\n${response.data.lyrics}`);
        } else {
          api.setMessageReaction('❌', event.messageID, () => {}, true);
          return message.reply("❌ No lyrics found for that song.");
        }
      } catch (error) {
        console.error("Error fetching lyrics:", error);
        api.setMessageReaction('⚠️', event.messageID, () => {}, true);
        return message.reply("❌ An error occurred while fetching the lyrics.");
      }
    } else {
      const songName = args.join(" ");
      await this.playSong(api, event.threadID, songName, userName);
      api.setMessageReaction('🔊', event.messageID, () => {}, true);
    }
  },

  async getPlaylists() {
    try {
      const playlistsData = await fs.readFile("playlists.json", "utf8");
      return JSON.parse(playlistsData);
    } catch (error) {
      console.error("Error loading playlists:", error);
      return {};
    }
  },

  async savePlaylists(playlists) {
    await fs.writeFile("playlists.json", JSON.stringify(playlists), "utf8");
  },

  async playSong(api, threadID, songName, userName) {
    try {
      const searchResults = await yts(songName);
      if (searchResults.videos.length === 0) {
        api.setMessageReaction('❌', event.messageID, () => {}, true);
        return api.sendMessage("❌ No videos found for that song.", threadID);
      }
      const video = searchResults.videos[0];
      const videoUrl = video.url;

      const download = ytdl(videoUrl, {
        output: './cache/%(id)s.%(ext)s',
        format: 'bestaudio'
      }, { cwd: __dirname });

      download.stdout.on('end', async () => {
        const filePath = `./cache/${video.videoId}.mp3`;
        const messageBody = `🎵 Here's the song you requested, ${userName}. Enjoy!\n\nTitle: ${video.title}\nDuration: ${video.timestamp}\nYouTube Link: ${videoUrl}`;

        api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          fs.unlinkSync(filePath); // Clean up the file after sending
        });
      });
    } catch (error) {
      console.error("Error playing song:", error);
      api.sendMessage("❌ An error occurred while playing the song.", threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const replyIndex = parseInt(event.body);
    const { userPlaylist } = Reply;

    if (isNaN(replyIndex) || replyIndex < 1 || replyIndex > userPlaylist.length) {
      api.setMessageReaction('⚠️', event.messageID, () => {}, true);
      return api.sendMessage("⚠ Invalid playlist index.", event.threadID);
    }

    const songName = userPlaylist[replyIndex - 1];
    await this.playSong(api, event.threadID, songName);
    api.setMessageReaction('▶️', event.messageID, () => {}, true);
  },
};