const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "hangman",
    version: "1.0",
    author: "Name nai",
    countDown: 5,
    role: 0,
    shortDescription: "Play Hangman.",
    longDescription: "Play the Hangman game with canvas visualization.",
    category: "games",
    guide: {
      en: "{pn} start\n{pn} guess <letter>",
    },
  },

  wordsFile: "hangman_words.json",

  onStart: async function ({ api, event, message, args }) {
    const action = args[0];
    const gameData = await this.getGameData();

    if (action === "start") {
      // Start a new game
      const word = this.getRandomWord();
      const newGame = {
        word,
        guessed: [],
        incorrect: [],
        maxAttempts: 6,
        attempts: 0,
      };
      await this.saveGameData(event.threadID, newGame);
      await this.drawHangman(api, event.threadID, newGame);
      return message.reply("Hangman game started! Use 'guess <letter>' to play.");
    } else if (action === "guess") {
      const letter = args[1]?.toLowerCase();
      if (!letter || letter.length !== 1) {
        return message.reply("Please provide a single letter to guess.");
      }

      const currentGame = await this.getGameData(event.threadID);
      if (!currentGame) {
        return message.reply("No active Hangman game. Start a new game with '{pn} start'.");
      }

      if (currentGame.guessed.includes(letter) || currentGame.incorrect.includes(letter)) {
        return message.reply("You've already guessed that letter.");
      }

      const wordArray = currentGame.word.split("");
      if (wordArray.includes(letter)) {
        currentGame.guessed.push(letter);
      } else {
        currentGame.incorrect.push(letter);
        currentGame.attempts += 1;
      }

      await this.saveGameData(event.threadID, currentGame);
      await this.drawHangman(api, event.threadID, currentGame);

      if (currentGame.attempts >= currentGame.maxAttempts) {
        return message.reply(`Game over! The word was '${currentGame.word}'.`);
      }

      if (this.isWordGuessed(currentGame.word, currentGame.guessed)) {
        return message.reply(`Congratulations! You guessed the word '${currentGame.word}'!`);
      }

      return message.reply("Keep guessing!");
    } else {
      return message.reply("Invalid command. Use '{pn} start' to start a game or '{pn} guess <letter>' to make a guess.");
    }
  },

  async getGameData(threadID) {
    try {
      const gameData = await fs.readJSON(`hangman_${threadID}.json`);
      return gameData;
    } catch (err) {
      return null;
    }
  },

  async saveGameData(threadID, gameData) {
    await fs.writeJSON(`hangman_${threadID}.json`, gameData);
  },

  getRandomWord() {
    const words = JSON.parse(fs.readFileSync(this.wordsFile, "utf8"));
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  },

  async drawHangman(api, threadID, gameData) {
    const canvas = createCanvas(300, 300);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 300, 300);

    // Draw the hangman
    if (gameData.attempts >= 1) {
      // Base
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 250);
      ctx.lineTo(250, 250);
      ctx.stroke();
    }
    if (gameData.attempts >= 2) {
      // Post
      ctx.beginPath();
      ctx.moveTo(150, 250);
      ctx.lineTo(150, 50);
      ctx.stroke();
    }
    if (gameData.attempts >= 3) {
      // Beam
      ctx.beginPath();
      ctx.moveTo(150, 50);
      ctx.lineTo(200, 50);
      ctx.stroke();
    }
    if (gameData.attempts >= 4) {
      // Rope
      ctx.beginPath();
      ctx.moveTo(200, 50);
      ctx.lineTo(200, 80);
      ctx.stroke();
    }
    if (gameData.attempts >= 5) {
      // Head
      ctx.beginPath();
      ctx.arc(200, 100, 20, 0, 2 * Math.PI);
      ctx.stroke();
    }
    if (gameData.attempts >= 6) {
      // Body
      ctx.beginPath();
      ctx.moveTo(200, 120);
      ctx.lineTo(200, 180);
      ctx.stroke();
    }

    // Draw the word with guessed letters
    const wordArray = gameData.word.split("");
    const displayWord = wordArray.map(letter => (gameData.guessed.includes(letter) ? letter : "_")).join(" ");
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText(displayWord, 100, 280);

    const filePath = path.join(__dirname, "cache", `hangman_${threadID}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

    await api.sendMessage({
      attachment: fs.createReadStream(filePath),
    }, threadID);
  },

  isWordGuessed(word, guessed) {
    return word.split("").every(letter => guessed.includes(letter));
  },
};