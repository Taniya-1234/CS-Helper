const preprocess = require("./preprocess");
const containsHeavyMath = require("./detectMath");
const containsDiagram = require("./detectDiagram");
const runOCR = require("./ocrText");

async function processOCR(imagePath) {
  try {
    console.log("\n🔍 Starting OCR Processing...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Step 1: Preprocess image for better OCR accuracy
    console.log("📸 Step 1: Preprocessing image...");
    const preprocessed = await preprocess(imagePath);

    // Step 2: Run OCR to extract ALL text
    console.log("📝 Step 2: Extracting text with OCR...");
    const text = await runOCR(preprocessed);

    // Step 3: Validate extracted text
    console.log("✅ Step 3: Validating extracted text...");

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: "OCR_FAILED",
        message: "Could not extract any text from the image",
        text: ""
      };
    }

    // Check word count (minimum 5 words required)
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`   → Word count: ${wordCount}`);

    if (wordCount < 5) {
      return {
        success: false,
        error: "INSUFFICIENT_TEXT",
        message: "Not enough text detected in the image",
        details: `Only ${wordCount} words found. Please ensure the image is clear and contains a complete question.`,
        text: text
      };
    }

    // Step 4: Check for diagrams
    console.log("🔍 Step 4: Checking for diagrams...");
    if (containsDiagram(text)) {
      return {
        success: false,
        error: "DIAGRAM_DETECTED",
        message: "Diagram-based questions are not supported",
        details: "This question requires drawing/sketching which cannot be answered in text format.",
        suggestion: "Please upload a text-based question without diagrams.",
        text: text
      };
    }

    // Step 5: Check for heavy math/numericals
    console.log("🔍 Step 5: Checking for complex math...");
    if (containsHeavyMath(text)) {
      return {
        success: false,
        error: "COMPLEX_MATH",
        message: "Complex mathematical/numerical questions are not supported",
        details: "This question contains heavy mathematical notation or numerical calculations.",
        suggestion: "Please upload questions with theoretical concepts instead of complex calculations.",
        text: text
      };
    }

    // Step 6: All validations passed!
    console.log("✅ All validations passed!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return {
      success: true,
      text: text,
      wordCount: wordCount,
      message: "Question validated successfully"
    };

  } catch (err) {
    console.error("❌ OCR Processing Error:", err.message);
    return {
      success: false,
      error: "OCR_FAILED",
      message: "Failed to process image",
      details: err.message,
      text: ""
    };
  }
}

module.exports = processOCR;