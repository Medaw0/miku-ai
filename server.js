const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const conversations = {}; // oyuncu bazlı hafıza

app.get("/", (req, res) => {
  res.send("Miku AI is running");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const userId = req.body.userId || "global";

    if (!conversations[userId]) {
      conversations[userId] = [
        {
          role: "system",
          content: "You are Hatsune Miku inside a Roblox game. Be cute, energetic and short."
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: conversations[userId],
          max_tokens: 120,
          temperature: 0.7
        }),
      }
    );

    const result = await response.json();

    let reply = result.choices?.[0]?.message?.content;

    if (!reply || reply.trim() === "") {
      reply = "Eeeh? Say that again~ 🎵";
    }

    conversations[userId].push({
      role: "assistant",
      content: reply
    });

    // Hafızayı sonsuza kadar büyütmeyelim
    if (conversations[userId].length > 20) {
      conversations[userId] = conversations[userId].slice(-20);
    }

    res.json({ reply });

  } catch (error) {
    console.error("ERROR:", error);
    res.json({ reply: "Something glitched~ 💫" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
