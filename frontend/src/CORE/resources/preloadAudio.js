import { getPath } from "../config-parser/getPath";
// Función para precargar audio
export const preloadAudio = (srcRel) => {
    const src = getPath(srcRel);
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve();
        return;
      }
      const audio = new Audio();
  
      // Timeout para evitar que se quede colgado
      const timeout = setTimeout(() => {
        console.warn(`Timeout cargando audio: ${src}`);
        resolve(src); // Resolver de todos modos
      }, 10000); // 10 segundos máximo
  
      audio.oncanplaythrough = () => {
        clearTimeout(timeout);
        resolve(src);
      };
  
      audio.onerror = () => {
        clearTimeout(timeout);
        console.warn(`Error cargando audio: ${src}`);
        resolve(src); // Resolver en lugar de rechazar para no bloquear
      };
  
      audio.src = src;
      audio.load();
    });
  };