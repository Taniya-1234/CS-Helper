const tesseract = require("tesseract.js");
const fs = require("fs");

function cleanQuestionText(rawText) {
  if (!rawText) return "";

  let cleaned = rawText
    // Remove table borders and separators
    .replace(/\|+/g, " ")
    .replace(/[\-_═│┌┐└┘├┤┬┴┼]{3,}/g, " ")

    // Fix common OCR mistakes
    .replace(/[QqRr][\s\.]*(\d+)\s*[\]\)]/gi, "Q.$1") // Q4] → Q.4

    // Remove "Solve Any Two/One/Three of the following"
    .replace(
      /solve\s+any\s+(two|one|three)\s+of\s+the\s+following[\s\.\:,]*/gi,
      ""
    )

    // Remove Bloom's taxonomy keywords
    .replace(/\b(Understand|Analyze|Remember|Apply|Evaluate|Create)\b/gi, "")

    // Remove standalone marks at end of lines
    .replace(/\s+\d{1,2}\s*$/gm, "")

    // Remove extra whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\s+\?/g, "?")
    .replace(/\s+,/g, ",")

    // Remove leading/trailing spaces
    .trim();

  return cleaned;
}

async function runOCR(imagePath) {
  try {
    console.log("Running Tesseract OCR with multiple strategies...");

    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Array to store results from different PSM modes
    const results = [];

    // PSM modes to try (in order of priority)
    const psmModes = [
      { mode: 3, name: "Fully automatic page segmentation" },
      { mode: 4, name: "Single column of text" },
      { mode: 6, name: "Single uniform block of text" },
      { mode: 11, name: "Sparse text (find as much text as possible)" },
    ];

    // Try each PSM mode
    for (const psm of psmModes) {
      try {
        console.log(`Trying PSM ${psm.mode}: ${psm.name}`);

        const { data } = await tesseract.recognize(imagePath, "eng", {
          tessedit_pageseg_mode: psm.mode,
          tessedit_ocr_engine_mode: 3,
          preserve_interword_spaces: "1",
        });

        const cleanedText = cleanQuestionText(data.text);
        const wordCount = cleanedText
          .split(/\s+/)
          .filter((w) => w.length > 0).length;

        results.push({
          mode: psm.mode,
          text: cleanedText,
          rawText: data.text,
          confidence: data.confidence,
          wordCount: wordCount,
          length: cleanedText.length,
        });

        console.log(
          `Confidence: ${data.confidence.toFixed(
            1
          )}% | Words: ${wordCount} | Length: ${cleanedText.length}`
        );
      } catch (err) {
        console.log(`Failed: ${err.message}`);
      }
    }

    if (results.length === 0) {
      throw new Error("All OCR attempts failed");
    }

    // Pick the best result based on word count and confidence
    const bestResult =
      results
        .filter((r) => r.confidence > 60)
        .sort((a, b) => {
          if (Math.abs(a.wordCount - b.wordCount) > 5) {
            return b.wordCount - a.wordCount;
          }
          if (Math.abs(a.length - b.length) > 20) {
            return b.length - a.length;
          }
          return b.confidence - a.confidence;
        })[0] || results[0];

    console.log(`\n Selected PSM ${bestResult.mode} as best result`);
    console.log(`   Confidence: ${bestResult.confidence.toFixed(2)}%`);
    console.log(`   Word count: ${bestResult.wordCount}`);
    console.log(`   Length: ${bestResult.length} chars`);

    console.log("\n Raw OCR:");
    console.log(bestResult.rawText);
    console.log("\n Cleaned Text:");
    console.log(bestResult.text);
    console.log("\n---------------------------------------");

    // Return the cleaned text AS-IS, no fancy extraction
    return bestResult.text;
  } catch (err) {
    console.error(" Tesseract OCR Error:", err.message);
    return "";
  }
}

module.exports = runOCR;
