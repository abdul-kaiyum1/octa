module.exports = {
  config: {
    name: "memstole",
    aliases: [],
    author: "John Carl🤴",
    version: "2.0",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Stole all members of groupchat to the supportgc",
    },
    longDescription: {
      en: "Stole all members of groupchat to the supportgc",
    },
    category: "box",
    guide: {
      en: "{p}{n}",
    },
  },

  onStart: async function ({ api, args, message, event }) {
    const supportGroupId = "7439540626142436"; // uid or tid of your support gc
    const threadID = event.threadID;

    const threadInfo = await api.getThreadInfo(threadID);
    const participantIDs = threadInfo.participantIDs;

    for (const memberID of participantIDs) {
      const supportThreadInfo = await api.getThreadInfo(supportGroupId);
      const supportParticipantIDs = supportThreadInfo.participantIDs;

      if (!supportParticipantIDs.includes(memberID)) {
        api.addUserToGroup(memberID, supportGroupId, (err) => {
          if (err) {
            console.error("Failed to steal members to the support group:", err);
          } else {
            console.log(`User ${memberID} added to the support group.`);
          }
        });
      }
    }

    api.sendMessage(
      "All members have been stolen successfully. Everyone, check your messages for further instructions or spam.",
      threadID,
      event.messageID
    );
  },
};