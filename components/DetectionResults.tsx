import React from 'react';
import { DetectionResult } from '../types';

interface DetectionResultsProps {
  result: DetectionResult;
}

const DetectionResults: React.FC<DetectionResultsProps> = ({ result }) => {
  return (
    <section className="bg-dark-card rounded-xl shadow-lg p-5 md:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-xl font-bold text-light-text">YOLO Detection Result</h2>
              <p className="text-sm text-subtle-text">
                {result.model} · {result.mode} mode · {result.inferenceMs.toFixed(0)} ms
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/20 text-brand-primary">
              {result.detections.length} objects
            </span>
          </div>

          {result.annotatedImage ? (
            <img
              src={result.annotatedImage}
              alt="YOLO ingredient detections with bounding boxes"
              className="w-full rounded-lg border border-dark-surface object-contain max-h-[420px] bg-dark-bg"
            />
          ) : (
            <div className="rounded-lg border border-dark-surface p-6 text-subtle-text text-center">
              Annotated image is not available.
            </div>
          )}
        </div>

        <div className="lg:w-1/2">
          <h3 className="text-lg font-semibold text-light-text mb-3">Detected Ingredients</h3>
          <div className="flex flex-wrap gap-2 mb-5">
            {result.ingredients.length > 0 ? (
              result.ingredients.map((ingredient) => (
                <span
                  key={ingredient}
                  className="px-3 py-1.5 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-sm font-medium"
                >
                  {ingredient}
                </span>
              ))
            ) : (
              <p className="text-subtle-text">No supported food ingredients were detected.</p>
            )}
          </div>

          <h3 className="text-lg font-semibold text-light-text mb-3">Object Confidence</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {result.detections.map((detection, index) => (
              <div
                key={`${detection.className}-${index}`}
                className="flex items-center justify-between gap-4 bg-dark-bg rounded-lg px-3 py-2"
              >
                <span className="text-medium-text capitalize">{detection.className}</span>
                <span className="text-sm font-semibold text-light-text">
                  {(detection.confidence * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DetectionResults;
