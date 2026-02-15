import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch(
  "https://api-inference.huggingface.co/models/TheBloke/vicuna-7B-1.1-HF",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: `You are Hatsune Miku inside a Roblox game. Reply short and in character.\n\nUser: ${userMessage}`
    })
  }
);

    let reply = "AI error.";

    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    }

    res.json({ reply });

  } catch (err) {
    res.json({ reply: "Server error." });
  }
});

app.listen(3000, () => console.log("Server running"));
