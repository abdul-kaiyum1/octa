const fs = require("fs");
const path = require("path");

// Utility function to get formatted date and time
function getFormattedDateTime() {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
  return { date, time };
}

// Utility function to generate a receipt
function generateReceipt(type, details) {
  const { date, time } = getFormattedDateTime();
  return `
------------------------------------------------------------
                Aiko Bank - ${type} Receipt
------------------------------------------------------------

Date: ${date}
Time: ${time}

${type} Details:
------------------------------------------------------------
${details}

------------------------------------------------------------
Thank you for using Aiko Bank!
For inquiries, contact support@aikobank.com
------------------------------------------------------------
`;
}

module.exports = {
  config: {
    name: "bank",
    version: "1.0",
    description: "Manage your money with Aiko Trust Bank",
    guide: {
      en: "{pn}Bank:\n * 💰 Deposit\n * 💸 Withdraw\n * 💳 Balance\n * 📈 Interest\n * 🔄 Transfer\n * 👑 Richest\n * 💼 Loan\n * 💵 Payloan"
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

    const bankDataPath = path.join(__dirname, 'data', 'bank.json');
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
    const now = Date.now();

    switch (command) {
      case "deposit":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ Please enter a valid amount to deposit.");
        }
        if (userMoney < amount) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ You don't have enough money to deposit.");
        }
        bankData[user].bank += amount;
        await usersData.set(event.senderID, { money: userMoney - amount });
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(generateReceipt('Deposit', `Transaction Type: Deposit\nAccount Number: XXXX-XXXX-XXXX-1234\nAmount: $${amount.toFixed(2)}\nBalance: $${bankData[user].bank.toFixed(2)}`));
      
      case "withdraw":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ Please enter a valid amount to withdraw.");
        }
        if (bankData[user].bank < amount) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ You don't have enough money in your bank account to withdraw.");
        }
        bankData[user].bank -= amount;
        await usersData.set(event.senderID, { money: userMoney + amount });
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(generateReceipt('Withdraw', `Transaction Type: Withdraw\nAccount Number: XXXX-XXXX-XXXX-1234\nAmount: $${amount.toFixed(2)}\nBalance: $${bankData[user].bank.toFixed(2)}`));
      
      case "balance":
        return message.reply(`[🏦 Aiko Trust Bank 🏦]\n❏ Your bank balance is: $${formatNumberWithFullForm(bankData[user].bank)}. Your future is secure with us.`);
      
      case "interest":
        const lastInterestClaimed = bankData[user].lastInterestClaimed;
        const timeDiff = (now - lastInterestClaimed) / (1000 * 60 * 60 * 24); // difference in days

        if (timeDiff < 2) {
          const remainingTime = 2 - timeDiff;
          const remainingHours = Math.floor(remainingTime * 24);
          const remainingMinutes = Math.floor((remainingTime * 24 * 60) % 60);
          return message.reply(`[🏦 Aiko Trust Bank 🏦]\n❏ You have already claimed your interest. You can claim it again in ${remainingHours} hours and ${remainingMinutes} minutes.`);
        }

        const interestEarned = bankData[user].bank * 0.05;
        bankData[user].bank += interestEarned;
        bankData[user].lastInterestClaimed = now;
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(generateReceipt('Interest', `Interest Earned: $${interestEarned.toFixed(2)}\nBalance: $${bankData[user].bank.toFixed(2)}`));
      
      case "transfer":
        if (isNaN(amount) || amount <= 0) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ Please enter a valid amount to transfer.");
        }
        if (!recipientUID || !bankData[recipientUID]) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ Recipient not found. Please check the recipient's ID.");
        }
        if (recipientUID === user) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ You cannot transfer money to yourself.");
        }
        if (bankData[user].bank < amount) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ You don't have enough money in your bank account for this transfer.");
        }
        bankData[user].bank -= amount;
        bankData[recipientUID].bank += amount;
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(generateReceipt('Transfer', `From Account: XXXX-XXXX-XXXX-1234\nTo Account: XXXX-XXXX-XXXX-5678\nAmount: $${amount.toFixed(2)}`));
      
      case "richest":
        const sortedUsers = Object.entries(bankData).sort(([, a], [, b]) => b.bank - a.bank).slice(0, 10);
        const richestUsers = await Promise.all(sortedUsers.map(async ([userID, data], index) => {
          const userName = await usersData.getName(userID);
          return `${index + 1}. ${userName} - $${formatNumberWithFullForm(data.bank)}`;
        }));
        return message.reply(`[🏦 Aiko Trust Bank 🏦]\n❏ Top 10 richest users:\n\n${richestUsers.join("\n\n\n")}. Strive for greatness with Aiko Bank.`);
      
      case "loan":
        if (isNaN(amount) || amount <= 0 || amount > 50000) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ Please enter a valid loan amount (up to $50,000).");
        }
        const loanTimeDiff = (now - bankData[user].loanTakenTime) / (1000 * 60 * 60 * 24);
        if (bankData[user].loan > 0 && loanTimeDiff < 7) {
          return message.reply(`[🏦 Aiko Trust Bank 🏦]\n❏ You have an outstanding loan. Please repay it before taking a new one.`);
        }
        bankData[user].loan = amount;
        bankData[user].loanTakenTime = now;
        bankData[user].loanInterestRate = 0.02;
        bankData[user].bank += amount;
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(generateReceipt('Loan', `Loan Amount: $${amount.toFixed(2)}\nBalance: $${bankData[user].bank.toFixed(2)}\nPlease repay within 7 days to avoid additional interest.`));
      
      case "payloan":
        const loanBalance = bankData[user].loan;
        if (isNaN(amount) || amount <= 0 || amount > loanBalance) {
          return message.reply("[🏦 Aiko Trust Bank 🏦]\n❏ Please enter a valid amount to repay your loan.");
        }
        if (userMoney < amount) {
          return message.reply(`[🏦 Aiko Trust Bank 🏦]\n❏ You don't have enough money to repay $${amount}.`);
        }
        bankData[user].loan -= amount;
        if (bankData[user].loan === 0) {
          bankData[user].loanTakenTime = 0;
          bankData[user].loanInterestRate = 0.02;
        }
        await usersData.set(event.senderID, { money: userMoney - amount });
        fs.writeFileSync(bankDataPath, JSON.stringify(bankData), "utf8");
        return message.reply(generateReceipt('Loan Repayment', `Repayment Amount: $${amount.toFixed(2)}\nRemaining Loan Balance: $${bankData[user].loan.toFixed(2)}`));
      
      default:
        return message.reply("🏦 Welcome to Aiko Trust Bank 🏦\n❏ Please use one of the following commands:\n * 💰 Deposit\n * 💸 Withdraw\n * 💳 Balance\n * 📈 Interest\n * 🔄 Transfer\n * 👑 Richest\n * 💼 Loan\n * 💵 Payloan");
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
    "Googol"
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
  const bankDataPath = path.join(__dirname, 'data', 'bank.json');
  const bankData = JSON.parse(fs.readFileSync(bankDataPath, "utf8"));
  const now = Date.now();

  for (const user in bankData) {
    const loanTimeDiff = (now - bankData[user].loanTakenTime) / (1000 * 60 * 60 * 24); // difference in days

    if (bankData[user].loan > 0) {
      if (loanTimeDiff >= 7) {
        bankData[user].loanInterestRate = 0.03; // Increase interest rate after 7 days
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

setInterval(handleAutomaticLoanRepayment, 24 * 60 * 60 * 1000);