require("dotenv").config();

const axios = require("axios");
const { App } = require("@slack/bolt");
const QRCode = require('qrcode');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/url-tools-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Latency: ${latency}ms` });
});

app.command("/url-tools-help", async ({ command, ack, respond }) => {
  await ack();
  await respond({
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "URL Tools Help"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `*Available Commands*

• */url-tools-ping*
Check the bot's latency.

• */url-tools-help*
Show this help menu.

• */url-tools-shorten <url>*
Create a shortened URL using is.gd.

• */url-tools-qr <text or url>*
Generate a QR code for any text or URL.`
        }
      }
    ]
  });
});

app.command("/url-tools-shorten", async ({ command, ack, respond }) => {
  await ack();

  try {

    const { data } = await axios.get(
      "https://is.gd/create.php",
      {
        params: {
          format: "simple",
          url: command.text
        }
      }
    );

    await respond({
      text: `Shortened url for ${command.text}: ${data}`
    });

  } catch {
    await respond({
      text: `Something went wrong.`
    });
  }
});

app.command("/url-tools-qr", async ({ command, ack, respond }) => {
  await ack();

  try {

    const qrUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(command.text)}`;

    await respond({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `QR code for ${command.text}:`
          }
        },
        {
          type: "image",
          image_url: qrUrl,
          alt_text: "QR Code"
        }
      ]
    });
  } catch {
    await respond({
      text: `Something went wrong.`
    });
  }
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();