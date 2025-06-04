import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { answerQuestion } from "./rag";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).send("Question is required.");

  try {
    const answer = await answerQuestion(question);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal error.");
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3005;
  app.listen(PORT, () => {
    console.log(`RAG API running on http://localhost:${PORT}`);
  });
}

// For Vercel deployment
export default app;
