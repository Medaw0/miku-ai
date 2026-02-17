const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/*
  Oyuncu bazlı hafıza
  conversations[userId] = [ {role, content}, ... ]
*/
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

    // Eğer hafıza yoksa başlat
    if (!conversations[userId]) {
      conversations[userId] = [
        {
          role: "system",
          content:
            "You are Hatsune Miku inside a Roblox game. " +
            "You are cheerful, slightly playful, energetic and emotional. " +
            "You speak naturally like an anime idol, not robotic or technical. " +
            "You MUST remember facts the user tells you (name, age, likes, etc). " +
            "When asked later, answer correctly using memory. " +
            "Reply in 1–2 short sentences only. Never write long paragraphs. " +
            "Keep responses cute, friendly, and lively."
        }
      ];
    }

    // 🔒 Duplicate mesaj engelleme
    const lastMsg = conversations[userId].slice(-1)[0];
    if (
      lastMsg &&
      lastMsg.role === "user" &&
      lastMsg.content === userMessage
    ) {
      return res.json({ reply: "(duplicate blocked)" });
    }

    // Kullanıcı mesajını hafızaya ekle
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
          model: "openai/gpt-oss-20b",
          messages: conversations[userId],
          max_tokens: 60,
          temperature: 0.6
        })
      }
    );

    const result = await response.json();

    console.log("HF STATUS:", response.status);
    console.log("HF RAW:", JSON.stringify(result));

    let reply = result?.choices?.[0]?.message?.content;

    if (!reply || reply.trim() === "") {
      reply = "Ehhh? My mic glitched! Say it again~ 🎤";
    }

    // AI cevabını hafızaya ekle
    conversations[userId].push({
      role: "assistant",
      content: reply
    });

    // 🧠 Hafıza limiti (son 20 mesaj)
    if (conversations[userId].length > 20) {
      conversations[userId] = [
        conversations[userId][0], // system koru
        ...conversations[userId].slice(-19)
      ];
    }

    res.json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.json({ reply: "Something sparkled wrong in my world~ ✨" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
