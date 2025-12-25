import React, { useState } from 'react';
import HeroSection from '../components/HeroSection';
import DragDropUpload from '../components/DragDropUpload';
import OptionCards from '../components/OptionCards';
import axios from 'axios';

const HomePage = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionData, setQuestionData] = useState(null);
  const [error, setError] = useState(null);

  // Handle image upload and OCR processing
  const handleImageUpload = async (base64Image) => {
    setUploadedImage(base64Image);
    setQuestionData(null);
    setError(null);
    setIsProcessing(true);

    try {
      // Remove "data:image/...;base64," prefix
      const cleanedBase64 = base64Image.split(',')[1];

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/ocr`, {
        imageBase64: cleanedBase64,
      });

      if (!response.data.success) {
        // Validation failed - show error
        setError(response.data);
        setUploadedImage(null);
        return;
      }

      // Success! Store question data (but don't display validation card)
      setQuestionData(response.data.data);

    } catch (err) {
      console.error('OCR Error:', err);
      setError({
        error: 'ERROR',
        message: 'Upload another image to get started',
        // suggestion: "Please make sure the backend is running on port 5000",
      });
      setUploadedImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset everything properly
  const handleUploadAnother = () => {
    setUploadedImage(null);
    setQuestionData(null);
    setError(null);
    setIsProcessing(false);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <HeroSection />

        {/* Image Upload - Always visible */}
        <DragDropUpload 
          uploadedImage={uploadedImage} 
          onImageUpload={handleImageUpload} 
        />

        {/* Loading State - Show while validating */}
        {isProcessing && (
          <div className="text-center mt-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Processing...</span>
            </div>
            <p className="mt-2 text-muted">Validating your question...</p>
          </div>
        )}

        {/* Error Display - Only show when validation fails */}
        {error && !isProcessing && (
          <div className="alert alert-danger mt-4" role="alert">
            <p className="mb-2">{error.message}</p>
            {error.details && <p className="small mb-2">{error.details}</p>}
            {error.suggestion && (
              <p className="small mb-0">
                {error.suggestion}
              </p>
            )}
            <button 
              className="btn btn-primary btn-sm mt-3" 
              onClick={handleUploadAnother}
            >
              Upload Another Image
            </button>
          </div>
        )}

        {/* Option Cards - Show when question is validated (no error) */}
        <OptionCards 
          isActive={!!questionData && !error && !isProcessing} 
          questionData={questionData}
          onUploadAnother={handleUploadAnother}
        />
      </div>
    </div>
  );
};

export default HomePage;