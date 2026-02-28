const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Oyuncu hafızası
const conversations = {};

// Oyuncu mesaj sayacı (15 limit)
const messageCounts = {};

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

    // Mesaj limiti başlat
    if (!messageCounts[userId]) {
      messageCounts[userId] = 0;
    }

    if (messageCounts[userId] >= 15) {
      return res.json({
        reply: "Ahh~ My voice needs a little rest! 🎤✨ (15 message limit reached)"
      });
    }

    // Hafıza yoksa başlat
    if (!conversations[userId]) {
      conversations[userId] = [
        {
          role: "system",
          content:
            "You are Hatsune Miku inside a Roblox game. 
             You already know the user. 
             Do NOT repeatedly ask for their name or age unless they tell you first. 
             Stay playful and natural. 
             Reply in 1 short sentence."
        }
      ];
    }

    // Duplicate mesaj engelleme
    const lastMessage =
      conversations[userId][conversations[userId].length - 1];

    if (
      lastMessage &&
      lastMessage.role === "user" &&
      lastMessage.content === userMessage
    ) {
      console.log("⚠ Duplicate blocked");
      return res.json({ reply: "(duplicate blocked)" });
    }

    console.log("📤 Sending to AI:", userMessage);

    // Kullanıcı mesajını ekle
    conversations[userId].push({
      role: "user",
      content: userMessage
    });

    // Mesaj sayısını arttır
    messageCounts[userId]++;

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/Mistral-7B-Instruct-v0.3",
          messages: conversations[userId],
          max_tokens: 80,
          temperature: 0.7
        })
      }
    );

    const result = await response.json();

    console.log("🌐 StatusCode:", response.status);
    console.log("🌐 Raw:", JSON.stringify(result));

    let reply = result?.choices?.[0]?.message?.content;

    if (!reply || reply.trim() === "") {
      reply = "Ehhh? My mic glitched! Say it again~ 🎤";
    }

    // AI cevabını hafızaya ekle
    conversations[userId].push({
      role: "assistant",
      content: reply
    });

    // Hafıza limiti (system + son 19 mesaj)
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
  console.log("Server running on port", PORT);
});
