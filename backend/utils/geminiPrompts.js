const prompts = {
  /**
   * DIRECT ANSWER - Straightforward, bullet points, no extra explanation
   */
  direct: (question, subject) => `
You are providing a quick, straightforward answer for a ${subject} question.

**IMPORTANT INSTRUCTION:**
If the question has multiple parts (like A, B, C), you MUST answer ALL parts. Do not skip any part.
After completing each sub-question answer, add a horizontal line: ---------
DO NOT add a horizontal line after the last sub-question.

**Requirements:**
- Very brief and to-the-point
- Use bullet points or short paragraphs
- No lengthy explanations
- Length: 100-150 words per sub-question
- Focus only on the key facts/points
- No introduction like "Let me explain..." - just answer directly

**Question:**
${question}

**Direct Answer:**`,

  /**
   * UNDERSTAND CONCEPT - Detailed teaching, but NO "welcome class" talk
   */
  concept: (question, subject) => `
You are explaining a ${subject} concept in detail to help students understand thoroughly.
After completing each sub-question answer, add a horizontal line: ---------
DO NOT add a horizontal line after the last sub-question.

**IMPORTANT INSTRUCTION:**
If the question has multiple parts (like A, B, C), you MUST answer ALL parts in detail. Do not skip any part.

**Requirements:**
- Start DIRECTLY with the explanation - no "Hello students" or "Welcome class"
- Break down the concept clearly with proper structure
- Use examples and real-world applications
- Explain WHY and HOW, not just WHAT
- Use **bold** for key terms
- Length: 300-500 words per sub-question
- Make it educational but direct - get straight to the point

**WRONG START:** "All right class, welcome! Today we're going to..."
**CORRECT START:** "Cloud computing provides significant advantages..."

**Question:**
${question}

**Concept Explanation:**`,

  /**
   * GET NOTES - University exam format (6-mark question)
   */
  notes: (question, subject) => `
You are writing model answers for university exam questions in ${subject}. These will be downloaded as PDF study notes.

**CRITICAL INSTRUCTIONS:**
1. If the question has multiple parts (like A, B, C), answer ALL parts. Each part is a separate 6-mark question.
2. DO NOT include the question text itself - start directly with answers
3. Each sub-question answer should be 250-350 words (suitable for 6 marks)
4. Write EXACTLY as a student would write in an exam answer sheet
// 5. After completing each sub-question answer, add a horizontal line that covers the full width of the page
// 6. DO NOT add a horizontal line after the last sub-question

**Answer Format for Each Part:**

[Letter]) [Brief topic/title if helpful]

[Start with definition or introduction - 1-2 lines]

**[Key Point 1]:** [Explanation]
**[Key Point 2]:** [Explanation]
**[Key Point 3]:** [Explanation]

[Include 2-3 examples with real-world applications]

[Brief conclusion if needed - 1 line]

---

**Formatting Guidelines:**
- Use **bold** for important terms, headings, and key concepts
- Use bullet points (•) or numbered lists for clarity
- Keep paragraphs short (2-3 sentences max)
- Include examples with real services (AWS S3, MongoDB, etc.)
- Make it scannable - students should spot key points quickly



**TABLE FORMAT FOR COMPARISONS:**
When comparing concepts (e.g., "Compare X vs Y", "Difference between A and B", "Distinguish between"), you MUST present the comparison as a proper Markdown table:

| Feature/Aspect | Concept A | Concept B |
|----------------|-----------|-----------|
| Definition     | ...       | ...       |
| Key Feature 1  | ...       | ...       |
| Key Feature 2  | ...       | ...       |
| Example        | ...       | ...       |

After the table, add 1-2 paragraphs explaining when to use each concept.

**Example of Good Format:**

A) Cloud Storage SLA & Durability

A cloud storage SLA is a formal agreement between provider and customer defining guaranteed service levels, including uptime, durability, and performance metrics.

**Primary Types:**
• **Object Storage:** Unstructured data storage (AWS S3, Azure Blob)
• **Block Storage:** Raw volumes for databases (AWS EBS)  
• **File Storage:** Shared file systems (AWS EFS, Azure Files)

**Durability Mechanisms:**
• **Data Replication:** Multiple copies across zones
• **Erasure Coding:** Fragments with parity for reconstruction
• **Checksums:** Regular integrity verification
• **Geographic Distribution:** Multi-region redundancy

Example: AWS S3 offers 99.999999999% (11 nines) durability through automatic replication.

---

**Question:**
${question}

**Exam Answers:**`,
};

module.exports = { prompts };

