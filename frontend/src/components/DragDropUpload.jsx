import React, { useState } from "react";
import { Upload } from "lucide-react";
import axios from "axios";

const DragDropUpload = ({ uploadedImage, onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  // Send to backend
  const sendToBackend = async (base64) => {
    try {
      // remove the prefix "data:image/...;base64,"
      const cleanedBase64 = base64.split(",")[1];

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/ocr`, {
        imageBase64: cleanedBase64, // match backend
      });

      console.log("OCR Result (backend message):", response.data);
    } catch (error) {
      console.error("OCR Error:", error);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;

      // 1️⃣ Show preview in UI
      onImageUpload(base64);

      // 2️⃣ Send Base64 to backend
      sendToBackend(base64);
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="container my-1">
      <input
        type="file"
        id="file-upload"
        className="d-none"
        accept="image/*"
        onChange={handleFileInput}
      />

      <label
        htmlFor="file-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="d-flex flex-column justify-content-center align-items-center rounded-3 border border-2 text-center p-5"
        style={{
          cursor: "pointer",
          minHeight: "300px",
          borderStyle: "dotted",
          transition: "0.3s",
          transform: isDragging ? "scale(1.05)" : "scale(1)",
        }}
      >
        {uploadedImage ? (
          <img
            src={uploadedImage}
            alt="Uploaded"
            className="img-fluid rounded shadow"
            style={{ maxHeight: "500px" }}
          />
        ) : (
          <>
            <div
              className="mb-3 p-4 rounded-circle"
              style={{
                background: "linear-gradient(45deg, #6f42c1, #0d6efd)",
              }}
            >
              <Upload size={48} className="text-white" />
            </div>

            <h2 className="fw-bold mb-2">
              {isDragging ? "Drop your question here" : "Upload Question Image"}
            </h2>

            <p className="text-muted mb-1">Drag & drop or click to browse</p>
            <p className="text-muted small">Supports: JPG, PNG, JPEG</p>
          </>
        )}
      </label>

      {uploadedImage && (
        <div className="mt-3 text-center">
          <span className="text-success fw-bold me-3">✓ Uploaded</span>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => document.getElementById("file-upload").click()}
          >
            Upload Another Image
          </button>
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
