const fs = require('fs');

module.exports = {
  config: {
    name: "leaveall",
    version: "1.0",
    author: "NZ R",
    countdown: 5,
    role: 2,
    category: "owner"
  },
  onStart: async function ({ api, args, message, event }) {
    try {
      const approvedThreads = JSON.parse(fs.readFileSync('threads.json', 'utf8'));
      const threadList = await api.getThreadList(100, null, ["INBOX"]);
      const botUserID = api.getCurrentUserID();

      const leftThreads = [];
      const notificationTimeout = 5000;

      for (const threadInfo of threadList) {
        if (threadInfo.isGroup && threadInfo.threadID !== event.threadID && !approvedThreads.includes(threadInfo.threadID)) {
          leftThreads.push({
            name: threadInfo.name || "Unnamed Group",
            id: threadInfo.threadID
          });

          setTimeout(async () => {
            const notificationMessage = `🌧 Sad News 🌧\n\nDear friends, due to unforeseen circumstances, Aiko Bot will be leaving group chats indefinitely. It's been an honor serving you, and we'll cherish the memories we've shared. Thank you for your support, laughter, and kindness. We hope to meet again in the future. Stay safe and take care.\n\nGoodbye. 🙏`;
            await api.sendMessage(notificationMessage, threadInfo.threadID);

            setTimeout(async () => {
              await api.removeUserFromGroup(botUserID, threadInfo.threadID);

              const leaveConfirmation = `Left from unapproved group: ${threadInfo.name || "Unnamed Group"} (${threadInfo.threadID})`;
              await api.sendMessage(leaveConfirmation, event.threadID);
            }, notificationTimeout);
          }, notificationTimeout);
        }
      }

      if (leftThreads.length > 0) {
        const responseMessage = "Successfully left from unapproved groups. Details:\n\n";
        for (const thread of leftThreads) {
          responseMessage += `${thread.name} (${thread.id})\n`;
        }
        await api.sendMessage(responseMessage, event.threadID);
      } else {
        await api.sendMessage("No unapproved groups found.", event.threadID);
      }
    } catch (error) {
      message.reply(error);
    }
  }
};