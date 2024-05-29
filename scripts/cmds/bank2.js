const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "bank",
    version: "1.0",
    description: "Manage your money with Aiko Bank",
    guide: {
      en: "{pn}Bank:\n - Deposit\n - Withdraw\n - Balance\n - Interest\n - Transfer\n - Richest\n - Loan\n - PayLoan"
    },
    category: "Economy",
    countDown: 6,
    role: 0,
    author: "Abdul Kaiyum"
  },
  onStart: async function ({ args, message, event, api, usersData }) {
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);
    const userMoney = await usersData.get(event.senderID, "money");
    const user = parseInt(event.senderID);
    const info = await api.getUserInfo(user);
    const username = info[user].name;

    const bankDataPath = './bank.json';
    if (!fs.existsSync(bankDataPath)) {
      fs.writeFileSync(bankDataPath, JSON.stringify({}), "utf8");
    }

    const bankData = JSON.parse(fs.readFileSync(bankDataPath, "utf8"));
    if (!bankData[user]) {
      bankData[user] = { bank: 0, loan: 0, lastInterestClaimed: 0, loanTakenTime: 0, loanInterestRate: 0.02 };
      fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
    }

    const command = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);
    const recipientUID = parseInt(args[2]);

    switch (command) {
      case "deposit":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ Please enter a valid amount to deposit.");
        }
        if (userMoney < amount) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ You don't have enough money to deposit.");
        }
        bankData[user].bank += amount;
        await usersData.set(event.senderID, { money: userMoney - amount });
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(`[🏦 Aiko Bank 🏦]\n❏ Successfully deposited $${amount}. Your money is in safe hands.`);
      
      case "withdraw":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ Please enter a valid amount to withdraw.");
        }
        if (bankData[user].bank < amount) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ You don't have enough money in your bank account to withdraw.");
        }
        bankData[user].bank -= amount;
        await usersData.set(event.senderID, { money: userMoney + amount });
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(`[🏦 Aiko Bank 🏦]\n❏ Successfully withdrew $${amount}. Your money is now with you.`);
      
      case "balance":
        return message.reply(`[🏦 Aiko Bank 🏦]\n❏ Your bank balance is: $${formatNumberWithFullForm(bankData[user].bank)}. Your future is secure with us.`);
      
      case "interest":
        const now = Date.now();
        const lastInterestClaimed = bankData[user].lastInterestClaimed;
        const timeDiff = (now - lastInterestClaimed) / (1000 * 60 * 60 * 24); // difference in days

        if (timeDiff < 2) {
          const remainingTime = 2 - timeDiff;
          const remainingHours = Math.floor(remainingTime * 24);
          const remainingMinutes = Math.floor((remainingTime * 24 * 60) % 60);
          return message.reply(`[🏦 Aiko Bank 🏦]\n❏ You have already claimed your interest. You can claim it again in ${remainingHours} hours and ${remainingMinutes} minutes.`);
        }

        const interestEarned = bankData[user].bank * 0.05;
        bankData[user].bank += interestEarned;
        bankData[user].lastInterestClaimed = now;
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(`[🏦 Aiko Bank 🏦]\n❏ You have earned interest of $${interestEarned.toFixed(2)}. It has been added to your account. Enjoy the benefits of saving with Aiko Bank.`);
      
      case "transfer":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ Please enter a valid amount to transfer.");
        }
        if (!recipientUID || !bankData[recipientUID]) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ Recipient not found. Please check the recipient's ID.");
        }
        if (recipientUID === user) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ You cannot transfer money to yourself.");
        }
        if (bankData[user].bank < amount) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ You don't have enough money in your bank account for this transfer.");
        }
        bankData[user].bank -= amount;
        bankData[recipientUID].bank += amount;
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(`[🏦 Aiko Bank 🏦]\n❏ Successfully transferred $${amount} to ${await usersData.getName(recipientUID)}. Sharing is caring.`);
      
      case "richest":
        const sortedUsers = Object.entries(bankData).sort(([, a], [, b]) => b.bank - a.bank).slice(0, 10);
        const richestUsers = await Promise.all(sortedUsers.map(async ([userID, data], index) => {
          const userName = await usersData.getName(userID);
          return `${index + 1}. ${userName} - $${formatNumberWithFullForm(data.bank)}`;
        }));
        return message.reply(`[🏦 Aiko Bank 🏦]\n❏ Top 10 richest users:\n\n${richestUsers.join("\n\n")}. Strive for greatness with Aiko Bank.`);
      
      case "loan":
        if (isNaN(amount) || amount <= 0 || amount > 100000) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ Please enter a valid loan amount (up to $100,000).");
        }
        const loanTimeDiff = (now - bankData[user].loanTakenTime) / (1000 * 60 * 60 * 24);
        if (bankData[user].loan > 0 && loanTimeDiff < 10) {
          return message.reply(`[🏦 Aiko Bank 🏦]\n❏ You have an outstanding loan. Please repay it before taking a new one.`);
        }
        bankData[user].loan = amount;
        bankData[user].loanTakenTime = now;
        bankData[user].loanInterestRate = 0.02;
        bankData[user].bank += amount;
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(`[🏦 Aiko Bank 🏦]\n❏ You have successfully taken a loan of $${amount}. Please repay within 10 days to avoid additional interest.`);
      
      case "payloan":
        const loanBalance = bankData[user].loan;
        if (isNaN(amount) || amount <= 0 || amount > loanBalance) {
          return message.reply("[🏦 Aiko Bank 🏦]\n❏ Please enter a valid amount to repay your loan.");
        }
        if (userMoney < amount) {
          return message.reply(`[🏦 Aiko Bank 🏦]\n❏ You don't have enough money to repay $${amount}.`);
        }
        bankData[user].loan -= amount;
        if (bankData[user].loan === 0) {
          bankData[user].loanTakenTime = 0;
          bankData[user].loanInterestRate = 0.02;
        }
        await usersData.set(event.senderID, { money: userMoney - amount });
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(`[🏦 Aiko Bank 🏦]\n❏ Successfully repaid $${amount} of your loan. Remaining loan balance: $${bankData[user].loan}.`);
      
      default:
        return message.reply("[🏦 Aiko Bank 🏦]\n❏ Please use one of the following commands:\n - Deposit\n - Withdraw\n - Balance\n - Interest\n - Transfer\n - Richest\n - Loan\n - PayLoan");
    }
  }
};

function formatNumberWithFullForm(number) {
  const fullForms = [
    "",
    "Thousand",
    "Million",
    "Billion",
    "Trillion",
    "Quadrillion",
    "Quintillion",
    "Sextillion",
    "Septillion",
    "Octillion",
    "Nonillion",
    "Decillion",
    "Undecillion",
    "Duodecillion",
    "Tredecillion",
    "Quattuordecillion",
    "Quindecillion",
    "Sexdecillion",
    "Septendecillion",
    "Octodecillion",
    "Novemdecillion",
    "Vigintillion",
    "Unvigintillion",
    "Duovigintillion",
    "Tresvigintillion",
    "Quattuorvigintillion",
    "Quinvigintillion",
    "Sesvigintillion",
    "Septemvigintillion",
    "Octovigintillion",
    "Novemvigintillion",
    "Trigintillion",
    "Untrigintillion",
    "Duotrigintillion",
    "Googol",
  ];

  // Calculate the full form of the number (e.g., Thousand, Million, Billion)
  let fullFormIndex = 0;
  while (number >= 1000 && fullFormIndex < fullForms.length - 1) {
    number /= 1000;
    fullFormIndex++;
  }

  // Format the number with two digits after the decimal point
  const formattedNumber = number.toFixed(2);

  // Add the full form to the formatted number
  return `${formattedNumber} ${fullForms[fullFormIndex]}`;
}

// Function to handle automatic loan repayment with increased interest
function handleAutomaticLoanRepayment() {
  const bankDataPath = './bank.json';
  const bankData = JSON.parse(fs.readFileSync(bankDataPath, "utf8"));
  const now = Date.now();

  for (const user in bankData) {
    const loanTimeDiff = (now - bankData[user].loanTakenTime) / (1000 * 60 * 60 * 24); // difference in days

    if (bankData[user].loan > 0) {
      if (loanTimeDiff >= 10) {
        bankData[user].loanInterestRate = 0.03; // Increase interest rate after 10 days
        const interest = bankData[user].loan * bankData[user].loanInterestRate;
        bankData[user].loan += interest;
        bankData[user].bank -= bankData[user].loan;

        if (bankData[user].bank < 0) {
          bankData[user].loan = Math.abs(bankData[user].bank);
          bankData[user].bank = 0;
        } else {
          bankData[user].loan = 0;
          bankData[user].loanTakenTime = 0;
          bankData[user].loanInterestRate = 0.02;
        }
      }
    }
  }

  fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
}

// Schedule the automatic loan repayment function to run daily
setInterval(handleAutomaticLoanRepayment, 24 * 60 * 60 * 1000); // Run once every 24 hours
