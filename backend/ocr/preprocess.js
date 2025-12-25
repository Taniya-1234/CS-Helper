const sharp = require("sharp");

async function preprocess(inputPath) {
  const outputPath = inputPath.replace(".png", "_prep.png");

  try {
    // Get original image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`Original image: ${metadata.width}x${metadata.height}px`);

    // Step 1: Remove table borders by aggressive thresholding
    const step1Path = inputPath.replace(".png", "_step1.png");
    await sharp(inputPath)
      .grayscale()
      .normalise()
      // Lower threshold removes thin lines (table borders)
      .threshold(180) // Higher = removes more lines
      .toFile(step1Path);

    // Step 2: Upscale and enhance for better OCR
    await sharp(step1Path)
      // Upscale if image is small (Tesseract needs ~300 DPI)
      .resize({
        width: metadata.width < 1500 ? metadata.width * 2 : metadata.width,
        height: metadata.height < 1500 ? metadata.height * 2 : metadata.height,
        fit: 'inside',
        kernel: sharp.kernel.lanczos3
      })
      
      // Enhance text clarity
      .sharpen({
        sigma: 1,
        m1: 0.5,
        m2: 0.5
      })
      
      // Final threshold for clean text
      .threshold(140)
      
      // Remove remaining noise
      .median(2)
      
      // Add white border around image (helps Tesseract detect edges)
      .extend({
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
        background: { r: 255, g: 255, b: 255 }
      })
      
      .toFile(outputPath);

    console.log(`Preprocessing complete: ${outputPath}`);
    
    // Clean up intermediate file
    const fs = require("fs");
    if (fs.existsSync(step1Path)) {
      fs.unlinkSync(step1Path);
    }

    return outputPath;

  } catch (err) {
    console.error("Preprocessing error:", err.message);
    throw err;
  }
}

module.exports = preprocess;