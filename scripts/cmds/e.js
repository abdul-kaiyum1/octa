const { recognize } = require('tesseract.js');

module.exports = {
  config: {
    name: "e",
    version: "1.0",
    description: "Extract text from an image",
    category: "UTILITY",
    role: 0,
    author: "Sheikh"
  },
  onStart: async function ({ args, message }) {
    // Check if an image URL is provided as an argument
    if (!args[0]) {
      return message.reply("Please provide the URL of the image to extract text from.");
    }

    // Get the URL of the image from the arguments
    const imageUrl = args[0];

    try {
      // Extract text from the image
      const { data: { text } } = await recognize(imageUrl);

      // Reply with the extracted text
      message.reply(`Extracted text from the image:\n${text}`);
    } catch (error) {
      console.error("Error extracting text from image:", error);
      message.reply(`${error}`);
    }
  }
};