import { useEffect, useState } from "react";
import "./LoadingScreen.css";

interface LoadingScreenProps {
  progress: number;
  isComplete: boolean;
}

export const LoadingScreen = ({ progress, isComplete }: LoadingScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isComplete) {
      // Start fade out animation
      setFadeOut(true);
    }
  }, [isComplete]);

  if (isComplete && fadeOut) {
    // Remove from DOM after fade animation
    setTimeout(() => {
      const loadingEl = document.getElementById("loading-screen");
      if (loadingEl) {
        loadingEl.style.display = "none";
      }
    }, 500);
  }

  return (
    <div
      id="loading-screen"
      className={`loading-screen ${fadeOut ? "fade-out" : ""}`}
    >
      <div className="loading-content">
        <div className="earth-icon">🌍</div>
        <h1 className="loading-title">Loading Earth</h1>
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>
        <p className="loading-subtitle">Preparing high-resolution textures...</p>
      </div>
    </div>
  );
};
