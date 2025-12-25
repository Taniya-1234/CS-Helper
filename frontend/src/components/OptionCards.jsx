import React, { useState } from "react";
import { Zap, BookOpen, FileText, Loader2, Download } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { jsPDF } from "jspdf";
import remarkGfm from "remark-gfm";
// import "jspdf-autotable";
import autoTable from "jspdf-autotable";

const OptionCards = ({ isActive, questionData, onUploadAnother }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);
  const { isDark } = useTheme();

  const options = [
    {
      id: "direct",
      icon: <Zap size={32} />,
      title: "Direct Answer",
      description: "Quick, straightforward answer with key points",
    },
    {
      id: "concept",
      icon: <BookOpen size={32} />,
      title: "Understand Concept",
      description: "Detailed explanation to help you learn thoroughly",
    },
    {
      id: "notes",
      icon: <FileText size={32} />,
      title: "Get Notes",
      description: "Exam-ready answer with PDF download",
    },
  ];

  const handleGetSolution = async () => {
    if (!selectedOption || !questionData) return;

    window.scrollTo({ top: 300, behavior: "smooth" });

    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionText: questionData.text,
          subject: questionData.subject,
          answerType: selectedOption,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate answer");
      }

      setAnswer(data);

      setTimeout(() => {
        document.getElementById("answer-container")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      console.error("Error fetching answer:", err);
      setError(err.message || "Failed to generate answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (optionId) => {
    setSelectedOption(optionId);
    setAnswer(null);
    setError(null);
  };

  const cleanMarkdown = (text) => {
    if (!text) return "";

    return (
      text
        .replace(
          /(\n|^)(\d+)\.\s*\n+\s*(\*\*[^*\n]+?\*\*|__[^\n]+__|[A-Z][^\n]+)/g,
          "$1$2. $3"
        )
        .replace(/^\d+\.\s*$/gm, "")
        // First add spacing before sub-questions BEFORE collapsing newlines
        .replace(/\n([A-D]\))/g, "\n\n\n\n\n$1")
        // Then collapse excessive newlines, but preserve our sub-question spacing
        .replace(/\n{6,}/g, "\n\n\n\n\n")
        .replace(/\n{3}(?![A-D]\))/g, "\n\n")
    );
  };

  const handleDownloadPDF = () => {
    if (!answer || !questionData) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      const checkPageBreak = (spaceNeeded = 15) => {
        if (yPosition > pageHeight - spaceNeeded - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Clean math notation for PDF
      const cleanMathForPDF = (text) => {
        return text
          .replace(/\$\$(.+?)\$\$/g, "$1")
          .replace(/\$(.+?)\$/g, "$1")
          .replace(/\\mathbf\{([^}]+)\}/g, "$1")
          .replace(/\\text\{([^}]+)\}/g, "$1")
          .replace(/\\in/g, "∈")
          .replace(/\\neq/g, "≠")
          .replace(/\\times/g, "×")
          .replace(/\\leq/g, "≤")
          .replace(/\\geq/g, "≥")
          .replace(/\\_/g, "_")
          .replace(/\\\\/g, "")
          .replace(/\{/g, "")
          .replace(/\}/g, "")
          .replace(/\*\*(.+?)\*\*/g, "$1");
      };

      const processLine = (line, nextLine) => {
        if (!line.trim()) {
          yPosition += 4;
          return;
        }

        const cleanedLine = cleanMathForPDF(line);
        // 🔴 Render markdown horizontal rule (---) as full-width line
        if (/^\s*---\s*$/.test(cleanedLine)) {
          checkPageBreak(10);

          doc.setDrawColor(0, 0, 0); // black line
          doc.setLineWidth(0.5);

          doc.line(
            margin, // left margin
            yPosition,
            pageWidth - margin, // right margin (same as table width)
            yPosition
          );

          yPosition += 10; // spacing after the line
          return;
        }


        if (/^[A-D]\)\s/.test(cleanedLine.trim())) {
          yPosition += 4;
          checkPageBreak(20);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");

          const wrappedHeading = doc.splitTextToSize(
            cleanedLine.trim(),
            maxWidth
          );

          wrappedHeading.forEach((line) => {
            checkPageBreak();
            doc.text(line, margin, yPosition);
            yPosition += 7;
          });

          yPosition += 3;
          return;
        }

        const colonMatch = cleanedLine.match(/^([^:]+):/);
        if (colonMatch && colonMatch[1].length < 50) {
          checkPageBreak();
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(colonMatch[1] + ":", margin, yPosition);
          yPosition += 7;

          const rest = cleanedLine.substring(colonMatch[0].length).trim();
          if (rest) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const restLines = doc.splitTextToSize(rest, maxWidth);
            restLines.forEach((l) => {
              checkPageBreak();
              doc.text(l, margin, yPosition);
              yPosition += 6;
            });
          }
          yPosition += 2;
          return;
        }

        if (/^[•\-\*○■▪]\s/.test(cleanedLine.trim())) {
          checkPageBreak();
          const bulletText = cleanedLine.trim().replace(/^[•\-\*○■▪]\s*/, "• ");
          const lines = doc.splitTextToSize(bulletText, maxWidth - 5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);

          lines.forEach((l, i) => {
            checkPageBreak();
            doc.text(l, i === 0 ? margin : margin + 5, yPosition);
            yPosition += 5.5;
          });
          yPosition += 1;
          return;
        }

        if (/^\d+\.\s/.test(cleanedLine.trim())) {
          checkPageBreak();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(cleanedLine.trim(), maxWidth);

          lines.forEach((l) => {
            checkPageBreak();
            doc.text(l, margin, yPosition);
            yPosition += 5.5;
          });
          yPosition += 1;
          return;
        }

        checkPageBreak();
        const lines = doc.splitTextToSize(cleanedLine.trim(), maxWidth);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        lines.forEach((l) => {
          checkPageBreak();
          doc.text(l, margin, yPosition);
          yPosition += 5.5;
        });
        yPosition += 2;
      };


      //  NORMALIZE PARAGRAPH TEXT TO USE FULL TABLE WIDTH
      const normalizedText = answer.answer
        // Join lines broken inside sentences
        .replace(/([a-z,])\n([a-z])/g, "$1 $2")
        // Keep real paragraph breaks
        .replace(/\n{2,}/g, "\n\n");

      const answerLines = normalizedText.split("\n");

      let i = 0;
      while (i < answerLines.length) {
        const line = answerLines[i].trim();

        // Detect markdown table
        if (
          line.startsWith("|") &&
          i + 1 < answerLines.length &&
          answerLines[i + 1].trim().startsWith("|---")
        ) {
          const tableLines = [];
          while (
            i < answerLines.length &&
            answerLines[i].trim().startsWith("|")
          ) {
            tableLines.push(answerLines[i].trim());
            i++;
          }

          const headers = tableLines[0]
            .split("|")
            .map((h) => h.trim())
            .filter(Boolean);

          const body = tableLines.slice(2).map((row) =>
            row
              .split("|")
              .map((cell) => cell.trim())
              .filter(Boolean)
          );

          checkPageBreak(30);

          autoTable(doc, {
            startY: yPosition,
            head: [
              headers.map((h) => h.replace(/\*\*/g, "")), // remove ** from header
            ],
            body: body.map(
              (row) => row.map((cell) => cell.replace(/\*\*/g, "")) // remove ** from body
            ),
            theme: "grid",

            styles: {
              font: "helvetica",
              fontSize: 10,
              textColor: [0, 0, 0], 
            },

            headStyles: {
              fillColor: [112, 112, 112], // gray color header
              textColor: [255, 255, 255],
              fontStyle: "bold",
            },

            columnStyles: {
              0: { fontStyle: "bold" }, 
            },

            margin: { left: margin, right: margin },
          });

          yPosition = doc.lastAutoTable.finalY + 10;
          continue;
        }

        const nextLine = answerLines[i + 1] || "";
        processLine(answerLines[i], nextLine);

        if (nextLine.trim() && /^[A-D]\)\s/.test(nextLine.trim())) {
          yPosition += 8;
        }

        i++;
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120, 120, 120);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
      }

      doc.setTextColor(0, 0, 0);
      doc.save(`Exam_Notes_${Date.now()}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="container mt-5">
      <h3 className="text-center fw-bold mb-4">Choose Your Learning Style</h3>

      {/* Option Cards */}
      <div className="row g-4 justify-content-center">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          let cardClass = "card p-4 w-100 text-center border-2 shadow-sm";

          if (!isActive) cardClass += " opacity-50";
          if (isSelected) {
            cardClass += isDark
              ? " selected-dark"
              : " border-primary bg-primary-subtle";
          }

          return (
            <div className="col-12 col-md-4" key={option.id}>
              <button
                className={cardClass}
                style={{
                  minHeight: "220px",
                  cursor: isActive ? "pointer" : "not-allowed",
                  transition: "all 0.3s ease",
                }}
                disabled={!isActive}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div className="mb-3">{option.icon}</div>
                <h5 className="fw-bold">{option.title}</h5>
                <p className="text-muted small">{option.description}</p>
                {isSelected && (
                  <div className="mt-3">
                    <span className="badge bg-primary fs-6">✓ Selected</span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Get Solution Button */}
      {isActive && selectedOption && !answer && (
        <div className="text-center mt-4">
          <button
            className="btn btn-primary btn-lg px-5 py-3"
            onClick={handleGetSolution}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2
                  size={20}
                  className="me-2"
                  style={{
                    display: "inline-block",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Loading...
              </>
            ) : (
              "Get Solution"
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger mt-4" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Answer Container */}
      {answer && (
        <div id="answer-container" className="mt-5">
          <div className="card p-4">
            <div className="card-body">

              {/* Answer with Math Rendering */}
              <div className="answer-text" style={{ textAlign: "left" }}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {cleanMarkdown(answer.answer)}
                </ReactMarkdown>
              </div>
            </div>

            <div className="card-footer bg-transparent border-0 text-center pt-4">
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                {selectedOption === "notes" && (
                  <button
                    className="btn btn-success d-flex align-items-center gap-2"
                    onClick={handleDownloadPDF}
                  >
                    <Download size={18} />
                    Download as PDF
                  </button>
                )}
                <button
                  className="btn btn-outline-primary"
                  onClick={onUploadAnother}
                >
                  Upload Another Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OptionCards;
