const axios = require("axios");
const tinyurl = require("tinyurl");

module.exports = {
  config: {
    name: "animedl",
    aliases: ["ad"],
    version: "1.0",
    author: "Abdul Kaiyum",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Search and download anime episodes",
    },
    longDescription: {
      en: "Search for an anime, select an anime from the search results, and get watch and download links for the selected anime episode",
    },
    category: "Information",
    guide: {
      en: "{pn} <anime name>\nExample: {pn} Naruto",
    },
  },
  langs: {
    en: {
      invalid_anime: "Please enter a valid anime name.",
      no_results: "No results found for the anime name.",
      select_anime: "Please reply with the number of the anime you want to select.",
      select_episode: "Please reply with the episode number to get the watch and download links.",
      sending_anime_info: "Sending anime information...",
      error: "There was an error retrieving the anime information.",
    },
  },
  onStart: async function ({ api, message, event, args, getLang }) {
    const animeName = args.join(" ");
    console.log(`Received anime name: ${animeName}`);

    if (!animeName) {
      console.log("No anime name provided.");
      return message.reply(getLang("invalid_anime"));
    }

    try {
      const response = await axios.get(`https://consumet-api-s5m2.onrender.com/anime/gogoanime/${encodeURIComponent(animeName)}`);
      console.log(`API Response: ${JSON.stringify(response.data)}`);
      const data = response.data;

      if (!data || !data.results || data.results.length === 0) {
        console.log("No valid data found.");
        return message.reply(getLang("no_results"));
      }

      const topResults = data.results.slice(0, 6);
      let resultMessage = "Top search results:\n";
      topResults.forEach((anime, index) => {
        resultMessage += `${index + 1}. ${anime.title}\n`;
      });
      resultMessage += "\nReply with the number of the anime you want to select.";

      message.reply(resultMessage, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          step: 1,
          topResults: topResults,
        });
      });
    } catch (error) {
      console.error(`Error occurred: ${error}`);
      return message.reply(getLang("error"));
    }
  },

  onReply: async function ({ api, message, event, Reply, getLang }) {
    const { author, messageID, step, topResults, selectedAnimeId } = Reply;

    if (event.senderID !== author) {
      return message.reply("⚠ You are not the player of this command.");
    }

    const userReply = parseInt(event.body.trim()) - 1;

    if (step === 1) {
      if (userReply < 0 || userReply >= topResults.length) {
        return message.reply("⚠ Invalid option. Please reply with the correct number.");
      }

      const selectedAnime = topResults[userReply];
      const selectedAnimeId = selectedAnime.id;

      try {
        const animeInfoResponse = await axios.get(`https://consumet-api-s5m2.onrender.com/anime/gogoanime/info/${selectedAnimeId}`);
        const animeInfoData = animeInfoResponse.data;

        if (!animeInfoData) {
          return message.reply("No valid data found for the selected anime.");
        }

        let animeDetails = `📺 *${animeInfoData.title}*\n`;
        if (animeInfoData.rating) {
          animeDetails += `⭐ *Rating*: ${animeInfoData.rating}\n`;
        }
        if (animeInfoData.released) {
          animeDetails += `📅 *Released*: ${animeInfoData.released}\n`;
 
        }
        if (animeInfoData.totalEpisodes) {
          animeDetails += `🔢 *Total Episodes*: ${animeInfoData.totalEpisodes}\n`;
        }
        if (animeInfoData.genres && animeInfoData.genres.length > 0) {
          animeDetails += `📂 *Genres*: ${animeInfoData.genres.join(", ")}\n\n`;
        }
        animeDetails += `Reply with the episode number to get the watch and download links.`;

        message.reply(animeDetails, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            step: 2,
            selectedAnimeId: selectedAnimeId,
          });
        });
      } catch (error) {
        console.error(`Error occurred: ${error}`);
        return message.reply(getLang("error"));
      }
    } else if (step === 2) {
      const episodeNumber = userReply + 1;

      try {
        const response = await axios.get(`https://consumet-api-s5m2.onrender.com/anime/gogoanime/info/${selectedAnimeId}`);
        const animeData = response.data;

        if (!animeData || !animeData.episodes || animeData.episodes.length === 0) {
          return message.reply("No valid data found for the selected anime.");
        }

        const episode = animeData.episodes.find(ep => ep.number === episodeNumber);
        if (!episode) {
          return message.reply(`No episode ${episodeNumber} found for the selected anime.`);
        }

        const episodeResponse = await axios.get(`https://consumet-api-s5m2.onrender.com/anime/gogoanime/watch/${episode.id}`);
        const episodeData = episodeResponse.data;

        if (!episodeData || !episodeData.sources || episodeData.sources.length === 0) {
          return message.reply("No valid data found for the selected episode.");
        }

        let watchLinks = `Watch and download links for ${animeData.title} Episode ${episodeNumber}:\n`;
        for (const source of episodeData.sources) {
          const shortUrl = await tinyurl.shorten(source.url);
          watchLinks += `🔗 [${source.quality}](${shortUrl})\n`;
        }
        if (episodeData.download) {
          const downloadShortUrl = await tinyurl.shorten(episodeData.download);
          watchLinks += `\n🔽 [Download Link](${downloadShortUrl})\n`;
        }

        message.reply(watchLinks);
      } catch (error) {
        console.error(`Error occurred: ${error}`);
        return message.reply(getLang("error"));
      }
    }
  }
};
