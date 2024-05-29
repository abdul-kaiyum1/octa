const fs = require("fs-extra");

module.exports = {
  config: {
    name: "baccarat",
    version: "1.1",
    author: "Abdul Kaiyum",
    shortDescription: {
      en: "Baccarat game",
    },
    longDescription: {
      en: "Experience the thrill of Baccarat!",
    },
    category: "Game",
  },
  langs: {
    en: {
      invalid_amount: "Please enter a valid and positive amount to bet.",
      not_enough_money: "Sorry, you don't have enough money to place that bet.",
      invalid_bet_type: "Invalid bet type. Please choose 'player', 'banker', or 'tie'.",
      bet_message: "You placed a bet of $%1 on %2.",
      win_message: "🎉 Congratulations! You won $%1.",
      lose_message: "😢 Sorry, you lost $%1.",
      tie_message: "🤝 It's a tie! Your bet is returned.",
    },
  },
  onStart: async function ({ args, message, event, usersData, getLang }) {
    const betAmount = parseInt(args[0]);
    const betType = args[1]?.toLowerCase();

    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    const validBetTypes = ["player", "banker", "tie"];
    if (!validBetTypes.includes(betType)) {
      return message.reply(getLang("invalid_bet_type"));
    }

    const userData = await usersData.get(event.senderID);
    if (betAmount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    const playerCards = drawCards(2);
    const bankerCards = drawCards(2);

    const playerScore = calculateScore(playerCards);
    const bankerScore = calculateScore(bankerCards);

    const winner = determineWinner(playerScore, bankerScore);

    let winnings = 0;
    if (winner === betType) {
      winnings = calculateWinnings(betAmount, betType);
      userData.money += winnings;
    } else {
      winnings = -betAmount;
      userData.money += winnings;
    }

    await usersData.set(event.senderID, userData);

    const betMessage = getLang("bet_message", betAmount, betType);
    const resultMessage = getGameResultMessage(winner, playerScore, bankerScore, winnings, betAmount, getLang);

    const cardsMessage = `\nPlayer's cards: ${formatCards(playerCards)}\nBanker's cards: ${formatCards(bankerCards)}`;

    return message.reply(`${betMessage}${cardsMessage}\n${resultMessage}`);
  },
};

function drawCards(num) {
  const suits = ["❤", "♦", "♣", "♠"];
  const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  
  let deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

  const shuffledDeck = shuffle(deck);
  return shuffledDeck.slice(0, num);
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateScore(cards) {
  let score = 0;
  for (const card of cards) {
    if (["K", "Q", "J", "10"].includes(card.value)) {
      score += 0;
    } else if (card.value === "A") {