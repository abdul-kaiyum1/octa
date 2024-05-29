const fs = require("fs");
const mongoose = require("mongoose");
const { Schema } = mongoose;

// MongoDB connection URI
const uri = "mongodb+srv://abdulkaiyum:abdulkaiyum5426@cluster0.5oo7v8h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Define the User schema and model
const userSchema = new Schema({
  userID: String,
  bank: { type: Number, default: 0 },
  lastInterestClaimed: { type: Date, default: Date.now },
  loan: { type: Number, default: 0 },
  loanTakenAt: { type: Date, default: null },
  loanPayed: { type: Boolean, default: true }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = {
  config: {
    name: "bank",
    version: "1.0",
    description: "Aiko Bank - Your trusted banking partner",
    guide: {
      en: "{pn}bank <subcommand> [amount] [userId]"
    },
    category: "Economy",
    countDown: 5,
    role: 0,
    author: "Abdul Kaiyum"
  },
  onStart: async function ({ args, message, event, api, usersData }) {
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);

    const userID = event.senderID;
    const userMoney = await usersData.get(userID, "money");
    const info = await api.getUserInfo(userID);
    const username = info[userID].name;

    // Fetch user data from MongoDB
    let user = await User.findOne({ userID });
    if (!user) {
      user = new User({ userID });
      await user.save();
    }

    // Auto loan repayment with penalty
    const now = new Date();
    if (!user.loanPayed && user.loanTakenAt) {
      const loanDays = (now - user.loanTakenAt) / (1000 * 60 * 60 * 24); // in days
      if (loanDays > 10) {
        const penaltyRate = loanDays <= 20 ? 0.02 : 0.03;
        const totalLoanWithPenalty = user.loan * (1 + penaltyRate);
        if (user.bank >= totalLoanWithPenalty) {
          user.bank -= totalLoanWithPenalty;
          user.loan = 0;
          user.loanPayed = true;
          user.loanTakenAt = null;
          await user.save();
          return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Your loan of $${formatNumber(totalLoanWithPenalty)} has been automatically repaid with a ${penaltyRate * 100}% penalty.`);
        }
      }
    }

    const command = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);
    const recipientID = args[2];

    switch (command) {
      case "deposit":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ Please enter a valid amount to deposit.");
        }
        if (userMoney < amount) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ You don't have the required amount to deposit.");
        }
        user.bank += amount;
        await user.save();
        await usersData.set(userID, { money: userMoney - amount });
        return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Successfully deposited $${formatNumber(amount)}. Your money is in safe hands.`);
      
      case "withdraw":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ Please enter a valid amount to withdraw.");
        }
        if (user.bank < amount) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ You don't have enough balance to withdraw.");
        }
        user.bank -= amount;
        await user.save();
        await usersData.set(userID, { money: userMoney + amount });
        return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Successfully withdrew $${formatNumber(amount)}. Your money is now in your hands.`);
      
      case "balance":
        return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Your current bank balance is $${formatNumber(user.bank)}.`);

      case "interest":
        const lastClaimed = user.lastInterestClaimed;
        const timeDiff = (now - lastClaimed) / (1000 * 60 * 60 * 24); // in days
        if (timeDiff < 2) {
          const remainingTime = 2 - timeDiff;
          return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ You can claim interest again in ${remainingTime.toFixed(2)} days.`);
        }
        const interest = user.bank * 0.05;
        user.bank += interest;
        user.lastInterestClaimed = now;
        await user.save();
        return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ You have earned $${formatNumber(interest)} in interest.`);

      case "transfer":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ Please enter a valid amount to transfer.");
        }
        if (recipientID === userID) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ You cannot transfer money to yourself.");
        }
        if (user.bank < amount) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ You don't have enough balance to transfer.");
        }
        let recipient = await User.findOne({ userID: recipientID });
        if (!recipient) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ The recipient does not have a bank account.");
        }
        user.bank -= amount;
        recipient.bank += amount;
        await user.save();
        await recipient.save();
        return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Successfully transferred $${formatNumber(amount)} to user ${recipientID}.`);

      case "richest":
        const topUsers = await User.find().sort({ bank: -1 }).limit(10);
        const richestList = topUsers.map((u, index) => `${index + 1}. ${u.userID} - $${formatNumber(u.bank)}`).join('\n');
        return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Top 10 richest users:\n${richestList}`);

      case "loan":
        const maxLoan = 100000;
        if (isNaN(amount) || amount <= 0 || amount > maxLoan) {
          return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Please enter a valid loan amount up to $${formatNumber(maxLoan)}.`);
        }
        if (!user.loanPayed) {
          return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ You must repay your existing loan of $${formatNumber(user.loan)} before taking a new one.`);
        }
        user.loan = amount;
        user.loanPayed = false;
        user.loanTakenAt = new Date();
        user.bank += amount;
        await user.save();
        return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Successfully taken a loan of $${formatNumber(amount)}. Remember to repay it within 10 days.`);

      case "payloan":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ Please enter a valid amount to repay.");
        }
        if (user.loan <= 0) {
          return message.reply("[🏦 Aiko Bank 🏦]\n\n❏ You do not have any loan to repay.");
        }
        if (amount > user.loan) {
          return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Your loan amount is $${formatNumber(user.loan)}. Please repay the exact amount or less.`);
        }
        if (amount > user.bank) {
          return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ You do not have enough balance to repay the loan. Your bank balance is $${formatNumber(user.bank)}.`);
        }
        user.loan -= amount;
        user.bank -= amount;
        if (user.loan === 0) {
          user.loanPayed = true;
          user.loanTakenAt = null;
        }
        await user.save();
        return message.reply(`[🏦 Aiko Bank 🏦]\n\n❏ Successfully repaid $${formatNumber(amount)} towards your loan.`);

      default:
        return message.reply("\n\n[🏦 Aiko Bank 🏦]\n\n❏ Please use one of the following valid commands:\n- Bank Deposit\n- Bank Withdraw\n- Bank Balance\n- Bank Interest\n- Bank Transfer\n- Bank Richest\n- Bank Loan\n- Bank PayLoan\n\n");
    }
  }
};

// Function to format a number with full forms (e.g., 1 Thousand, 133 Million, 76.2 Billion)
function formatNumber(number) {
  if (typeof number !== "number" || isNaN(number)) return "0";
  const units = ["", "Thousand", "Million", "Billion", "Trillion"];
  let unit = 0;
  while (number >= 1000 && unit < units.length - 1) {
    number /= 1000;
    unit++;
  }
  return `${number.toFixed(2)} ${units[unit]}`;
}