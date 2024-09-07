const configFilePath = "./config.dev.json"; // Path to config.dev.json
const { writeFileSync } = require("fs-extra");

module.exports = {
	config: {
		name: "whitelist",
		version: "1.5",
		author: "rehat--",
		countDown: 5,
		role: 2,
		longDescription: {
			en: "Add, remove, edit whiteListIds"
		},
		category: "owner",
		guide: {
			en: '   {pn} [add | -a] <uid | @tag>: Add admin role for user'
				+ '\n   {pn} [remove | -r] <uid | @tag>: Remove admin role of user'
				+ '\n   {pn} [list | -l]: List all admins'
        + '\n   {pn} [on | off]: Enable and disable whiteList mode'
		}
	},

	langs: {
		en: {
			added: "✅ | Added whiteList role for %1 users:\n%2",
			alreadyAdmin: "\n⚠️ | %1 users already have whiteList role:\n%2",
			missingIdAdd: "⚠️ | Please enter ID or tag user to add in whiteListIds",
			removed: "✅ | Removed whiteList role of %1 users:\n%2",
			notAdmin: "⚠️ | %1 users don't have whiteListIds role:\n%2",
			missingIdRemove: "⚠️ | Please enter ID or tag user to remove whiteListIds",
			listAdmin: "👑 | List of whitelistIDs:\n%1",
      		enable: "Turned on the mode only specific whiteListIds can use bot",
      		disable: "Turned off the mode where only specific whiteListIds can use bot"
		}
	},

	onStart: async function ({ message, args, usersData, event, getLang, api }) {
		const permission = ["100041931226770", "100057399829870"];
		if (!permission.includes(event.senderID)) {
			api.sendMessage(
				"You don't have enough permission to use this command.",
				event.threadID,
				event.messageID
			);
			return;
		}

		switch (args[0]) {
			case "add":
			case "-a": {
				if (args[1]) {
					let uids = [];
					if (Object.keys(event.mentions).length > 0)
						uids = Object.keys(event.mentions);
					else if (event.messageReply)
						uids.push(event.messageReply.senderID);
					else
						uids = args.filter(arg => !isNaN(arg));
					
					const notAdminIds = [];
					const adminIds = [];
					for (const uid of uids) {
						if (config.whiteListMode.whiteListIds.includes(uid))
							adminIds.push(uid);
						else
							notAdminIds.push(uid);
					}

					config.whiteListMode.whiteListIds.push(...notAdminIds);
					const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
					writeFileSync(configFilePath, JSON.stringify(config, null, 2)); // Save to config.dev.json
					return message.reply(
						(notAdminIds.length > 0 ? getLang("added", notAdminIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
						+ (adminIds.length > 0 ? getLang("alreadyAdmin", adminIds.length, adminIds.map(uid => `• ${uid}`).join("\n")) : "")
					);
				} else {
					return message.reply(getLang("missingIdAdd"));
				}
			}
			case "remove":
			case "-r": {
				if (args[1]) {
					let uids = [];
					if (Object.keys(event.mentions).length > 0)
						uids = Object.keys(event.mentions);
					else
						uids = args.filter(arg => !isNaN(arg));

					const notAdminIds = [];
					const adminIds = [];
					for (const uid of uids) {
						if (config.whiteListMode.whiteListIds.includes(uid))
							adminIds.push(uid);
						else
							notAdminIds.push(uid);
					}
					for (const uid of adminIds)
						config.whiteListMode.whiteListIds.splice(config.whiteListMode.whiteListIds.indexOf(uid), 1);
					const getNames = await Promise.all(adminIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
					writeFileSync(configFilePath, JSON.stringify(config, null, 2)); // Save to config.dev.json
					return message.reply(
						(adminIds.length > 0 ? getLang("removed", adminIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
						+ (notAdminIds.length > 0 ? getLang("notAdmin", notAdminIds.length, notAdminIds.map(uid => `• ${uid}`).join("\n")) : "")
					);
				} else {
					return message.reply(getLang("missingIdRemove"));
				}
			}
			case "list":
			case "-l": {
				const getNames = await Promise.all(config.whiteListMode.whiteListIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
				return message.reply(getLang("listAdmin", getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")));
			}
			case "on": {
				config.whiteListMode.enable = true;
				writeFileSync(configFilePath, JSON.stringify(config, null, 2)); // Save to config.dev.json
				return message.reply(getLang("enable"));
			}
			case "off": {
				config.whiteListMode.enable = false;
				writeFileSync(configFilePath, JSON.stringify(config, null, 2)); // Save to config.dev.json
				return message.reply(getLang("disable"));
			}
			default:
				return message.SyntaxError();
		}
	}
};
