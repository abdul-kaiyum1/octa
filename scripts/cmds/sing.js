const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');
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

async function playVideo(api, event, args, message) {
    api.setMessageReaction("⏳", event.messageID, (err) => {}, true);
    try {
        let title = '';
        let shortUrl = '';
        let videoId = '';

        const extractShortUrl = async () => {
            const attachment = event.messageReply.attachments[0];
            if (attachment.type === "video" || attachment.type === "audio") {
                return attachment.url;
            } else {
                throw new Error("Invalid attachment type.");
            }
        };

        const getRandomApiKey = () => {
            const randomIndex = Math.floor(Math.random() * API_KEYS.length);
            return API_KEYS[randomIndex];
        };

        if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
            shortUrl = await extractShortUrl();
            const musicRecognitionResponse = await axios.get(`https://audio-recon-ahcw.onrender.com/kshitiz?url=${encodeURIComponent(shortUrl)}`);
            title = musicRecognitionResponse.data.title;

            const searchResponse = await axios.get(`https://youtube-kshitiz-gamma.vercel.app/yt?search=${encodeURIComponent(title)}`);
            if (searchResponse.data.length > 0) {
                videoId = searchResponse.data[0].videoId;
            }

            shortUrl = await TinyURL.shorten(shortUrl);
        } else if (args.length === 0) {
            message.reply("Please provide a video name or reply to a video or audio attachment.");
            return;
        } else {
            title = args.join(" ");
            const searchResponse = await axios.get(`https://youtube-kshitiz-gamma.vercel.app/yt?search=${encodeURIComponent(title)}`);
            if (searchResponse.data.length > 0) {
                videoId = searchResponse.data[0].videoId;
            }

            const videoUrlResponse = await axios.get(`https://yt-kshitiz.vercel.app/download?id=${encodeURIComponent(videoId)}&apikey=${getRandomApiKey()}`);
            if (videoUrlResponse.data.length > 0) {
                shortUrl = await TinyURL.shorten(videoUrlResponse.data[0]);
            }
        }

        if (!videoId) {
            message.reply("No video found for the given query.");
            return;
        }

        const downloadResponse = await axios.get(`https://yt-kshitiz.vercel.app/download?id=${encodeURIComponent(videoId)}&apikey=${getRandomApiKey()}`);
        const videoUrl = downloadResponse.data[0];

        if (!videoUrl) {
            message.reply("Failed to retrieve download link for the video.");
            return;
        }

        const writer = fs.createWriteStream(path.join(__dirname, "cache", `${videoId}.mp3`));
        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        writer.on('finish', () => {
            const videoStream = fs.createReadStream(path.join(__dirname, "cache", `${videoId}.mp3`));
            message.reply({ body: `🎵 Playing: ${title}\n📄 Shortened URL: ${shortUrl}`, attachment: videoStream });
            api.setMessageReaction("✅", event.messageID, () => {}, true);
        });

        writer.on('error', (error) => {
            console.error("Error:", error);
            message.reply("Error downloading the video.");
        });
    } catch (error) {
        console.error("Error:", error);
        message.reply("An error occurred.");
    }
}

async function fetchLyrics(api, event, args, message) {
    if (args.length === 0) {
        message.reply("Please provide the name of the song to fetch lyrics for.");
        return;
    }

    const title = args.join(" ");
    try {
        const lyricsResponse = await axios.get(`https://some-lyrics-api/lyrics?title=${encodeURIComponent(title)}`);
        if (lyricsResponse.data.lyrics) {
            message.reply(`🎤 Lyrics for "${title}":\n\n${lyricsResponse.data.lyrics}`);
        } else {
            message.reply("Lyrics not found.");
        }
    } catch (error) {
        console.error("Error:", error);
        message.reply("Failed to fetch lyrics.");
    }
}

async function managePlaylist(api, event, args, message) {
    // Implement playlist management logic here (add, remove, list)
    message.reply("Playlist management not yet implemented.");
}

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
    onStart: function ({ api, event, args, message }) {
        if (args[0] === "lyrics") {
            return fetchLyrics(api, event, args.slice(1), message);
        } else if (args[0] === "playlist") {
            return managePlaylist(api, event, args.slice(1), message);
        } else {
            return playVideo(api, event, args, message);
        }
    }
};
