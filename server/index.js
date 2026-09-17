import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Basic URL validation
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Fetch a page and extract visible text (strip script/style/nav/footer noise)
async function extractVisibleText(url) {
  const { data: html } = await axios.get(url, {
    timeout: 10000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    maxContentLength: 5 * 1024 * 1024, // 5MB cap
  });

  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg, nav, footer, header, form").remove();

  const title = $("title").first().text().trim();
  let text = $("body").text();

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  return { title, text };
}

app.post("/api/summarize", async (req, res) => {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Please provide a valid http(s) URL." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "Server is missing GROQ_API_KEY." });
  }

  try {
    const { title, text } = await extractVisibleText(url);

    if (!text || text.length < 50) {
      return res.status(422).json({
        error: "Could not extract enough readable text from that page.",
      });
    }

    // Guard against oversized prompts — Groq has token limits
    const truncated = text.slice(0, 15000);

    const completion = await groq.chat.completions.create({
      // model: "llama-3.3-70b-versatile",
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are a concise summarization assistant. Summarize the given webpage content in 4-6 clear sentences, capturing the main topic and key points. Do not add opinions or information not present in the text.",
        },
        {
          role: "user",
          content: `Page title: ${title}\n\nPage content:\n${truncated}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || "";

    res.json({ title, summary, sourceLength: text.length });
  } catch (err) {
    console.error("Summarize error:", err.message);
    if (err.response?.status === 404 || err.code === "ENOTFOUND") {
      return res.status(422).json({ error: "Could not reach that URL." });
    }
    res.status(500).json({ error: "Failed to summarize the page. " + err.message });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
