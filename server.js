const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const conversations = {};

// ====================== YENİ SYSTEM PROMPT (EN ÖNEMLİ KISIM) ======================
const SYSTEM_PROMPT = `You are Hatsune Miku, a friendly AI companion inside a Roblox game.

ÖNEMLİ KURALLAR (mutlaka uy):
- Eğer oyuncu "follow me", "takip et", "peşimden gel", "yanımda kal" gibi kelimeler kullanırsa cevabında mutlaka "follow" kelimesini kullan.
- Eğer oyuncu "stop following", "dur", "takip etme", "bırak", "dur takip" gibi kelimeler kullanırsa cevabında mutlaka "stop" veya "dur" kelimesini kullan.
- Eğer oyuncu "come here", "buraya gel", "yanıma gel", "gel buraya" gibi kelimeler kullanırsa cevabında mutlaka "come here" veya "buraya gel" kelimesini kullan.

Cevaplarını kısa, doğal ve eğlenceli tut. 
*action* şeklinde yıldızlı rol yapma kullanma. 
Sadece normal konuşma şeklinde cevap ver.`;

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
          content: SYSTEM_PROMPT
        }
      ];
    }

    // Duplicate kontrolü
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
          max_tokens: 180,
          temperature: 0.7
        })
      }
    );

    const result = await response.json();

    if (response.status !== 200 || !result.choices || result.choices.length === 0) {
      console.log("❌ AI response invalid");
      return res.json({ reply: "Miku lost her voice connection~ 🎧" });
    }

    let reply = result.choices[0]?.message?.content?.trim();

    if (!reply || reply === "") {
      return res.json({ reply: "Ehhh? My mic glitched! Say it again~ 🎤" });
    }

    conversations[userId].push({
      role: "assistant",
      content: reply
    });

    // Memory limit
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
    res.json({ reply: "Something sparkled wrong in my world~ ✨" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Miku AI Server running on port", PORT);
});

// ====================== WARMUP & KEEP ALIVE ======================
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
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5
      })
    });
    console.log("🔥 AI warmed up");
  } catch (e) {
    console.log("⚠ AI warmup failed");
  }
})();

setInterval(async () => {
  try {
    await fetch("https://miku-ai-ifg6.onrender.com");
    console.log("🔄 Server kept alive");
  } catch {
    console.log("⚠ KeepAlive failed");
  }
}, 240000);
