function containsDiagram(text) {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Diagram action keywords
  const diagramActions = [
    "draw", "sketch", "design", "construct",
    "illustrate", "show the diagram", "create diagram",
    "plot", "trace", "derive diagram"
  ];
  
  // Specific diagram types
  const diagramTypes = [
    "state transition diagram",
    "state diagram",
    "circuit diagram",
    "block diagram",
    "flowchart",
    "flow chart",
    "tree diagram",
    "er diagram",
    "entity relationship diagram",
    "dfa for",
    "nfa for",
    "design dfa",
    "design nfa",
    "construct dfa",
    "construct nfa",
    "construct pda",
    "pushdown automaton for",
    "turing machine for",
    "truth table",
    "k-map",
    "k map",
    "karnaugh map",
    "logic circuit",
    "timing diagram",
    "sequence diagram",
    "uml diagram",
    "class diagram",
    "use case diagram",
    "activity diagram",
    "network diagram",
    "topology diagram"
  ];
  
  // Check for very short text with diagram symbols
  const wordCount = lowerText.split(/\s+/).filter(w => w.length > 2).length;
  const hasDrawingSymbols = /[→←↑↓|─┼┌┐└┘▪▫●○■□]/.test(text);
  
  if (wordCount < 10 && hasDrawingSymbols) {
    return true; // Likely diagram labels only
  }
  
  // Check for diagram action keywords
  const hasDiagramAction = diagramActions.some(action => lowerText.includes(action));
  
  // Check for specific diagram types
  const hasDiagramType = diagramTypes.some(type => lowerText.includes(type));
  
  return hasDiagramAction || hasDiagramType;
}

module.exports = containsDiagram;