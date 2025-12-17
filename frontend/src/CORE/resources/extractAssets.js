import { getPath } from "../config-parser/getPath";
// Extrae todos los recursos del scene
export const extractAssets = (scene) => {
    const all = scene.assets || {};
    const indexed = {};
    const grouped = { images: [], audio: [], videos: [] };
  
    const register = (group, type) => {
      if (!group) return;
      for (const [key, val] of Object.entries(group)) {
        if (getPath(val?.src)) {
          indexed[key] = getPath(val?.src);
          grouped[type].push(getPath(val?.src));
        }
      }
    };
  
    register(all.images, "images");
    register(all.audios, "audio");
    register(all.videos, "videos");
  
    return { indexed, ...grouped };
  };
  