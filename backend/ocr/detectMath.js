function containsHeavyMath(text) {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // COMPLEX Math symbols that Tesseract struggles with
  const complexMathSymbols = /[∑∏∫∂√∞≈≠≤≥±×÷]/;
  
  // LaTeX notation (indicates complex math)
  const latexPattern = /\\frac|\\sqrt|\\sum|\\int|\\partial|\\lim|\\prod/;
  
  // Matrix patterns (complex for OCR)
  const matrixPattern = /\[\s*\[.*\].*\[.*\]\s*\]|\d+\s*[x×]\s*\d+\s*matrix/i;
  
  // Pure mathematics terms (NOT CS-related)
  const pureMathTerms = [
    "determinant", "eigenvalue", "eigenvector",
    "derivative", "integral", "differential equation",
    "partial derivative", "gradient vector",
    "laplace transform", "fourier transform",
    "inverse matrix", "transpose matrix",
    "matrix multiplication", "row echelon",
    "linear algebra", "calculus problem",
    "trigonometric", "logarithmic",
    "exponential equation",
    "probability distribution function",
    "variance calculation", "standard deviation calculation",
    "k-map minimization", "karnaugh map",
    "boolean minimization", "truth table minimization"
  ];
  
  // Check for SIMPLE CS math (these are ALLOWED)
  const simpleMathTerms = [
    "time complexity", "space complexity",
    "o(n)", "o(log n)", "o(n^2)", "o(1)",
    "big o", "theta", "omega",
    "array", "sorting", "searching",
    "merge sort", "quick sort", "binary search",
    "recursion", "iteration",
    "graph traversal", "tree traversal"
  ];
  
  // If contains simple CS math terms, it's probably okay
  const hasSimpleMath = simpleMathTerms.some(term => lowerText.includes(term));
  if (hasSimpleMath && !complexMathSymbols.test(text)) {
    return false; // Simple CS math - ALLOW
  }
  
  // Check for complex patterns
  if (complexMathSymbols.test(text)) return true;
  if (latexPattern.test(text)) return true;
  if (matrixPattern.test(text)) return true;
  
  // Check for pure math terms
  const hasPureMath = pureMathTerms.some(term => lowerText.includes(term));
  
  return hasPureMath;
}

module.exports = containsHeavyMath;