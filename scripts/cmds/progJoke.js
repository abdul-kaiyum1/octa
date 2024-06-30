const axios = require('axios');

module.exports = {
    config: {
        name: "progjoke",
        aliases: ["programmingjoke", "devjoke", "codejoke"],
        version: "1.0",
        author: "Abdul Kaiyum",
        countDown: 5,
        role: 0,
        shortDescription: "Get a programming joke",
        longDescription: "The bot will provide a random programming joke.",
        category: "Fun",
        guide: "{prefix}progJoke"
    },

    onStart: async function ({ api, event }) {
        try {
            // Fetch a random programming joke from a joke API
            const response = await axios.get('https://official-joke-api.appspot.com/jokes/programming/random');
            const joke = response.data[0];

            // Construct the joke text
            const jokeText = `${joke.setup}\n\n${joke.punchline}`;

            // Send the joke to the chat
            return api.sendMessage(jokeText, event.threadID);
        } catch (error) {
            console.error(error);
            return api.sendMessage("Sorry, I couldn't fetch a programming joke at the moment. Please try again later.", event.threadID);
        }
    }
};
