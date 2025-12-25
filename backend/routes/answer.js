import express from "express";
import Question from "../models/question.js";
import { prompts } from "../utils/geminiPrompts.js    ";
import { getGeminiResponse } from "../utils/geminiClient.js";

const router = express.Router();

router.post("/answer", async (req, res) => {
  try {
    const { questionText, subject, answerType } = req.body;

    // 1 Validate input
    if (!questionText || !subject || !answerType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 2 Check MongoDB
    let questionDoc = await Question.findOne({ questionText, subject });

    if (questionDoc && questionDoc.responses[answerType]) {
      //  Answer already exists
      return res.json({
        source: "database",
        answer: questionDoc.responses[answerType],
      });
    }

    // 3️ Prepare Gemini prompt
    const promptFn = prompts[answerType];

    if (!promptFn) {
      return res.status(400).json({ error: "Invalid answer type" });
    }

    const prompt = promptFn(questionText, subject);

    // 4️ Call Gemini
    const aiAnswer = await getGeminiResponse(prompt);

    // 5️ Save to MongoDB
    if (!questionDoc) {
      questionDoc = new Question({
        questionText,
        subject,
        responses: {},
      });
    }

    questionDoc.responses[answerType] = aiAnswer;
    await questionDoc.save();

    // 6️ Return answer
    res.json({
      source: "gemini",
      answer: aiAnswer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
