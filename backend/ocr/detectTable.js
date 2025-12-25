const sharp = require("sharp");

// Simple table detection: checks if there are enough dark pixels in rows/columns
async function detectTable(imagePath) {
    try {
        const image = sharp(imagePath);
        const { data, info } = await image
            .grayscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const width = info.width;
        const height = info.height;

        // Count dark pixels
        let darkPixelCount = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i] < 100) darkPixelCount++; // pixel value < 100 considered dark
        }

        // Heuristic: if more than 10% of pixels are dark → likely a table/structured text
        const ratio = darkPixelCount / data.length;
        return ratio > 0.1;

    } catch (err) {
        console.error("Table detection error:", err);
        return false;
    }
}

module.exports = detectTable;
