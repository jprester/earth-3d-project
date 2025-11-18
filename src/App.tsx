import { useEffect, useRef, useState } from "react";
import { initThreeScene } from "./threeScene";
import { LoadingScreen } from "./components/LoadingScreen";
import "./App.css";

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene with loading callbacks
    const cleanup = initThreeScene(
      canvasRef.current,
      (progress) => setLoadingProgress(progress),
      () => setIsLoadingComplete(true)
    );

    // Return cleanup function
    return cleanup;
  }, []);

  return (
    <>
      <LoadingScreen
        progress={loadingProgress}
        isComplete={isLoadingComplete}
      />
      <div
        ref={canvasRef}
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      />
    </>
  );
}

export default App;
