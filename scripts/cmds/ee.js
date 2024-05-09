const { ImageAnnotatorClient } = require('@google-cloud/vision');

// Initialize a new client

const fs = require('fs');

// Creates a client

const client = new ImageAnnotatorClient();
module.exports = {
  config: {
    name: "ee",
    version: "1.0",
    description: "Extract text from an image using Google Lens",
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
      // Read the image file
      const file = fs.readFileSync(imageUrl);

      // Perform text detection
      const [result] = await client.textDetection(file);
      const detections = result.textAnnotations;

      // Extract text from the response
      const text = detections[0].description;

      // Reply with the extracted text
      message.reply(`Extracted text from the image:\n${text}`);
    } catch (error) {
      console.error("Error extracting text from image:", error);
      message.reply(`${error}`);
    }
  }
};