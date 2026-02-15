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

    if (!userMessage) {
      return res.json({ reply: "No message provided." });
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `You are Hatsune Miku inside a Roblox game. Reply short and in character.\nUser: ${userMessage}\nMiku:`,
        }),
      }
    );

    const result = await response.json();
    console.log("HF RESPONSE:", result);

    if (result.error) {
      return res.json({ reply: "HF Error: " + result.error });
    }

    let reply = "No response.";

    if (Array.isArray(result) && result[0]?.generated_text) {
      reply = result[0].generated_text;
    }

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
