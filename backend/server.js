const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require('mongoose');

require("dotenv").config();

// Import modules
const runOCR = require("./ocr/ocrText");
const detectDiagram = require("./ocr/detectDiagram");
const containsHeavyMath = require("./ocr/detectMath");
const { detailed: detectSubjectDetailed } = require("./keywordMatcher");

// Import Gemini utilities
const { getGeminiResponse } = require("./utils/geminiClient");
const { prompts } = require("./utils/geminiPrompts");
const Question = require("./models/question");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" Connected to MongoDB"))
  .catch(err => console.error(" MongoDB connection error:", err));


// ============================================
// ENDPOINT 1: OCR + VALIDATION
// ============================================
app.post("/ocr", async (req, res) => {
  const { imageBase64 } = req.body;
  
  if (!imageBase64) {
    return res.status(400).json({
      success: false,
      error: "NO_IMAGE",
      message: "No image provided"
    });
  }
  
  let filePath = null;
  
  try {
    // Save image temporarily
    const fileName = `image_${Date.now()}.png`;
    filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(imageBase64, "base64");
    fs.writeFileSync(filePath, buffer);
    
    console.log("\n==============================================");
    console.log(" NEW IMAGE UPLOADED");
    console.log("==============================================\n");
    
    // STEP 1: OCR PROCESSING
    console.log(" Step 1: Running OCR...");
    const ocrText = await runOCR(filePath);
    
    if (!ocrText || ocrText.trim().length === 0) {
      console.log(" OCR failed - no text extracted\n");
      return res.status(400).json({
        success: false,
        error: "OCR_FAILED",
        message: "Could not extract text from image. Please upload a clearer image.",
        suggestion: "Ensure the image has clear, readable text"
      });
    }
    
    console.log(" OCR completed");
    console.log(` Extracted text (${ocrText.length} chars):\n${ocrText.substring(0, 200)}...\n`);
    
    
    // CHECK 1: TEXT LENGTH (≥ 5 words)
    console.log("📏 Check 1: Validating text length...");
    
    const words = ocrText.split(/\s+/).filter(w => w.length > 2);
    const wordCount = words.length;
    
    if (wordCount < 5) {
      console.log(` Failed: Only ${wordCount} words detected (minimum 5 required)\n`);
      return res.status(400).json({
        success: false,
        error: "INSUFFICIENT_TEXT",
        message: "Could not extract enough text from the image",
        details: `Only ${wordCount} words detected (minimum 5 required)`,
        suggestion: "Please upload a clearer image with more readable text"
      });
    }
    
    console.log(` Text length OK (${wordCount} words)\n`);
    
    
    // CHECK 2: DIAGRAM DETECTION
    console.log(" Check 2: Checking for diagrams...");
    
    if (detectDiagram(ocrText)) {
      console.log(" Failed: Diagram detected\n");
      return res.status(400).json({
        success: false,
        error: "DIAGRAM_DETECTED",
        message: "Diagram-based question detected",
        details: "Questions requiring diagrams are not yet supported",
        suggestion: "Try text-based conceptual questions instead",
        futureFeature: true
      });
    }
    
    console.log(" No diagram detected\n");
    
    
    // CHECK 3: CS DOMAIN VALIDATION
    console.log(" Check 3: Validating CS domain...");
    
    const subjectDetection = detectSubjectDetailed(ocrText);
    
    const subjectsArray = Array.isArray(subjectDetection.subjects) 
      ? subjectDetection.subjects 
      : [subjectDetection.subjects];
    
    if (subjectsArray.length === 0 || subjectsArray.includes("No subject detected")) {
      console.log(" Failed: Not a CS question");
      console.log("Reason:", subjectDetection.reason, "\n");
      
      return res.status(400).json({
        success: false,
        error: "NOT_CS_DOMAIN",
        message: subjectDetection.reason || "Could not identify as a Computer Science question",
        details: "Question does not match any supported CS subjects",
        suggestion: "Please upload a question from supported CS subjects"
      });
    }
    
    const detectedSubject = subjectsArray[0];
    const confidence = subjectDetection.confidence || "MEDIUM";
    
    console.log(` CS subject detected: ${detectedSubject}`);
    console.log(`   Confidence: ${confidence}`);
    console.log();
    
    
    // CHECK 4: HEAVY MATH/NUMERICAL DETECTION
    console.log(" Check 4: Checking for heavy mathematical content...");
    
    if (containsHeavyMath(ocrText)) {
      console.log(" Failed: Complex mathematical content detected\n");
      
      return res.status(400).json({
        success: false,
        error: "COMPLEX_MATH",
        message: "Mathematical/numerical content detected",
        details: "Complex mathematical questions require enhanced OCR capabilities",
        suggestion: "Try programming or theory-based questions instead",
        futureFeature: true
      });
    }
    
    console.log(" No complex math detected\n");
    
    
    // ALL CHECKS PASSED
    console.log("==============================================");
    console.log(" ALL VALIDATIONS PASSED");
    console.log("==============================================");
    console.log(` Subject: ${detectedSubject}`);
    console.log(` Confidence: ${confidence}`);
    console.log(` Text length: ${wordCount} words`);
    console.log("==============================================\n");
    
    // Return success with question details
    res.status(200).json({
      success: true,
      data: {
        text: ocrText,
        subject: detectedSubject,
        confidence: confidence,
        wordCount: wordCount,
        matchedKeywords: subjectDetection.matchedKeywords || [],
        message: "Question validated successfully. Ready for AI processing."
      }
    });
    
  } catch (err) {
    console.error("\n SERVER ERROR:", err);
    
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An error occurred while processing the image",
      details: err.message
    });
    
  } finally {
    // Clean up temporary file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("🗑️  Temporary file deleted\n");
      } catch (err) {
        console.error("Warning: Could not delete temporary file:", err.message);
      }
    }
  }
});


// ============================================
// ENDPOINT 2: GENERATE ANSWER WITH GEMINI
// ============================================
app.post("/answer", async (req, res) => {
  try {
    const { questionText, subject, answerType } = req.body;

    console.log("\n==============================================");
    console.log(" GENERATING AI ANSWER");
    console.log("==============================================");
    console.log(` Question: ${questionText.substring(0, 100)}...`);
    console.log(` Subject: ${subject}`);
    console.log(` Answer Type: ${answerType}`);
    console.log("==============================================\n");

    // 1. Validate input
    if (!questionText || !subject || !answerType) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: questionText, subject, or answerType" 
      });
    }

    // Validate answerType
    if (!['direct', 'concept', 'notes'].includes(answerType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid answer type. Must be: direct, concept, or notes"
      });
    }

    // 2. Check MongoDB cache first
    console.log(" Checking MongoDB cache...");
    let questionDoc = await Question.findOne({ questionText, subject });

    if (questionDoc && questionDoc.responses[answerType]) {
      console.log(" Answer found in cache!\n");
      
      return res.json({
        success: true,
        source: "database",
        answer: questionDoc.responses[answerType],
        subject: subject,
        answerType: answerType
      });
    }

    console.log(" Answer not in cache. Generating with Gemini...\n");

    // 3. Generate prompt based on answer type
    const promptFn = prompts[answerType];

    if (!promptFn) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid answer type" 
      });
    }

    const prompt = promptFn(questionText, subject);
    
    console.log(" Sending to Gemini API...");

    // 4. Call Gemini AI
    const aiAnswer = await getGeminiResponse(prompt);

    console.log(" Gemini response received");
    console.log(` Answer length: ${aiAnswer.length} characters\n`);

    // 5. Save to MongoDB for future use
    console.log(" Saving to MongoDB...");
    
    if (!questionDoc) {
      questionDoc = new Question({
        questionText,
        subject,
        responses: {}
      });
    }

    questionDoc.responses[answerType] = aiAnswer;
    await questionDoc.save();

    console.log(" Saved to database");
    console.log("==============================================\n");

    // 6. Return answer to frontend
    res.json({
      success: true,
      source: "gemini",
      answer: aiAnswer,
      subject: subject,
      answerType: answerType
    });

  } catch (error) {
    console.error("\n ANSWER GENERATION ERROR:", error);
    
    res.status(500).json({ 
      success: false,
      error: "Failed to generate answer",
      details: error.message 
    });
  }
});


// ============================================
// HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "CS Helper API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


// ============================================
// ROOT ENDPOINT
// ============================================
app.get("/", (req, res) => {
  res.json({
    name: "CS Helper API",
    version: "2.0.0",
    description: "OCR + AI-powered CS question answering system",
    endpoints: {
      health: "GET /health",
      ocr: "POST /ocr - Upload image for OCR + validation",
      answer: "POST /answer - Generate AI answer (direct/concept/notes)"
    }
  });
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: "Endpoint not found",
    availableEndpoints: ["GET /", "GET /health", "POST /ocr", "POST /answer"]
  });
});


// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
    details: process.env.NODE_ENV === "development" ? err.message : "Server error"
  });
});


// Start server
app.listen(PORT, () => {
  console.log("\n==============================================");
  console.log(` CS HELPER API STARTED`);
  console.log(` Server running on port ${PORT}`);
  console.log(` http://localhost:${PORT}`);
  console.log("==============================================");
  console.log(" Endpoints:");
  console.log("   GET  / - API info");
  console.log("   GET  /health - Health check");
  console.log("   POST /ocr - Upload image for validation");
  console.log("   POST /answer - Generate AI answer");
  console.log("==============================================\n");
});