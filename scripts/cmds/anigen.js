const axios = require("axios");

module.exports = {
  config: {
    name: "anigen",
    author: "Abdul Kaiyum",
    version: "1.0",
    role: 0,
    countDown: 10,
    shortDescription: "Generates an image from a text description",
    longDescription: "Generates an image from a text description",
    category: "ai",
    guide: {
      en: "{pn} <prompt> | <resolution>\nExample:\n{pn} a futuristic city | 16:9"
    }
  },

  langs: {
    en: {
      loading: "Generating image, please wait...",
      error: "An error occurred, please try again later.",
      no_prompt: "Please provide a prompt to generate an image."
    }
  },

  onStart: async function ({ event, message, getLang, api, args }) {
    const { threadID } = event;
    const input = args.join(' ');
    const [prompt, resolution = '1:1'] = input.split('|').map(s => s.trim());

    if (!prompt) {
      return message.reply(getLang("no_prompt"));
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      message.reply(getLang("loading"));
      const apiUrl = `https://apis-samir.onrender.com/niji?prompt=${encodeURIComponent(prompt)}&resolution=${encodeURIComponent(resolution)}`;
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

      if (response.status !== 200) {
        throw new Error("Failed to fetch the generated image.");
      }

      // Directly reply with the image
      message.reply({
        body: `Here's your AI generated image\nPrompt: "${prompt}"`,
        attachment: Buffer.from(response.data, 'binary')
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error("Error generating image:", error);
      message.reply(getLang("error"));
    }
  }
};