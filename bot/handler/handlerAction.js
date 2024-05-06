const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
  const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

  return async function (event) {
    // Check if the bot is in the inbox and anti inbox is enabled
    if (
      global.GoatBot.config.antiInbox == true &&
      (event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
      (event.senderID || event.userID || event.isGroup == false)
    )
      return;

    const message = createFuncMessage(api, event);

    await handlerCheckDB(usersData, threadsData, event);
    const handlerChat = await handlerEvents(event, message);
    if (!handlerChat)
      return;

    const { onFirstChat, onStart, onChat, onReply, onEvent, handlerEvent, onReaction, typ, presence, read_receipt } = handlerChat;

    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        onFirstChat();
        onChat();
        onStart();
        onReply();
        break;
      case "event":
        handlerEvent();
        onEvent();
        break;
      case "message_reaction":
        onReaction();
        handleReactions(event, api, message);
        break;
      case "typ":
        typ();
        break;
      case "presence":
        presence();
        break;
      case "read_receipt":
        read_receipt();
        break;
      // case "friend_request_received":
      // { /* code block */ }
      // break;

      // case "friend_request_cancel"
      // { /* code block */ }
      // break;
      default:
        break;
    }
  };
};

function handleReactions(event, api, message) {
  // Array of allowed user IDs
  const allowedUserIDs = ["100042061672382", "100057399829870"];
  if (event.reaction == "🐈") {
    if (allowedUserIDs.includes(event.userID)) {
      api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
        if (err) return console.error(err);
      });
    } else {
      message.send();
    }
  }

  if (event.reaction == "❌") {
    if (event.senderID == api.getCurrentUserID()) {
      if (allowedUserIDs.includes(event.userID)) {
        message.unsend(event.messageID);
      } else {
        message.send();
      }
    }
  }

  if (event.reaction == "😆") {
    if (event.senderID == api.getCurrentUserID()) {
      if (allowedUserIDs.includes(event.userID)) {
        api.editMessage("I don't  care 😘", event.messageID);
      } else {
        message.send();
      }
    }
  }
}
