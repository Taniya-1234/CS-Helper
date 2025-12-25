import React, { useState } from "react";
import axios from "axios";
import DragDropUpload from "../components/DragDropUpload";
import OptionCards from "../components/OptionCards";

const OcrPage = () => {
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Answer generation states
  const [selectedOption, setSelectedOption] = useState(null);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [answer, setAnswer] = useState(null);

  // Handle image upload from DragDropUpload component
  const handleImageUpload = async (base64Image) => {
    setImageBase64(base64Image);
    setOcrResult(null);
    setError(null);
    setAnswer(null);
    setSelectedOption(null);

    // Automatically start OCR processing
    await processOCR(base64Image);
  };

  // Process OCR + Validation
  const processOCR = async (base64Image) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/ocr`, {
        imageBase64: base64Image,
      });

      if (!response.data.success) {
        // Validation failed
        setError(response.data);
        return;
      }

      // Success! Store validated question data
      setOcrResult(response.data.data);

    } catch (err) {
      console.error("OCR Error:", err);
      setError({
        error: "ERROR",
        message: "Upload another image to get started",
        // suggestion: "Please make sure the backend is running on port 5000",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle option selection from OptionCards
  const handleOptionSelect = (optionId) => {
    setSelectedOption(optionId);
    setAnswer(null); // Clear previous answer
  };

  // Handle "Get Solution" button click
  const handleGetSolution = async () => {
    if (!selectedOption || !ocrResult) return;

    setGeneratingAnswer(true);
    setError(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/answer`, {
        questionText: ocrResult.text,
        subject: ocrResult.subject,
        answerType: selectedOption, // 'direct', 'concept', or 'notes'
      });

      if (!response.data.success) {
        setError({
          error: "ANSWER_ERROR",
          message: response.data.error || "Failed to generate answer",
          suggestion: "Please try again or select a different answer type",
        });
        return;
      }

      // Success! Display the answer
      setAnswer(response.data);

    } catch (err) {
      console.error("Answer Generation Error:", err);
      setError({
        error: "NETWORK_ERROR",
        message: "Failed to generate answer",
        suggestion: "Please check your connection and try again",
      });
    } finally {
      setGeneratingAnswer(false);
    }
  };

  // Reset everything
  const handleReset = () => {
    setImageBase64(null);
    setOcrResult(null);
    setError(null);
    setAnswer(null);
    setSelectedOption(null);
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-3 fw-bold">CS Helper - OCR Reader</h1>

      {/* DRAG DROP UPLOAD */}
      {!imageBase64 && (
        <DragDropUpload
          uploadedImage={imageBase64}
          onImageUpload={handleImageUpload}
        />
      )}

      {/* IMAGE PREVIEW (while processing) */}
      {imageBase64 && loading && (
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Processing image and validating question...</p>
        </div>
      )}

      {/* ERROR DISPLAY */}
      {error && (
        <div className="alert alert-danger mt-4" role="alert">
          <h5 className="alert-heading">
            {error.error === "DIAGRAM_DETECTED" && "📊 Diagram Detected"}
            {error.error === "NOT_CS_DOMAIN" && "❌ Not a CS Question"}
            {error.error === "COMPLEX_MATH" && "🔢 Complex Math Detected"}
            {error.error === "INSUFFICIENT_TEXT" && "📝 Insufficient Text"}
            {error.error === "OCR_FAILED" && "⚠️ OCR Failed"}
            {error.error === "NETWORK_ERROR" && "🌐 Connection Error"}
            {error.error === "ANSWER_ERROR" && "❌ Answer Generation Failed"}
          </h5>
          <p className="mb-2">{error.message}</p>
          {error.details && <p className="small mb-2">{error.details}</p>}
          {error.suggestion && (
            <p className="small mb-0">
              <strong>💡 Suggestion:</strong> {error.suggestion}
            </p>
          )}
          {error.examples && (
            <div className="mt-3">
              <strong>Try questions like:</strong>
              <ul className="small">
                {error.examples.map((example, idx) => (
                  <li key={idx}>{example}</li>
                ))}
              </ul>
            </div>
          )}
          <button className="btn btn-primary btn-sm mt-3" onClick={handleReset}>
            Try Another Question
          </button>
        </div>
      )}

      {/* QUESTION VALIDATED - SHOW DETAILS */}
      {ocrResult && !error && (
        <div className="card mt-4 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="text-success mb-0">✅ Question Validated!</h4>
              <button className="btn btn-outline-primary btn-sm" onClick={handleReset}>
                Upload New Question
              </button>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <span className="badge bg-primary fs-6">
                  📚 {ocrResult.subject}
                </span>
              </div>
              <div className="col-md-4">
                <span className="badge bg-success fs-6">
                  🎯 Confidence: {ocrResult.confidence}
                </span>
              </div>
              <div className="col-md-4">
                <span className="badge bg-info fs-6">
                  📝 {ocrResult.wordCount} words
                </span>
              </div>
            </div>

            <div className="alert alert-light border">
              <strong>Question:</strong>
              <p className="mb-0 mt-2">{ocrResult.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* OPTION CARDS - ANSWER TYPE SELECTION */}
      {ocrResult && !error && !answer && (
        <div className="mt-4">
          <OptionCards
            isActive={true}
            selectedOption={selectedOption}
            onOptionSelect={handleOptionSelect}
          />

          {/* GET SOLUTION BUTTON */}
          {selectedOption && (
            <div className="text-center mt-4">
              <button
                className="btn btn-primary btn-lg px-5 py-3"
                onClick={handleGetSolution}
                disabled={generatingAnswer}
              >
                {generatingAnswer ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Generating Answer...
                  </>
                ) : (
                  "Get Solution"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ANSWER DISPLAY */}
      {answer && (
        <div className="card mt-4 shadow-lg border-primary">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">🎓 Your Answer</h4>
              <div>
                <span className="badge bg-light text-dark me-2">
                  {selectedOption === "direct" && "📝 Direct Answer"}
                  {selectedOption === "concept" && "🎓 Concept Explanation"}
                  {selectedOption === "notes" && "📚 Exam Notes"}
                </span>
                <span
                  className={`badge ${
                    answer.source === "database" ? "bg-success" : "bg-info"
                  }`}
                >
                  {answer.source === "database"
                    ? "💾 From Cache"
                    : "🤖 AI Generated"}
                </span>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div
              className="answer-content p-4 bg-light rounded"
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.8",
                fontSize: "1.05rem",
              }}
            >
              {answer.answer}
            </div>

            <div className="d-flex gap-3 mt-4 justify-content-center">
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  setAnswer(null);
                  setSelectedOption(null);
                }}
              >
                Try Different Answer Type
              </button>
              <button className="btn btn-primary" onClick={handleReset}>
                Solve New Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OcrPage;