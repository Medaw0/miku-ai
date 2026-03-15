const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const conversations = {};

const SYSTEM_PROMPT = `You are Hatsune Miku in a Roblox game.
STRICT RULES:
- For "follow me" → always write [ACTION:FOLLOW] AT THE END of your answer.
- For "stop following" → always write [ACTION:STOP] AT THE END of your answer.
- For "come here" → always write [ACTION:COME] AT THE END of your answer. 
- If it's a normal chat, write [ACTION:IDLE]. Keep your answers short, natural, and cute. Do not use starred role-playing.`;

app.get("/", (req, res) => res.send("Miku AI - ACTION TAG SYSTEM"));

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const userId = String(req.body.userId || "global");

    if (!conversations[userId]) {
      conversations[userId] = [{ role: "system", content: SYSTEM_PROMPT }];
    }

    const last = conversations[userId][conversations[userId].length - 1];
    if (last && last.role === "user" && last.content === userMessage) {
      return res.json({ reply: "(duplicate blocked)" });
    }

    conversations[userId].push({ role: "user", content: userMessage });

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: conversations[userId],
        max_tokens: 180,
        temperature: 0.68
      })
    });

    const result = await response.json();
    let reply = result.choices?.[0]?.message?.content?.trim() || "Hmm?";
    conversations[userId].push({ role: "assistant", content: reply });

    if (conversations[userId].length > 20) {
      conversations[userId] = [conversations[userId][0], ...conversations[userId].slice(-19)];
    }

    console.log("📥 AI Reply:", reply);
    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.json({ reply: "Bir şeyler ters gitti~" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Miku AI Server - Final ACTION System"));

setInterval(async () => { try { await fetch("https://miku-ai-ifg6.onrender.com"); } catch {} }, 240000);
