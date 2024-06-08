const axios = require("axios");

module.exports = {
  config: {
    name: "anigen",
    aliases: ["aiimage"],
    version: "1.0",
    author: "Abdul Kaiyum",
    category: "AI",
    role: 0,
    longDescription: "Generate images based on a prompt.",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} cat",
    },
  },
  onStart: async function ({ api, message, event, args, isMediaBanned }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("Please provide a prompt.");
    }

    try {
      const waitingMessage = await api.sendMessage("✅ | Creating your Imagination...", event.threadID);

      const response = await axios.get(`https://api.vyturex.com/niji?text=${encodeURIComponent(prompt)}`);
      const imageUrl = response.data.imageUrl;

      if (!imageUrl) {
        return message.reply("Failed to generate image. Please try again.");
      }

      // Upload the generated image to ImgBB
      const apiKey = 'fc5b574c7b0834fe36e7ce4e9ec3e9aa';
      const imgbbResponse = await axios.get(`https://api.imgbb.com/1/upload?key=${apiKey}&image=${encodeURIComponent(imageUrl)}`);
      const imgbbUrl = imgbbResponse.data.data.url;

      if (isMediaBanned) {
        return message.reply(`Image generated!\nPrompt: ${prompt}\nDownload link: ${imgbbUrl}`);
      }

      // Send the link first
      message.reply(`Image generated!\nPrompt: ${prompt}\nDownload link: ${imgbbUrl}`);

      // Fetch the generated image and send it as an attachment
      const attachment = await global.utils.getStreamFromURL(imageUrl);
      await api.sendMessage({
        attachment: attachment
      }, event.threadID);

      if (waitingMessage) {
        await api.unsendMessage(waitingMessage.messageID);
      }
    } catch (error) {
      console.error(error);
      return message.reply("There was an error generating the image. Please try again later.");
    }
  }
};
