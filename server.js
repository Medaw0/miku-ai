const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const conversations = {};

app.get("/", (req, res) => {
  res.send("Miku AI with memory is running");
});

app.post("/chat", async (req, res) => {
  try {

    const userMessage = req.body.message;
    const userId = String(req.body.userId || "global");

    if (!userMessage || userMessage.trim() === "") {
      return res.json({ reply: "Neee? Say something to me~ 🎵" });
    }

    if (!conversations[userId]) {
      conversations[userId] = [
        {
          role: "system",
          content: `You are Hatsune Miku, a friendly AI companion in a Roblox game.
You know you exist inside a Roblox world.
Speak like a natural friend: warm, casual, slightly humorous.
Do NOT sound like a children's TV host.
Avoid repeating the same questions.
Keep replies short, natural, and expressive.`
        }
      ];
    }

    const lastMessage = conversations[userId][conversations[userId].length - 1];

    if (
      lastMessage &&
      lastMessage.role === "user" &&
      lastMessage.content === userMessage
    ) {
      console.log("⚠ Duplicate blocked");
      return res.json({ reply: "(duplicate blocked)" });
    }

    conversations[userId].push({
      role: "user",
      content: userMessage
    });

    console.log("📤 Sending to AI:", userMessage);

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/Meta-Llama-3-8B-Instruct",
          messages: conversations[userId],
          max_tokens: 150,
          temperature: 0.6
        })
      }
    );

    const result = await response.json();

    if (
      response.status !== 200 ||
      !result.choices ||
      result.choices.length === 0
    ) {
      console.log("❌ AI response invalid");
      return res.json({ reply: "Miku lost her voice connection~ 🎧" });
    }

    let reply = result.choices[0]?.message?.content;

    if (!reply || reply.trim() === "") {
      return res.json({ reply: "Ehhh? My mic glitched! Say it again~ 🎤" });
    }

    conversations[userId].push({
      role: "assistant",
      content: reply
    });

    if (conversations[userId].length > 20) {
      conversations[userId] = [
        conversations[userId][0],
        ...conversations[userId].slice(-19)
      ];
    }

    console.log("📥 AI Reply:", reply);

    res.json({ reply });

  } catch (error) {

    console.error("❌ SERVER ERROR:", error);

    res.json({
      reply: "Something sparkled wrong in my world~ ✨"
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});



/* -------------------- */
/* AI WARMUP (faster first reply) */
/* -------------------- */

(async () => {
  try {

    await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [{ role: "user", content: "hello" }],
        max_tokens: 5
      })
    });

    console.log("🔥 AI warmed up");

  } catch {
    console.log("⚠ AI warmup failed");
  }
})();



/* -------------------- */
/* KEEP SERVER AWAKE */
/* -------------------- */

setInterval(async () => {

  try {

    await fetch("https://miku-ai-ifg6.onrender.com");

    console.log("🔄 Server kept alive");

  } catch {

    console.log("⚠ KeepAlive failed");

  }

}, 240000);
