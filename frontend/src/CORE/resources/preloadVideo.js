import { getPath } from "../config-parser/getPath";
export const preloadVideo = (srcRel) => {
    const src = getPath(srcRel);
    return new Promise((resolve) => {
      if (!src) {
        resolve();
        return;
      }
  
      // Google Drive: NO precargar (no funciona con iframes)
      if (srcRel.includes("drive.google.com") || srcRel.includes("preview")) {
        console.log(
          `Video de Google Drive detectado, omitiendo precarga: ${srcRel}`
        );
        resolve(srcRel);
        return;
      }
  
      // Videos locales o de otros servidores
      const video = document.createElement("video");
  
      const timeout = setTimeout(() => {
        console.warn(`Timeout cargando video: ${src}`);
        resolve(src);
      }, 15000);
  
      video.oncanplaythrough = () => {
        clearTimeout(timeout);
        resolve(src);
      };
  
      video.onerror = () => {
        clearTimeout(timeout);
        console.warn(`Error cargando video: ${src}`);
        resolve(src);
      };
  
      video.src = src;
      video.load();
    });
  };