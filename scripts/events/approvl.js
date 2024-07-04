const { getStreamFromURL } = global.utils;
const mongoose = require('mongoose');

// Check if the model is already compiled
const GlobalModel = mongoose.models.Global || mongoose.model('Global', new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: {
    groups: { type: [String], default: [] }
  }
}));

module.exports = {
  config: {
    name: "approval",
    version: "1.0",
    author: "Ohio03 | @tu33rtle.xy",
    category: "events"
  },
  onStart: async function ({ api, event, threadsData, message }) {
    const uid = "100057399829870";
    const groupId = event.threadID;
    const threadData = await threadsData.get(groupId);
    const name = threadData.threadName;
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);    

    // Get the approved groups from the database
    let globalData = await GlobalModel.findOne({ key: 'approvedGroups' });
    if (!globalData) {
      globalData = new GlobalModel({ key: 'approvedGroups', data: { groups: [] } });
      await globalData.save();
    }
    const approvedGroups = globalData.data.groups || [];

    if (!approvedGroups.includes(groupId) && event.logMessageType === "log:subscribe") {
      await message.send({
        body: ❎ | You Added The Aiko Without Permission !!\n\n✧Take Permission From my Admin's to Use Aiko In Your Group !!\n✧Join cat Support GC to Contact With Admin's !!\n\n✧Type ${p}supportgc within 30 seconds.,
        attachment: await getStreamFromURL("https://i.ibb.co/5992ZSF/421631450.jpg")
      });

      await new Promise((resolve) => setTimeout(resolve, 30000)); // Delay of 30 seconds

      await api.sendMessage(
        ====== Approval ======\n\nGroup:- ${name}\nTID:- ${groupId}\nEvent:- The Group Needs Approval,
        uid,
        async () => {
          await api.removeUserFromGroup(api.getCurrentUserID(), groupId);
        }
      );
    }
  }
};
