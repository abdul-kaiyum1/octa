const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Paths for storing data
const userDataPath = path.join(__dirname, 'adventure_user_data.json');
let userData = {};

// Load user data
try {
  userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
} catch (error) {
  console.error('Error loading user data:', error);
}

// Define the adventure scenarios
const adventureData = {
  start: {
    description: "🌲 You wake up in a dark forest. Two paths lie ahead. 🌲",
    choices: {
      "1": "🌿 Take the left path",
      "2": "🌲 Take the right path"
    },
    next: {
      "1": "leftPath",
      "2": "rightPath"
    }
  },
  leftPath: {
    description: "You encounter something on the left path.",
    outcomes: [
      { description: "🧙‍♂️ You meet a friendly wizard who offers you help.", next: "wizardHelp", reward: 100 },
      { description: "🐺 A wild beast appears!", next: "fightBeast" }
    ]
  },
  rightPath: {
    description: "You encounter something on the right path.",
    outcomes: [
      { description: "💰 You find a hidden treasure chest.", next: "treasureChest", reward: 200 },
      { description: "🐍 You are attacked by a venomous snake!", next: "fightBeast" }
    ]
  },
  wizardHelp: {
    description: "🧙‍♂️ The wizard gives you a magic potion. You win! 🎉",
    choices: {
      "1": "✨ Use the potion to gain a skill boost",
      "2": "💼 Keep the potion for later"
    },
    next: {
      "1": "skillBoost",
      "2": "keepPotion"
    }
  },
  treasureChest: {
    description: "💰 You open the treasure chest and find gold coins. You win! 🎉",
    choices: {
      "1": "🎁 Take the gold",
      "2": "🗝️ Look for more treasures"
    },
    next: {
      "1": "takeGold",
      "2": "moreTreasures"
    }
  },
  fightBeast: {
    description: "🦁 A wild beast blocks your path. Do you fight or run?",
    choices: {
      "1": "⚔️ Fight",
      "2": "🏃 Run"
    },
    next: {
      "1": "beastFight",
      "2": "runAway"
    }
  },
  runAway: {
    description: "🏃 You run away safely but find nothing. Game over. 💀",
    choices: {}
  },
  skillBoost: {
    description: "✨ You gain a skill boost from the potion. Your skills have improved!",
    choices: {
      "1": "Continue your adventure"
    },
    next: {
      "1": "start"
    }
  },
  keepPotion: {
    description: "💼 You keep the potion for later use.",
    choices: {
      "1": "Continue your adventure"
    },
    next: {
      "1": "start"
    }
  },
  takeGold: {
    description: "🎁 You take the gold and your wealth increases!",
    choices: {
      "1": "Continue your adventure"
    },
    next: {
      "1": "start"
    }
  },
  moreTreasures: {
    description: "🗝️ You find more hidden treasures!",
    choices: {
      "1": "Continue your adventure"
    },
    next: {
      "1": "start"
    }
  },
  beastFight: {
    description: "⚔️ You engage in a fight with the beast!",
    choices: {
      "1": "Fight with strength",
      "2": "Fight with agility",
      "3": "Fight with intelligence"
    },
    next: {
      "1": "fightOutcome",
      "2": "fightOutcome",
      "3": "fightOutcome"
    }
  },
  fightOutcome: {
    description: "The outcome of your fight is determined by your skill level.",
    choices: {}
  }
};

// Skill system
const skills = {
  strength: "Strength",
  intelligence: "Intelligence",
  agility: "Agility"
};

// Initialize user data
function initializeUserData(userId) {
  if (!userData[userId]) {
    userData[userId] = {
      currentScenario: 'start',
      earnings: 0,
      skills: {
        strength: 1,
        intelligence: 1,
        agility: 1
      }
    };
  }
}

// Save user data to file
function saveUserData() {
  fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2), 'utf8');
}

module.exports = {
  config: {
    name: "adventure",
    version: "2.0",
    author: "Abdul Kaiyum",
    role: 0,
    shortDescription: { en: "Start an adventure" },
    longDescription: { en: "Embark on an adventure and make choices to navigate through the story." },
    category: "games",
    guide: { en: "{pn} to start an adventure or check your skills with {pn} skills" },
  },

  onStart: async function ({ message, event, getLang }) {
    const userId = event.senderID;

    // Initialize user state if not already set
    initializeUserData(userId);

    const currentScenario = userData[userId].currentScenario;
    const scenario = adventureData[currentScenario];

    if (!scenario) {
      return message.reply("Error: Invalid scenario.");
    }

    if (scenario.outcomes) {
      const randomOutcome = scenario.outcomes[Math.floor(Math.random() * scenario.outcomes.length)];
      userData[userId].currentScenario = randomOutcome.next;

      if (randomOutcome.reward) {
        userData[userId].earnings += randomOutcome.reward;
        message.reply(`${randomOutcome.description}\n\n🎉 You have earned $${randomOutcome.reward}. Total earnings: $${userData[userId].earnings}`);
      } else {
        message.reply(randomOutcome.description);
      }

      saveUserData();
      return;
    }

    const replyMessage = `🏞️ **Adventure Begins!** 🏞️\n\n${scenario.description}\n\n*Choices:*\n` +
      Object.keys(scenario.choices).map(key => `${key}: ${scenario.choices[key]}`).join('\n');

    message.reply(replyMessage, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        currentScenario
      });
    });
  },

  onReply: async function ({ message, Reply, event, usersData }) {
    const { author, currentScenario, messageID } = Reply;
    const userId = event.senderID;

    if (event.senderID !== author) {
      return message.reply("⚠️ You are not the player of this adventure.");
    }

    const choice = event.body.trim();
    const scenario = adventureData[currentScenario];

    if (!scenario || !scenario.choices[choice]) {
      return message.reply("⚠️ Invalid choice. Please try again.");
    }

    const nextScenarioKey = scenario.next[choice];
    const nextScenario = adventureData[nextScenarioKey];

    if (!nextScenario) {
      return message.reply("Error: Invalid next scenario.");
    }

    userData[userId].currentScenario = nextScenarioKey;

    saveUserData();

    const replyMessage = `${nextScenario.description}\n\n` +
      (Object.keys(nextScenario.choices).length > 0 ? `*Choices:*\n` +
      Object.keys(nextScenario.choices).map(key => `${key}: ${nextScenario.choices[key]}`).join('\n') : "");

    message.reply(replyMessage);

    // Award money if applicable
    if (nextScenario.reward) {
      const reward = nextScenario.reward;
      userData[userId].earnings += reward;
      await usersData.addMoney(userId, reward);
      message.reply(`🎉 You have earned $${reward} for completing this part of the adventure! Total earnings: $${userData[userId].earnings}`);
    }

    // Remove the onReply listener if the game is over
    if (Object.keys(nextScenario.choices).length === 0) {
      global.GoatBot.onReply.delete(messageID);
    }
  },

  skills: async function ({ message, event }) {
    const userId = event.senderID;

    // Initialize user state if not already set
    initializeUserData(userId);

    const userSkills = userData[userId].skills;

    const skillMessage = `🛠️ **Your Skills** 🛠️\n\n` +
      Object.keys(userSkills).map(skill => `${skills[skill]}: ${userSkills[skill]}`).join('\n');

    message.reply(skillMessage);
  }
};
