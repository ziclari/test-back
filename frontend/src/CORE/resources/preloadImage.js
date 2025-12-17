import { getPath } from "../config-parser/getPath";
// Función para precargar una imagen
export const preloadImage = (srcRel) => {
    const src = getPath(srcRel);
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve();
        return;
      }
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error(`Error cargando imagen: ${src}`));
      img.src = src;
    });
  };