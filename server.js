const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const conversations = {};

app.get("/", (req, res) => {
  res.send("Miku AI stable version running");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const userId = String(req.body.userId || "global");

    if (!userMessage) {
      return res.json({ reply: "Say something~ 🎵" });
    }

    if (!conversations[userId]) {
      conversations[userId] = [
        {
          role: "system",
          content: `
You are Hatsune Miku inside a Roblox game.
You must always give meaningful, intelligent, and relevant answers.
Never repeat phrases like "Tell me again".
Never give empty responses.
Stay energetic but respond properly to what the user says.
`
        }
      ];
    }

    conversations[userId].push({
      role: "user",
      content: userMessage
    });

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
          max_tokens: 60,
          temperature: 0.6
        })
      }
    );

    const result = await response.json();

    let reply = result?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      reply = "Hmm~ let me think! Tell me more 💙";
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

    res.json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.json({ reply: "Something glitched~ 💫" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
