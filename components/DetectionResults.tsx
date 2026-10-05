import React from "react";
import { DetectionResult } from "../types";
import Icon from "./Icon";
export default function DetectionResults({
  result,
}: {
  result: DetectionResult;
}) {
  return (
    <section className="detection-panel">
      <div className="detection-image">
        {result.annotatedImage ? (
          <img
            src={result.annotatedImage}
            alt="Your ingredients identified by YOLO, with bounding boxes"
          />
        ) : (
          <div className="empty-state">
            <Icon name="scan" />
            <p>Annotated image unavailable.</p>
          </div>
        )}
        <span className="detection-badge">
          <Icon name="check" /> Scan complete · {result.detections.length}{" "}
          objects
        </span>
      </div>
      <div className="detection-copy">
        <span className="eyebrow">LOOK WHAT WE FOUND</span>
        <h2>A fridge full of potential.</h2>
        <p>
          Here’s your starting point. Check that these ingredients match what
          you have.
        </p>
        <div className="ingredient-chips">
          {result.ingredients.length ? (
            result.ingredients.map((ingredient) => (
              <span key={ingredient}>
                <Icon name="check" />
                {ingredient}
              </span>
            ))
          ) : (
            <p>
              No supported ingredients found. Try a clearer photo with items
              more visible.
            </p>
          )}
        </div>
        <details className="detection-details">
          <summary>
            View detection details{" "}
            <span>{result.inferenceMs.toFixed(0)} ms</span>
          </summary>
          <p>
            {result.model} · {result.mode} mode
          </p>
          <div className="confidence-list">
            {result.detections.map((item, index) => (
              <div key={`${item.className}-${index}`}>
                <div>
                  <span>{item.className}</span>
                  <strong>{(item.confidence * 100).toFixed(1)}%</strong>
                </div>
                <div className="confidence-track">
                  <span
                    style={{
                      width: `${Math.min(100, Math.max(0, item.confidence * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
