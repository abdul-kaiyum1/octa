const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyBhke9zA6HV5nQctR6RPnkl_nJUh6p9jLk");

module.exports = {
  config: {
    name: "gemini",
    aliases: ["ai", "askai"],
    version: "1.0",
    author: "Abdul Kaiyum",
    longDescription: "Ask questions to the Gemini AI and generate images.",
    role: 0,
    category: "Utility",
    guide: {
      en: "{pn} [your_question]\n\nExample:\n{pn} What is the weather today?\n{pn} Generate an image of a futuristic city.",
    },
  },
  langs: {
    en: {
      invalid_question: "Please enter a valid question or command for the AI.",
      query_error: "There was an error querying the AI. Please try again later.",
      image_error: "There was an error generating the image. Please try again later.",
      text_error: "There was an error generating the text. Please try again later.",
    },
  },
  onStart: async function ({ interaction, args }) {
    const userQuestion = args.join(" ");

    if (!userQuestion) {
      return interaction.respond(this.langs.en.invalid_question);
    }

    try {
      // Check if the user is requesting an image
      if (userQuestion.toLowerCase().startsWith("generate an image of")) {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = userQuestion;

        const result = await model.generateContent(prompt);
        if (result.response && result.response.images && result.response.images.length > 0) {
          const imageUrl = result.response.images[0].url;
          await interaction.respond(imageUrl);
        } else {
          await interaction.respond(this.langs.en.image_error);
        }
      } else {
        // Handle text generation
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = userQuestion;

        const result = await model.generateContent(prompt);
        if (result.response && result.response.text) {
          const text = result.response.text;
          await interaction.respond(text);
        } else {
          await interaction.respond(this.langs.en.text_error);
        }
      }
    } catch (error) {
      console.error(error);
      return interaction.respond(this.langs.en.query_error);
    }
  },
};