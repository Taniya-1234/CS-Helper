const fs = require("fs");
const path = require("path");

const SUBJECT_DATA = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cs_keywords.json"), "utf8")
);

// ---------------- CONFIG ----------------
const MIN_DISTINCT_KEYWORDS = 1;
const MIN_TOTAL_OCCURRENCES = 2;

// Generic words that shouldn't alone determine subject
const GENERIC_WORDS = new Set([
  "system", "architecture", "process", "data", "computer",
  "program", "software", "environment", "method", "model"  // Added "model" back
]);

const STOPWORDS = new Set([
  "the", "is", "in", "on", "at", "a", "an", "and", "or", "of", "for", "to",
  "by", "with", "from", "as", "it", "this", "that", "be", "but", "not",
  "what", "how", "why", "when", "where", "explain", "describe", "define",
  "any", "two", "following", "example", "own", "words", "aspects", "four"
]);

const QUESTION_HINTS = [
  "what is", "explain", "define", "describe", "compare", "differentiate",
  "why", "how", "solve", "prove", "discuss", "write", "interpret",
  "draw", "show", "illustrate", "calculate", "list", "enumerate"
];

// ---------------- HELPERS ----------------
function clean(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeQuestion(cleanedText) {
  return QUESTION_HINTS.some(q => cleanedText.includes(q));
}

// Escape special regex characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ULTRA-STRICT keyword matching - no false positives
function matchKeyword(cleanedText, keyword) {
  const keywordCleaned = clean(keyword);
  
  // Split into words
  const words = keywordCleaned
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (words.length === 0) return false;

  // CASE 1: Single-word keywords
  if (words.length === 1) {
    const word = words[0];
    
    // Skip generic words entirely
    if (GENERIC_WORDS.has(word)) return false;
    
    // For 2-3 character words, require EXACT standalone match
    if (word.length <= 3) {
      const exactRegex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
      return exactRegex.test(cleanedText);
    }
    
    // For longer words, allow plural
    const regex = new RegExp(`\\b${escapeRegex(word)}s?\\b`, "i");
    return regex.test(cleanedText);
  }

  // CASE 2: Multi-word keywords - MUST have ALL significant words
  
  // Filter to significant words only (not stopwords or generic)
  const significantWords = words.filter(w => 
    !STOPWORDS.has(w) && !GENERIC_WORDS.has(w) && w.length > 2
  );
  
  // If no significant words remain after filtering, reject
  if (significantWords.length === 0) return false;
  
  // Check if ALL significant words are present
  let allWordsPresent = true;
  for (const word of significantWords) {
    const wordRegex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    if (!wordRegex.test(cleanedText)) {
      allWordsPresent = false;
      break;
    }
  }
  
  // If not all significant words are present, reject immediately
  if (!allWordsPresent) return false;
  
  // Now check if they appear in reasonable proximity
  // Strategy 1: Exact phrase match
  const exactPhrase = words.map(escapeRegex).join("\\s+");
  const exactRegex = new RegExp(`\\b${exactPhrase}\\b`, "i");
  if (exactRegex.test(cleanedText)) return true;
  
  // Strategy 2: Words within 3 positions of each other
  // Build a regex that allows up to 3 words between each keyword word
  let proximityPattern = `\\b${escapeRegex(words[0])}\\b`;
  for (let i = 1; i < words.length; i++) {
    proximityPattern += `(?:\\s+\\w+){0,3}\\s+\\b${escapeRegex(words[i])}\\b`;
  }
  const proximityRegex = new RegExp(proximityPattern, "i");
  if (proximityRegex.test(cleanedText)) return true;
  
  return false;
}

function countOccurrences(cleanedText, keyword) {
  const words = clean(keyword)
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w) && !GENERIC_WORDS.has(w));

  let count = 0;
  for (const w of words) {
    const regex = new RegExp(`\\b${escapeRegex(w)}\\b`, "gi");
    const matches = cleanedText.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

function isStrongKeyword(keyword) {
  const words = clean(keyword).split(/\s+/).filter(w => w.length > 0);
  
  // Multi-word keywords are strong IF they have significant words
  if (words.length >= 2) {
    const significantWords = words.filter(w => !GENERIC_WORDS.has(w) && !STOPWORDS.has(w));
    return significantWords.length >= 1;
  }
  
  // Single word must not be generic
  if (GENERIC_WORDS.has(words[0])) return false;
  
  // Very short single words (2 chars) must be known acronyms
  if (words[0].length === 2) {
    const knownAcronyms = new Set(['ai', 'ml', 'os', 'db', 'ui', 'ux', 'ip', 'vm', 'er']);
    return knownAcronyms.has(words[0]);
  }
  
  return true;
}

// ---------------- MAIN LOGIC ----------------
function detectSubjectDetailed(text) {
  const cleaned = clean(text);

  if (!cleaned || cleaned.length < 15) {
    return {
      subjects: ["No subject detected"],
      confidence: "NONE",
      reason: "Insufficient text"
    };
  }

  if (!looksLikeQuestion(cleaned)) {
    return {
      subjects: ["No subject detected"],
      confidence: "NONE",
      reason: "Text is not a question"
    };
  }

  const scores = {};

  // Initialize scores
  for (const subject in SUBJECT_DATA) {
    scores[subject] = {
      matched: new Set(),
      occurrences: 0,
      phraseCount: 0,
      multiWordMatches: 0
    };
  }

  // Match keywords and synonyms
  for (const subject in SUBJECT_DATA) {
    const { keywords = [], synonyms = {} } = SUBJECT_DATA[subject];

    // Check main keywords
    for (const keyword of keywords) {
      if (matchKeyword(cleaned, keyword)) {
        if (isStrongKeyword(keyword)) {
          scores[subject].matched.add(keyword);
          scores[subject].occurrences += countOccurrences(cleaned, keyword);
          
          const wordCount = keyword.split(" ").length;
          if (wordCount >= 2) {
            scores[subject].phraseCount++;
            scores[subject].multiWordMatches++;
          }
        }
      }
    }

    // Check synonyms
    for (const baseKeyword in synonyms) {
      const synonymList = synonyms[baseKeyword];
      
      for (const synonym of synonymList) {
        if (matchKeyword(cleaned, synonym)) {
          scores[subject].matched.add(baseKeyword);
          scores[subject].occurrences += countOccurrences(cleaned, synonym);
          
          const wordCount = baseKeyword.split(" ").length;
          if (wordCount >= 2) {
            scores[subject].phraseCount++;
            scores[subject].multiWordMatches++;
          }
        }
      }
    }
  }

  // Filter and rank
  const accepted = [];

  for (const subject in scores) {
    const info = scores[subject];
    const distinctCount = info.matched.size;

    if (
      distinctCount >= MIN_DISTINCT_KEYWORDS ||
      (distinctCount >= 1 && info.occurrences >= MIN_TOTAL_OCCURRENCES)
    ) {
      accepted.push({
        subject,
        confidence: info.phraseCount > 0 ? "HIGH" : "MEDIUM",
        matchedKeywords: Array.from(info.matched),
        occurrences: info.occurrences,
        multiWordMatches: info.multiWordMatches
      });
    }
  }

  if (!accepted.length) {
    const partialMatches = [];
    for (const subject in scores) {
      if (scores[subject].matched.size > 0) {
        partialMatches.push({
          subject,
          matched: Array.from(scores[subject].matched),
          occurrences: scores[subject].occurrences
        });
      }
    }

    return {
      subjects: ["No subject detected"],
      confidence: "NONE",
      reason: "No strong CS keywords found",
      debug: {
        cleanedText: cleaned.substring(0, 300),
        partialMatches: partialMatches.length > 0 ? partialMatches : "None"
      }
    };
  }

  // CRITICAL: Sort to prioritize actual multi-word phrase matches
  accepted.sort((a, b) => {
    // 1. Most important: Number of multi-word phrase matches
    if (b.multiWordMatches !== a.multiWordMatches) {
      return b.multiWordMatches - a.multiWordMatches;
    }

    // 2. Total occurrences
    if (b.occurrences !== a.occurrences) {
      return b.occurrences - a.occurrences;
    }

    // 3. Confidence level
    const confMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const confDiff = confMap[b.confidence] - confMap[a.confidence];
    if (confDiff !== 0) return confDiff;

    // 4. Number of distinct matches
    return b.matchedKeywords.length - a.matchedKeywords.length;
  });

  return {
    subjects: accepted.map(a => a.subject),
    primarySubject: accepted[0].subject,
    confidence: accepted[0].confidence,
    matchedKeywords: accepted[0].matchedKeywords,
    allMatches: accepted
  };
}

function detectSubject(text) {
  return detectSubjectDetailed(text).subjects;
}

module.exports = detectSubject;
module.exports.detailed = detectSubjectDetailed;