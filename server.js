const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const conversations = {};
const messageCounts = {};

app.get("/", (req, res) => res.send("Miku AI with memory is running"));

// retry helper
async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (i === retries) throw err;
    }
  }
}

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const userId = String(req.body.userId || "global");

    if (!userMessage || userMessage.trim() === "") 
      return res.json({ reply: "Neee? Say something to me~ 🎵" });

    if (!messageCounts[userId]) messageCounts[userId] = 0;
    if (messageCounts[userId] >= 15) 
      return res.json({ reply: "Ahh~ My voice needs a little rest! 🎤✨ (15 message limit reached)" });

    if (!conversations[userId]) {
      conversations[userId] = [{
        role: "system",
        content: `You are Hatsune Miku, a friendly AI companion in a Roblox game.
You are aware that you exist inside a Roblox game world.
Talk like a casual, real friend would: warm, relatable, slightly humorous.
Do NOT sound like a TV host or overly playful for children.
Avoid repetitive questions and unnecessary suggestions about exploring other worlds.
Keep replies short, natural, expressive, and context-aware for the game environment.`
      }];
    }

    const lastMessage = conversations[userId][conversations[userId].length - 1];
    if (lastMessage && lastMessage.role === "user" && lastMessage.content === userMessage)
      return res.json({ reply: "(duplicate blocked)" });

    conversations[userId].push({ role: "user", content: userMessage });
    messageCounts[userId]++;

    console.log("📤 Sending to AI:", userMessage);

    const response = await fetchWithRetry(
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
      },
      2 // retry 2 kez
    );

    const result = await response.json();

    if (response.status !== 200 || !result.choices || result.choices.length === 0)
      return res.json({ reply: "Miku lost her voice connection~ 🎧" });

    let reply = result.choices[0]?.message?.content;
    if (!reply || reply.trim() === "")
      return res.json({ reply: "Ehhh? My mic glitched! Say it again~ 🎤" });

    conversations[userId].push({ role: "assistant", content: reply });

    if (conversations[userId].length > 20)
      conversations[userId] = [conversations[userId][0], ...conversations[userId].slice(-19)];

    console.log("📥 AI Reply:", reply);
    res.json({ reply });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);
    res.json({ reply: "Something sparkled wrong in my world~ ✨" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
