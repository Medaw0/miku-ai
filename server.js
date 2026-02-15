const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Miku AI is running");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

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
          messages: [
            {
              role: "system",
              content: "You are Hatsune Miku inside a Roblox game. Reply short and cute."
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          max_tokens: 100
        }),
      }
    );

    const result = await response.json();
    console.log("HF RESPONSE:", result);

    if (result.error) {
      return res.json({ reply: "HF Error: " + result.error });
    }

    const reply =
      result.choices?.[0]?.message?.content || "No response.";

    res.json({ reply: reply });

  } catch (error) {
    console.error("FULL ERROR:", error);
    res.json({ reply: "Server error." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
