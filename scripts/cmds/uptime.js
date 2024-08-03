const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

const banStatusFilePath = path.resolve(__dirname, 'mediaBanStatus.json');

// Function to read the current ban status from a file
function readBanStatus() {
    if (fs.existsSync(banStatusFilePath)) {
        const data = fs.readFileSync(banStatusFilePath, 'utf8');
        return JSON.parse(data).banStatus;
    }
    return false;
}

// Function to write the ban status to a file
function writeBanStatus(isBanned) {
    fs.writeFileSync(banStatusFilePath, JSON.stringify({ banStatus: isBanned }));
}

module.exports = {
    config: {
        name: "uptime",
        aliases: ["up", "upt"],
        version: "2.0",
        author: "Sahadat",
        role: 1,
        shortDescription: { en: "" },
        longDescription: { en: "" },
        category: "system",
        guide: { en: "" },
    },
    onStart: async function ({ api, event, usersData, threadsData, args }) {
        try {
            // Check for ban toggle commands
            if (args[0] === "ban" && (args[1] === "on" || args[1] === "off")) {
                const newBanStatus = args[1] === "on";
                writeBanStatus(newBanStatus);
                return api.sendMessage(`Media ban has been turned ${newBanStatus ? "on" : "off"}.`, event.threadID);
            }

            const totalUsers = await usersData.getAll();
            const allThreads = await threadsData.getAll();
            const uptime = process.uptime();
            
            const uptimeDuration = moment.duration(uptime, 'seconds');
            const hours = Math.floor(uptimeDuration.asHours());
            const minutes = uptimeDuration.minutes();
            const seconds = uptimeDuration.seconds();
            const totalUsersLength = totalUsers.length;
            const totalThreadsLength = allThreads.length;
            const pingStart = Date.now();
            const sentMessage = await api.sendMessage(this.thin("🟢 Processing..."), event.threadID);
            const pingEnd = Date.now() - pingStart;
            let pingStatus = "Good ✅";
            if (pingEnd > 500) {
                pingStatus = "Medium❗";
            }
            if (pingEnd > 1000) {
                pingStatus = "Bad ❎";
            }

            // Send "checking..." status
            const initialMessage = `
🟢 Bot Has Been Working For
- ${hours} Hr(s) ${minutes} Min(s) ${seconds} sec(s)
- Total Users: ${totalUsersLength}
- Total Threads: ${totalThreadsLength}
- Speed: ${pingEnd}ms
- Speed Status: ${pingStatus}
- Media Banned: 𝗖𝗵𝗲𝗰𝗸𝗶𝗻𝗴...
            `;
            await api.editMessage(this.thin(initialMessage), sentMessage.messageID);

            // Wait for 4 seconds
            await new Promise(resolve => setTimeout(resolve, 4000));

            // Get actual media ban status
            const mediaBanStatus = readBanStatus();
            const mediaBanText = mediaBanStatus ? "YES 🚫" : "NO ✅";

            const statusMessage = `
🟢 Bot Has Been Working For
- ${hours} Hr(s) ${minutes} Min(s) ${seconds} sec(s)
- Total Users: ${totalUsersLength}
- Total Threads: ${totalThreadsLength}
- Speed: ${pingEnd}ms
- Speed Status: ${pingStatus}
- Media Banned: ${mediaBanText}
            `;
            return api.editMessage(this.thin(statusMessage), sentMessage.messageID);
        } catch (err) {
            console.error(err);
            return api.editMessage("❌ An error occurred while fetching system statistics.", sentMessage.messageID);
        }
    },
    thin: (str) => str.replace(/(?!^)(?=(?:\S{3})+$)/g,""),
};