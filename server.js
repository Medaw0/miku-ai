// server.js - Güncellenmiş MikuAI Server
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // HF / OpenAI API için
const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

let clients = {}; // Roblox playerId -> message count / context

// Timeout ve retry ayarları
const REQUEST_TIMEOUT = 30000; // 30 saniye
const AI_API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct";
const AI_API_KEY = process.env.HF_API_KEY; // Render'da env olarak eklemelisin

// Helper: AI request
async function sendToAI(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(AI_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${AI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: prompt }),
            signal: controller.signal
        });

        if (!response.ok) {
            console.error("AI API error:", response.status, await response.text());
            return null;
        }

        const data = await response.json();
        // HF API formatı bazen array dönüyor
        if (Array.isArray(data)) return data[0]?.generated_text || null;
        return data.generated_text || null;
    } catch (err) {
        console.error("AI request failed:", err.message);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

// AI request endpoint
app.post("/ai", async (req, res) => {
    const { playerId, message } = req.body;
    if (!playerId || !message) return res.status(400).json({ error: "Missing playerId or message" });

    console.log(`📤 Sending to AI: ${message} - Player: ${playerId}`);

    const aiReply = await sendToAI(message);
    if (!aiReply) {
        console.log("AI request failed");
        return res.json({ error: "AI connection error" });
    }

    console.log(`📥 AI Reply: ${aiReply}`);
    res.json({ reply: aiReply });
});

// Credits / message tracking (basit)
app.post("/credits", (req, res) => {
    const { playerId, add } = req.body;
    if (!playerId) return res.status(400).json({ error: "Missing playerId" });
    if (!clients[playerId]) clients[playerId] = { messages: 0 };
    if (add) clients[playerId].messages += add;
    res.json({ remaining: clients[playerId].messages });
});

// Health check
app.get("/", (req, res) => res.send("MikuAI Server is running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
