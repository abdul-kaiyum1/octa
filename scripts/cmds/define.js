const axios = require('axios');

module.exports = {
    config: {
        name: "define",
        aliases: ["definition"],
        version: "1.0",
        author: "Abdul Kaiyum",
        countDown: 5,
        role: 0,
        shortDescription: "Get dictionary definitions",
        longDescription: "The bot will provide the definition of a given word.",
        category: "Information",
        guide: "{prefix}define [word]"
    },

    onStart: async function ({ api, event, args }) {
        const word = args.join(" ");
        if (!word) {
            return api.sendMessage("Please provide a word to define.", event.threadID);
        }

        try {
            const response = await axios.get(https://api.dictionaryapi.dev/api/v2/entries/en/${word});
            const definitions = response.data[0].meanings.map(meaning => {
                return ${meaning.partOfSpeech}: ${meaning.definitions[0].definition};
            }).join('\n');

            const message = Definitions for "${word}":\n\n${definitions};
            return api.sendMessage(message, event.threadID);
        } catch (error) {
            console.error(error);
            return api.sendMessage("Sorry, I couldn't find the definition for that word. Please try another word.", event.threadID);
        }
    }
};
