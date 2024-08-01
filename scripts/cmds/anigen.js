const axios = require('axios');
const fs = require('fs');
const path = require('path');

global.api = {
  samirApi: "https://www.samirxpikachu.run.place"
};

module.exports = {
  config: {
    name: "anigen",
    aliases: ["animeimagine"],
    author: "Abdul Kaiyum",
    version: "1.0",
    countDown: 10,
    role: 0,
    shortDescription: "Generates an anime image from a text description",
    longDescription: "Generates an anime image from a text description using the Animagine API.",
    category: "ai",
    guide: {
          en: "{pn} <prompt> | <resolution> | <qualitytag> \nExample: {pn} 'Naruto in battle' | '1:1' | '4'",

    }
  },

  langs: {
    en: {
      loading: "Generating image, please wait...",
      error: "An error occurred, please try again later",
      no_prompt: "- Please provide a prompt for the image generation.",
      generated: "Here's your AI generated image \nPrompt: \"{prompt}\" \nHD download Link: {link}",
      media_error: "⚠ An error occurred while sending the image. Please click on the link to view the image: {link}"
    }
  },

  onStart: async function ({ event, message, getLang, args }) {
    const info = args.join(" ");
    
    if (!info) {
      return message.reply(getLang("no_prompt"));
    }

    const msg = info.split("|");
    const prompt = msg[0] ? msg[0].trim() : null;
    const resolution = msg[1] ? msg[1].trim() : '1:1';
    const qualitytag = msg[2] ? msg[2].trim() : '4';

    if (!prompt) {
      return message.reply(getLang("no_prompt"));
    }

    let msgSend;
    let finalUrl = '';

    try {
      msgSend = await message.reply(getLang("loading"));

      const response = await axios.get(`${global.api.samirApi}/animagine`, {
        params: {
          prompt: prompt,
          resolution: resolution,
          qualitytag: qualitytag
        },
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const filePath = path.join(__dirname, 'temp_image.png');
      fs.writeFileSync(filePath, buffer);

      const imageUrl = await global.utils.uploadImgbb(fs.createReadStream(filePath));

      finalUrl = imageUrl.image.url;
      await message.unsend(msgSend.messageID);

      message.reply({
        body: getLang("generated").replace("{prompt}", prompt).replace("{link}", finalUrl),
        attachment: await global.utils.getStreamFromURL(finalUrl)
      });

      fs.unlinkSync(filePath); // Clean up the temporary file
    } catch (err) {
      console.error(err);
      if (msgSend) await message.unsend(msgSend.messageID);
      const errorMessage = finalUrl ? getLang("media_error").replace("{link}", finalUrl) : getLang("error");
      message.reply(errorMessage);
    }
  }
};
