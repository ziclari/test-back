// CORE/logic/sceneLogic.js
export function resolveInitialScene(manifest, assignments = []) {
    const start = manifest.meta.startScene;
    const scene = manifest.scenes.find(s => s.id === start);
  
    if (!scene) throw new Error(`startScene "${start}" no encontrado`);
  
    const shouldSkip = (scene.skipIf || []).some(cond => {
      if (cond === "user_has_any_phase_progress") {
        return assignments.length > 0;
      }
      return false;
    });
  
    if (shouldSkip && scene.next) {
      const next = manifest.scenes.find(s => s.id === scene.next);
      if (!next) throw new Error(`Escena next "${scene.next}" no encontrada`);
      return next.file;
    }
  
    return scene.file;
  }
  