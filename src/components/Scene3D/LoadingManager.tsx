import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { getGlobalLoadingProgress, addGlobalLoadingListener } from "./utils";

interface LoadingManagerProps {
  onLoadingComplete: (loaded: boolean) => void;
  children: React.ReactNode;
}

interface LoadingConfig {
  minimumLoadTime: number;
  completionDelay: number;
  showDetails: boolean;
  debug: boolean;
}

const defaultConfig: LoadingConfig = {
  minimumLoadTime: 200, // Very minimal to just prevent jarring flash
  completionDelay: 50,  // Almost instant
  showDetails: true,
  debug: false,
};

export function LoadingManager({ onLoadingComplete, children }: LoadingManagerProps) {
  const dreiProgress = useProgress();
  const [globalProgress, setGlobalProgress] = useState(getGlobalLoadingProgress());
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [forceShow, setForceShow] = useState(true); // Force show initially

  // Listen for global loading state changes
  useEffect(() => {
    const unsubscribe = addGlobalLoadingListener(() => {
      const newProgress = getGlobalLoadingProgress();
      setGlobalProgress(newProgress);
      if (defaultConfig.debug) {
        console.log('Global loading progress:', newProgress);
      }
    });
    return unsubscribe;
  }, []);

  const totalAssets = globalProgress.total + dreiProgress.total;
  const loadedAssets = globalProgress.loaded + dreiProgress.loaded;
  const progress = totalAssets > 0 ? (loadedAssets / totalAssets) * 100 : 0;
  const isLoading = (totalAssets === 0 && globalProgress.total === 0) || 
                    loadedAssets < totalAssets || 
                    dreiProgress.active ||
                    globalProgress.isLoading;

  // Force hide the initial loading screen after models start loading
  useEffect(() => {
    if (globalProgress.total > 0) {
      setForceShow(false);
      if (defaultConfig.debug) {
        console.log('Models detected, stopping force show');
      }
    }
  }, [globalProgress.total]);

  useEffect(() => {
    if (defaultConfig.debug) {
      console.log('Loading state:', {
        totalAssets,
        loadedAssets, 
        progress,
        isLoading,
        globalProgress,
        dreiProgress: { active: dreiProgress.active, total: dreiProgress.total, loaded: dreiProgress.loaded }
      });
    }

    // Show loading screen immediately if we have models to load
    if (globalProgress.total > 0 && progress >= 100 && !dreiProgress.active) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, defaultConfig.minimumLoadTime - elapsedTime);
      
      if (defaultConfig.debug) {
        console.log('Completing loading...', { elapsedTime, remainingTime });
      }
      
      const timer = setTimeout(() => {
        setIsComplete(true);
        onLoadingComplete(true);
        if (defaultConfig.debug) {
          console.log('Loading complete!');
        }
      }, remainingTime + defaultConfig.completionDelay);
      
      return () => clearTimeout(timer);
    }
  }, [progress, globalProgress.total, dreiProgress.active, startTime, onLoadingComplete, totalAssets, loadedAssets, isLoading, globalProgress, dreiProgress]);

  const shouldShowLoading = (forceShow || globalProgress.total > 0 || dreiProgress.total > 0) && 
                           (isLoading || !isComplete);

  if (defaultConfig.debug) {
    console.log('Should show loading:', shouldShowLoading, { forceShow, isLoading, isComplete });
  }

  return (
    <>
      {children}
      {shouldShowLoading && (
        <LoadingProgress 
          progress={Math.min(progress, 100)}
          loaded={loadedAssets}
          total={Math.max(totalAssets, 1)} // Ensure at least 1 for initial display
          item={dreiProgress.item || "3D Models"}
          errors={dreiProgress.errors}
          config={defaultConfig}
        />
      )}
    </>
  );
}

interface LoadingProgressProps {
  progress: number;
  loaded: number;
  total: number;
  item: string;
  errors: string[];
  config: LoadingConfig;
}

function LoadingProgress({ progress, loaded, total, item, errors, config }: LoadingProgressProps) {
  if (config.debug) {
    console.log('Rendering loading progress:', { progress, loaded, total });
  }

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-content">
          <h2 className="loading-title">Loading Experience</h2>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="progress-text">
              {Math.round(Math.min(progress, 100))}%
            </div>
          </div>
          
          {config.showDetails && total > 0 && (
            <div className="loading-details">
              <div className="assets-count">
                {loaded} / {total} assets loaded
              </div>
              {item && (
                <div className="current-item">
                  Loading: {item.split('/').pop()}
                </div>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className="loading-errors">
              {errors.map((error, index) => (
                <div key={index} className="error-item">
                  Error: {error}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}