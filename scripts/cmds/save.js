const axios = require('axios');
const fs = require('fs');
const shortid = require('shortid');

module.exports = {
  config: {
    name: "save",
    aliases: ["store"],
    version: "2.0",
    author: "Abdul Kaiyum",
    description: "Save media files (images/videos/audio) to GitHub",
    category: "storage",
    guide: "{pn} <optional_tag>",
  },
  onStart: async function ({ api, event, args }) {
    const tag = args.join(" ") || "untagged";
    if (!event.messageReply || !event.messageReply.attachments) {
      return api.sendMessage("Please reply to a media file (image, video, or audio) to save it.", event.threadID);
    }

    const attachment = event.messageReply.attachments[0];
    const fileUrl = attachment.url;
    let fileExtension;

    // Check the type of media and set the correct file extension
    if (attachment.type === 'photo') {
      fileExtension = 'jpg';
    } else if (attachment.type === 'video') {
      fileExtension = 'mp4';
    } else if (attachment.type === 'audio') {
      fileExtension = 'mp3'; // Assuming the audio is mp3 format, adjust as necessary
    } else {
      return api.sendMessage("Unsupported file type. Please reply to an image, video, or audio file.", event.threadID);
    }

    const fileName = `${shortid.generate()}.${fileExtension}`;

    try {
      const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const base64Content = Buffer.from(fileResponse.data).toString('base64');

      // Dynamically import Octokit to fix module error
      const { Octokit } = await import("@octokit/rest");
      const octokit = new Octokit({ auth: "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" });

      const filePath = `${tag}/${fileName}`;
      await octokit.repos.createOrUpdateFileContents({
        owner: "abdul-kaiyum1",
        repo: "save",
        path: filePath,
        message: `Save media: ${fileName}`,
        content: base64Content,
      });

      return api.sendMessage(`File saved as ${fileName} under tag: ${tag}`, event.threadID);
    } catch (error) {
      console.error("Error saving file:", error);
      return api.sendMessage("Error occurred while saving the file.", event.threadID);
    }
  }
};