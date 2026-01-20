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

    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const init = async () => {
      try {
        // Initialize Three.js scene with loading callbacks
        const cleanupFn = await initThreeScene(
          canvasRef.current!,
          (progress) => {
            if (isMounted) setLoadingProgress(progress);
          },
          () => {
            if (isMounted) setIsLoadingComplete(true);
          }
        );

        if (isMounted) {
          cleanup = cleanupFn;
        } else {
          // Component unmounted during initialization, cleanup immediately
          cleanupFn();
        }
      } catch (error) {
        console.error("Failed to initialize scene:", error);
      }
    };

    init();

    // Return cleanup function
    return () => {
      isMounted = false;
      if (cleanup) {
        cleanup();
      }
    };
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
