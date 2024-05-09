const axios = require("axios");

module.exports = {
    config: {
        name: "fb",
        aliases: ["fbdl","videofb","fbvid"],
        version: 1.0,
        author: "TCA",
        longDescription: "Download videos from Facebook",
        role: 0,
        category: "media",
        guide: {
            en: "{p}{n} [link]",
        },
    },
    onStart: async function ({ message, args }) {
        try {
            const url = args.join(" ");
            if (!url) {
                return message.reply("Please provide a link.");
            }

            const downloadUrl = `https://sandipbaruwal.onrender.com/download?url=${url}`;
            const response = await axios.get(downloadUrl);
            const hdMedia = response.data.medias.find(media => media.quality === 'hd');

            if (!hdMedia) {
                return message.reply("No HD media found.");
            }

            const shortUrl = await require('tinyurl').shorten(hdMedia.url);
            const stream = await global.utils.getStreamFromURL(hdMedia.url);

            const caption = `(Unknown Content)\n\nQuality: 720p(HD)\nHere's the link: ${shortUrl}`;

            message.reply({ 
                body: caption,
                attachment: stream
            });
        } catch (error) {
            console.error("Error:", error.message);
            message.reply({ body: "❌ An error occurred" });
        }
    }
};
