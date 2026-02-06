const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const OpenAI = require("openai");
const connectToMongoose = require("./db");

const app = express();
const PORT = 5000;

// DB
connectToMongoose();

// Middleware
app.use(cors());
app.use(express.json());

// AICC Client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// PDF path
const filePath = path.join(__dirname, "uploads", "SMOI_website_info_doc.pdf");

// Cached PDF text (VERY IMPORTANT for performance)
let pdfText = "";

// Load PDF ONCE at server start
async function loadPDF() {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  pdfText = data.text;
  console.log("📄 PDF loaded and cached");
}
loadPDF();

app.get("/list-models", async (req, res) => {
  try {
    const models = await client.models.list();
    res.json(models.data);
  } catch (err) {
    res.status(500).json(err);
  }
});


// -------------------- SUMMARY --------------------
app.get("/generate-summary", async (req, res) => {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",

      messages: [
        {
          role: "system",
          content: "You are an expert document summarizer.",
        },
        {
          role: "user",
          content: `Summarize the following document in bullet points:\n\n${pdfText}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    res.json({
      summary: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Summary generation failed" });
  }
});

// -------------------- ASK QUESTION --------------------
app.get("/ask-question", async (req, res) => {
  const { question } = req.query;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Answer strictly from the document." },
        { role: "user", content: `${pdfText}\n\nQuestion: ${question}` },
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    res.json({
      answer: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

// -------------------- SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 AICC server running at http://localhost:${PORT}`);
});
