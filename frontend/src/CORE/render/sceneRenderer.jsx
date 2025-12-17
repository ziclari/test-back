import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScale } from "./useScale";
import { useSceneLoader } from "../config-parser/useSceneLoader";
import { BASE_WIDTH, BASE_HEIGHT } from "./constants";
import { animations } from "../animation-library/animations";
import { stateManager } from "../managers/stateManager";
import { onEvent } from "../events/eventBus";
import {UIController} from "./UIController";
import VideoModal from "../basic-elements/types/VideoModalElement";
import GroupElement from "../basic-elements/types/GroupElement";

export default function SceneRenderer({ initialScene }) {
  const scale = useScale(BASE_WIDTH, BASE_HEIGHT);
  const [slideIndex, setSlideIndex] = useState(stateManager.get("slideIndex"));
  const [activeElements, setActiveElements] = useState(stateManager.get("activeElements"));
  const [videoId, setVideoId] = useState(stateManager.get("videoId"));
  
  const { scene, error, isLoading, loadingProgress } = useSceneLoader(initialScene);
  
   // ---------------------------------------
  // 1. Conectar React al StateManager
  // ---------------------------------------
  useEffect(() => {
    const unsubSlide = onEvent("state:slideIndex:changed", setSlideIndex);
    const unsubActive = onEvent("state:activeElements:changed", setActiveElements);
    const unsubVideo = onEvent("state:videoId:changed", setVideoId);

    return () => {
      unsubSlide();
      unsubActive();
      unsubVideo();
    };
  }, []);

  // ---------------------------------------
  // 2. Inicializar UIController cuando cambie escena
  // ---------------------------------------
  useEffect(() => {
    if (!scene) return;

    stateManager.set("slideCount", scene.slides.length);
    UIController.applyVisibilityRules(scene);
    // Escucha cambios en custom state
    const unsubCustom = onEvent("custom:changed", () => {
      UIController.applyVisibilityRules(scene);
    });
    return () => {
      unsubCustom();
    };
  }, [scene]);

  const slide = scene?.slides?.[slideIndex];
  const videoData = videoId ? scene?.assets?.videos?.[videoId] : null;
  // ---------------------------------------
  // 3. Manejar acciones de elementos
  // ---------------------------------------
  const onAction = (a) => {UIController.execute(a, scene)}

  // ---------------------------------------
  // 4. Control de eventos declarados en YAML
  // ---------------------------------------
  useEffect(() => {
    if (!scene?.events) return;

    const unsubs = scene.events.map(evt =>
      onEvent(evt.on, async () => {
        const actions = Array.isArray(evt.do) ? evt.do : [evt.do];
        for (const act of actions) {
          await UIController.execute(act, scene);
        }
      })
    );

    return () => unsubs.forEach(u => u());
  }, [scene]);

  // ---------------------------------------
  // Render
  // ---------------------------------------
  // Pantalla de error
  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center p-10">
          <h2 className="text-2xl mb-4">Error al cargar la escena</h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Pantalla de carga
  if (isLoading || !scene) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-600">
              Cargando experiencia...
            </h2>
          </motion.div>

          {/* Barra de progreso */}
          <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-sky-700"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Renderizado normal cuando todo está cargado
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black overflow-hidden">
      <div
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          className="w-[1920px] h-[1080px] relative"
          style={{
            backgroundImage: `url(${
              scene.assetsIndex?.[slide?.background] ||
              slide?.background ||
              scene.assetsIndex?.[scene?.background] ||
              scene.background
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              {...(animations[slide?.animate] || animations.none)}
            >
            <GroupElement
              elements={slide.elements}
              assets={scene.assetsIndex}
              activeElements={activeElements}
              setActiveElements={setActiveElements}
              onAction={onAction}
            />
            </motion.div>
          </AnimatePresence>

          <VideoModal
            videoData={videoData}
            onClose={() => {
              UIController.execute(`emit:end:${videoId}`);
              stateManager.set("videoId", null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
