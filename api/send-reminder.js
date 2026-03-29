// /api/send-reminder.js
// Vercel Cron hits this → Gmail SMTP sends email → Verizon gateway delivers as SMS
// Add ?force=true to skip the hour check for testing

const nodemailer = require("nodemailer");

const SEND_HOURS = [8, 11, 14, 17, 20]; // 8am, 11am, 2pm, 5pm, 8pm ET

const MESSAGES = [
  "Hey babe! Time to drink some water! You're doing amazing today.",
  "Water check! Your body and your skin will thank you. Love you!",
  "Hydration station! Go grab that water bottle, mama!",
  "Friendly reminder: DRINK WATER! You've got this!",
  "Hey Jaimie! Put down whatever you're doing and take 5 big sips. Go!",
  "Ice water time! Staying hydrated = more energy for everything.",
  "Water break! Even superstar moms need to hydrate. Drink up!",
  "Have you had water recently? No? Go go go!",
  "This is your water fairy. I grant you the power of hydration! Drink!",
  "Hydrate or diedrate! jk but seriously go drink water",
  "Quick! Chug some water before this text disappears!",
  "Bubble bubble, water's no trouble. Time for a drink, on the double!",
  "Fun fact: you're mostly water. Time to top off the tank!",
  "Mid-day reminder: water > coffee > everything else. Drink up!",
  "Your future self says THANK YOU for drinking water right now!",
];

module.exports = async function handler(req, res) {
  const forceMode = req.query.force === "true";

  // Check if it's a valid send hour in Eastern Time
  const now = new Date();
  const etHour = parseInt(
    now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false })
  );

  if (!forceMode && !SEND_HOURS.includes(etHour)) {
    return res.status(200).json({
      skipped: true,
      etHour,
      reason: "Not a send hour. Add ?force=true to override.",
    });
  }

  // Pick a random message
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  try {
    // Create Gmail SMTP transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Send to Verizon SMS gateway
    await transporter.sendMail({
      from: process.env.GMAIL_ADDRESS,
      to: process.env.SMS_GATEWAY_EMAIL,
      subject: "",
      text: message,
    });

    const etTime = now.toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    console.log(`Sent to Jaimie at ${etTime} ET: ${message}`);

    return res.status(200).json({
      sent: true,
      time: `${etTime} ET`,
      message,
      forced: forceMode,
    });
  } catch (err) {
    console.error("SMTP error:", err);
    return res.status(500).json({
      error: true,
      details: err.message,
    });
  }
};
