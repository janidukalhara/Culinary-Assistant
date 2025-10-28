
import React, { useState, useRef } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading, error }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary"></div>
      <p className="text-xl text-medium-text font-semibold">Analyzing your fridge...</p>
      <p className="text-subtle-text">The culinary AI is whipping up some ideas!</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto text-center p-8 bg-dark-card rounded-xl shadow-lg">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <h2 className="text-3xl font-bold mb-2 text-light-text">Ready to Cook?</h2>
          <p className="text-lg text-medium-text mb-6">Snap a photo of your fridge, and let's find your next meal.</p>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />

          <div
            onClick={handleUploadClick}
            className="w-full h-64 border-4 border-dashed border-dark-surface rounded-lg flex items-center justify-center cursor-pointer hover:border-brand-primary transition-colors duration-300 bg-dark-bg"
          >
            {preview ? (
              <img src={preview} alt="Fridge preview" className="w-full h-full object-cover rounded-md" />
            ) : (
              <div className="text-subtle-text">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Click to upload a photo
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageUploader;
