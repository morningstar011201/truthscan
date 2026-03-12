export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        max_tokens: 800,
        temperature: 0.85,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
