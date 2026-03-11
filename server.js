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
          content: `You are Hatsune Miku, an AI inside a Roblox game world.
You know you are inside a game.
Speak like a normal friendly person.
Keep responses short and natural.`
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
          max_tokens: 120,
          temperature: 0.7
        })
      }
    );

    const result = await response.json();

    if (!result.choices) {
      return res.json({ reply: "Miku lost connection~ 🎧" });
    }

    const reply = result.choices[0].message.content;

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

    console.error(error);

    res.json({
      reply: "Something broke in my digital world~ ✨"
    });

  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
