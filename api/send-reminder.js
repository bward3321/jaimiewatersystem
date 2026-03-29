// /api/send-reminder.js
// Vercel Cron hits this endpoint → Resend sends email → Verizon gateway delivers as SMS
// Add ?force=true to skip the hour check for testing

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

export default async function handler(req) {
  const url = new URL(req.url);
  const forceMode = url.searchParams.get("force") === "true";

  // Check if it's a valid send hour in Eastern Time (skip if force mode)
  const now = new Date();
  const etHour = parseInt(
    now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false })
  );

  if (!forceMode && !SEND_HOURS.includes(etHour)) {
    return new Response(
      JSON.stringify({ skipped: true, etHour, reason: "Not a send hour. Add ?force=true to override." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Pick a random message
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  // Send via Resend
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: [process.env.SMS_GATEWAY_EMAIL],
      subject: "",
      text: message,
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    console.error("Resend error:", result);
    return new Response(
      JSON.stringify({ error: true, details: result }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const etTime = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  console.log(`Sent to Jaimie at ${etTime} ET: ${message}`);

  return new Response(
    JSON.stringify({ sent: true, time: `${etTime} ET`, message, resendId: result.id, forced: forceMode }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export const config = {
  runtime: "edge",
};
