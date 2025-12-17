import { useState, useEffect } from "react";
import yaml from "js-yaml";
import { getPath } from "./getPath";
import { onEvent } from "../events/eventBus";
import { stateManager } from "../managers/stateManager";
import { extractAssets } from "../resources/extractAssets";
import { preloadAudio } from "../resources/preloadAudio";
import { preloadImage } from "../resources/preloadImage";
import { preloadVideo } from "../resources/preloadVideo";

export function useSceneLoader(initialScene) {
  const [currentSceneFile, setCurrentSceneFile] = useState(
    stateManager.get("currentSceneFile") || initialScene
  );

  const [slideIndex, setSlideIndex] = useState(
    stateManager.get("slideIndex") || 0
  );

  const [scene, setScene] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);

  // ----------------------------------------
  // SUBSCRIPCIÓN A STATE MANAGER
  // ----------------------------------------
  useEffect(() => {
    const unsubScene = onEvent("state:currentSceneFile:changed", file => {
      setCurrentSceneFile(file);
    });

    const unsubSlide = onEvent("state:slideIndex:changed", i => {
      setSlideIndex(i);
    });

    return () => {
      unsubScene();
      unsubSlide();
    };
  }, []);

  // ----------------------------------------
  // CARGA DE ESCENA (cuando cambia currentSceneFile)
  // ----------------------------------------
  useEffect(() => {
    let isCancelled = false;

    const loadScene = async () => {
      try {
        setIsLoading(true);
        setLoadingProgress(0);
        setError(null);

        // 1. YAML
        const realpath = getPath(currentSceneFile);
        const res = await fetch(realpath);
        const text = await res.text();
        const parsed = yaml.load(text);
        const sceneData = parsed?.scene || parsed;

        if (isCancelled) return;

        setLoadingProgress(10);

        // 2. Carga de assets
        const assets = extractAssets(sceneData);
        const totalAssets =
          assets.images.length + assets.audio.length + assets.videos.length;

        if (totalAssets === 0) {
          setScene(sceneData);
          setLoadingProgress(100);
          setIsLoading(false);
          return;
        }

        let loadedCount = 0;
        const update = () => {
          loadedCount++;
          const p = 10 + (loadedCount / totalAssets) * 90;
          setLoadingProgress(Math.round(p));
        };

        await Promise.all([
          ...assets.images.map(src => preloadImage(src).finally(update)),
          ...assets.audio.map(src => preloadAudio(src).finally(update)),
          ...assets.videos.map(src => preloadVideo(src).finally(update)),
        ]);

        if (isCancelled) return;

        sceneData.assetsIndex = assets.indexed;
        setScene(sceneData);
        setLoadingProgress(100);

        setTimeout(() => {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }, 200);

      } catch (err) {
        if (!isCancelled) setError(err.message);
        setIsLoading(false);
      }
    };
    if(currentSceneFile)
      loadScene();
    return () => (isCancelled = true);
  }, [currentSceneFile]);

  return {
    scene,
    slideIndex,
    currentSceneFile,
    isLoading,
    loadingProgress,
    error,
  };
}
