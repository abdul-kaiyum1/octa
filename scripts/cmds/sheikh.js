const axios = require('axios');
const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');

const fonts = {
  Shayan: 'https://github.com/MBBXMESBAH/font/raw/main/Shayan.ttf',
  go3v2: 'https://github.com/MBBXMESBAH/font/raw/main/go3v2.ttf',
  RamadanKareemDisplay: 'https://github.com/MBBXMESBAH/font/raw/main/RamadanKareem-Display.ttf',
};

async function registerFonts() {
  try {
    await Promise.all(Object.entries(fonts).map(async ([fontName, fontUrl]) => {
      const res = await axios.get(fontUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(`./${fontName}.ttf`, Buffer.from(res.data), 'binary');
      registerFont(`./${fontName}.ttf`, { family: fontName });
      console.log(`Font ${fontName} loaded successfully.`);
    }));
  } catch (err) {
    console.error('Error loading fonts:', err);
    throw err;
  }
}

async function getPrayerTimes(city, country, method) {
  const url = 'https://api.aladhan.com/v1/timingsByCity';
  try {
    const response = await axios.get(url, {
      params: {
        city: city,
        country: country,
        method: method
      }
    });
    return response.data.data.timings;
  } catch (error) {
    console.error(`Error fetching prayer times: ${error}`);
    throw error;
  }
}

function convertTo12HourFormat(time) {
  const [hour, minute] = time.split(':');
  const hourInt = parseInt(hour, 10);
  const period = hourInt >= 12 ? 'PM' : 'AM';
  const hour12 = hourInt === 0 ? 12 : hourInt > 12 ? hourInt - 12 : hourInt;
  return `${hour12}:${minute} ${period}`;
}

function getRemainingTime(prayerTime) {
  const currentTime = new Date();
  const [hour, minute] = prayerTime.split(':').map(Number);
  const prayerDate = new Date(currentTime);
  prayerDate.setHours(hour, minute, 0, 0);

  const remainingTime = prayerDate - currentTime;
  if (remainingTime <= 0) return 'Passed';

  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours} H ${minutes} M`;
}

module.exports.config = {
  name: 'namaz',
  aliases: ['prayer'],
  version: '2.0',
  credits: 'Mesbah Bb\'e',
  usePrefix: true,
  cooldowns: 5,
  hasPermssion: 0,
  description: 'View Prayer time',
  commandCategory: '𝗜𝗦𝗟𝗔𝗠',
  usages: '{pn} <country> <city>',
};

module.exports.onStart = async function ({ api, args, event }) {
  try {
    await registerFonts();

    const [country, ...cityParts] = args;
    const city = cityParts.join(' ');
    const method = 2;

    const timings = await getPrayerTimes(city, country, method);
    const formattedTimings = {
      Fajr: convertTo12HourFormat(timings.Fajr),
      Dhuhr: convertTo12HourFormat(timings.Dhuhr),
      Asr: convertTo12HourFormat(timings.Asr),
      Maghrib: convertTo12HourFormat(timings.Maghrib),
      Isha: convertTo12HourFormat(timings.Isha),
    };

    const prayerTimeText =
      `🕋🌙 𝙿𝚛𝚊𝚢𝚎𝚛 𝚝𝚒𝚖𝚎𝚜 🕋🌙\n` +
      `🏙️ 𝙲𝚒𝚝𝚢 𝙽𝚊𝚖𝚎: ${city}\n\n` +
      `🕌 𝙵𝚊𝚓𝚛: ${formattedTimings.Fajr}\n` +
      `🕌 𝙳𝚑𝚞𝚛: ${formattedTimings.Dhuhr}\n` +
      `🕌 𝙰𝚜𝚛: ${formattedTimings.Asr}\n` +
      `🕌 𝙼𝚊𝚐𝚑𝚛𝚒𝚋: ${formattedTimings.Maghrib}\n` +
      `🕌 𝙸𝚜𝚑𝚊: ${formattedTimings.Isha}\n`;

    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    const backgroundUrl = 'https://i.ibb.co/mbWJf8g/New-Project-10-4-F55521.png';
    const backgroundImage = await loadImage(backgroundUrl);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    const currentTime = new Date();

    ctx.font = '24px go3v2';
    ctx.fillStyle = 'white';
    ctx.fillText('Bot Name: Gojo Satoru AI', 250, 350);
    ctx.fillText(`Date: ${currentTime.toLocaleDateString()}`, 310, 80);
    ctx.fillText(`Time: ${currentTime.toLocaleTimeString()}`, 300, 50);

    const prayerTimes = [
      { name: 'Fajr', time: formattedTimings.Fajr },
      { name: 'Dhuhr', time: formattedTimings.Dhuhr },
      { name: 'Asr', time: formattedTimings.Asr },
      { name: 'Maghrib', time: formattedTimings.Maghrib },
      { name: 'Isha', time: formattedTimings.Isha },
    ];

    prayerTimes.forEach((prayer, index) => {
      const x = 50 + (index * 150);
      ctx.fillStyle = ['#1E3A8A', '#F59E0B', '#B91C1C', '#4338CA', '#1E3A8A'][index];
      ctx.fillRect(x, 100, 120, 200);

      ctx.fillStyle = 'white';
      ctx.font = '16px go3v2';
      ctx.fillText(prayer.time, x + 10, 140);
      ctx.fillText('Remaining Time:', x + 10, 170);
      ctx.fillText(getRemainingTime(prayer.time), x + 10, 200);

      ctx.font = '20px RamadanKareemDisplay';
      ctx.fillText(prayer.name, x + 10, 240);
    });

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./prayerTimes.png', buffer);

    api.sendMessage({
      body: prayerTimeText,
      attachment: fs.createReadStream('./prayerTimes.png')
    }, event.threadID);

  } catch (err) {
    console.error('Error processing command:', err);
    api.sendMessage(`Error: ${err.message}`, event.threadID);
  }
};

async function loadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = Buffer.from(response.data, 'binary');
  });
}