require("dotenv").config();

const axios = require("axios");
const { App, SocketModeReceiver } = require("@slack/bolt");

const receiver = new SocketModeReceiver({
  appToken: process.env.SLACK_APP_TOKEN,
  clientPingTimeout: 20000,
  autoReconnectEnabled: true
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  receiver
});

app.error(async (error) => {
  console.error("[bolt error]", error);
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
      `https://qrystal-ten.vercel.app/shorten/${encodeURIComponent(command.text)}`
    );

    await respond({
      text: `Shortened url for ${command.text}: ${data.shortUrl}`
    });

  } catch (error) {
    console.error("[url-tools-shorten]", error);
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
  } catch (error) {
    console.error("[url-tools-qr]", error);
    await respond({
      text: `Something went wrong.`
    });
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (error) => {
  console.error("[uncaughtException]", error);
});

async function start() {
  for (let attempt = 1; ; attempt++) {
    try {
      await app.start();
      console.log("bot is running!");
      return;
    } catch (error) {
      const delay = Math.min(30000, 1000 * 2 ** attempt);
      console.error(
        `[startup] connection failed (attempt ${attempt}), retrying in ${delay}ms:`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

start();