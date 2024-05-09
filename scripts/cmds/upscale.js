const axios = require("axios");

module.exports = {
  config: {
    name: "upscale",
    aliases: ["4k"],
    role: 0,
    author: "TCA",
    countDown: 40,
    longDescription: "Upscale images",
    category: "Image Processing",
    guide: {
      en: "${pn} reply to an image to upscale it"
    }
  },
  onStart: async function ({ message, api, args, event }) {
    if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
      return message.reply("Please reply to an image to upscale it.");
    }

    const imageUrl = event.messageReply.attachments[0].url;

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      // Fetch the image data and convert it to base64
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');

      const response = await axios.post('https://access1.imglarger.com/PhoAi/Upload', {
        base64Image,
        type: 0,
        scaleRadio: '8'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'YourAppName/1.0'
        }
      });

      const code = response.data.data.code;

      let retries = 10;
      while (retries > 0) {
        const upscaledImageResponse = await axios.post("https://access1.imglarger.com/PhoAi/CheckStatus", {
          code,
          type: 0,
          scaleRadio: "8"
        }, {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "YourAppName/1.0"
          }
        });

        if (upscaledImageResponse.data.code === 200 && upscaledImageResponse.data.data.status === 'success' && upscaledImageResponse.data.data.downloadUrls) {
          const upscaledImageUrl = upscaledImageResponse.data.data.downloadUrls[0];

          try {
            // Upload the upscaled image to ImgBB
            const apiKey = 'fc5b574c7b0834fe36e7ce4e9ec3e9aa';
            const imgbbResponse = await axios.get(`https://api.imgbb.com/1/upload?key=${apiKey}&image=${encodeURIComponent(upscaledImageUrl)}`);
            const imgbbUrl = imgbbResponse.data.data.url;

            const attachment = await global.utils.getStreamFromURL(upscaledImageUrl);
            message.reply({
              body: ` Successfully upscaled! ✅\nDownload link: ${imgbbUrl}`,
              attachment: attachment
            });
            api.setMessageReaction("✅", event.messageID, () => {}, true);
            return;
          } catch (error) {
            console.error("Error uploading image to ImgBB:", error);
            message.reply("Failed to upload the upscaled image. Please try again later.");
            return;
          }
        } else if (upscaledImageResponse.data.data.status === 'waiting') {
          console.log("Upscaling in progress. Retrying later...");
          await new Promise(resolve => setTimeout(resolve, 30000)); // Wait for 30 seconds
          retries--;
          continue;
        } else {
          console.log(`Error fetching upscaled image: ${JSON.stringify(upscaledImageResponse.data)}`);
          message.reply("Failed to fetch the upscaled image.");
          return;
        }
      }

      if (retries === 0) {
        message.reply("Failed to fetch the upscaled image after multiple attempts.");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      message.reply("Failed to process the image.");
    }
  }
};