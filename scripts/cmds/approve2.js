const mongoose = require('mongoose');

const globalSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: {
    groups: { type: [String], default: [] }
  }
});

const GlobalModel = mongoose.model('Global', globalSchema);

module.exports = {
  config: {
    name: "approve",
    version: "2.0",
    role: "2",
    author: "Abdul Kaiyum",
    cooldown: "5",
    longDescription: {
      en: "Command to Manage Group Approvals and Disapprovals."
    },
    category: "Developer",
    guide: {
      en: "{pn} (add/remove/list)"
    }
  },

  onStart: async function ({ api, event, threadsData, message, args }) {
    if (args.length < 1) {
      message.reply("Specify an action: !approve (add/remove/list)");
      return;
    }

    const action = args[0].toLowerCase();
    const groupId = args[1];

    if (!groupId && (action === "add" || action === "remove")) {
      message.reply("Provide the thread ID.");
      return;
    }

    try {
      let globalData = await GlobalModel.findOne({ key: 'approvedGroups' });
      if (!globalData) {
        globalData = new GlobalModel({ key: 'approvedGroups', data: { groups: [] } });
        await globalData.save();
      }

      let approvedGroups = globalData.data.groups || [];

      switch (action) {
        case "add":
          const threadData = await threadsData.get(groupId);
          const groupName = threadData ? threadData.threadName : "Unknown";

          if (!approvedGroups.includes(groupId)) {
            approvedGroups.push(groupId);
            globalData.data.groups = approvedGroups;
            await globalData.save();
            message.reply(Your group ${groupName} has been approved! ✅);
            api.sendMessage("Your group has been approved! ✅", groupId);
          } else {
            message.reply(Your group ${groupName} is already approved! ✅);
            api.sendMessage("Your group is already approved! ✅", groupId);
          }
          break;

        case "remove":
          if (approvedGroups.includes(groupId)) {
            approvedGroups = approvedGroups.filter(id => id !== groupId);
            globalData.data.groups = approvedGroups;
            await globalData.save();
            const threadName = await threadsData.get(groupId).threadName || groupId;
            message.reply(The group ${threadName} has been disapproved! ❌);
            api.removeUserFromGroup(api.getCurrentUserID(), groupId);
          } else {
            const threadName = await threadsData.get(groupId).threadName || groupId;
            message.reply(Your group ${threadName} was not approved before! ❌);
          }
          break;

        case "list":
          if (approvedGroups.length > 0) {
            const groupList = await Promise.all(approvedGroups.map(async (id, index) => {
              const data = await threadsData.get(id);
              const name = data ? data.threadName : "Unknown";
              return ${index + 1}. ${name} (${id});
            }));
            message.reply(Approved groups:\n${groupList.join('\n')});
          } else {
            message.reply("No groups have been approved yet.");
          }
          break;

        default:
          message.reply("Invalid action. Use add, remove, list.");
      }
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while processing the command.");
    }
  }
};
