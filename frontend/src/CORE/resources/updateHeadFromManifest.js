import { getPath } from "../config-parser/getPath";

// CORE/dom/updateHeadFromManifest.js
export function updateHeadFromManifest(meta) {
    if (!meta) return;
  
    // Title
    if (meta.name) {
      document.title = meta.name;
    }
  
    // Description
    if (meta.description) {
      let desc = document.querySelector('meta[name="description"]');
      if (!desc) {
        desc = document.createElement("meta");
        desc.name = "description";
        document.head.appendChild(desc);
      }
      desc.content = meta.description;
    }
  
    // Favicon / Icon
    if (meta.icon || meta.favicon) {
      const iconUrl = getPath(meta.icon || meta.favicon);
  
      let link =
        document.querySelector('link[rel="icon"]') ||
        document.querySelector('link[rel="shortcut icon"]');
  
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
  
      // Usa tu getPath para rutas relativas desde manifest
      link.href = iconUrl;
    }
  
    // PWA meta theme-color (opcional)
    if (meta.themeColor) {
      let theme = document.querySelector('meta[name="theme-color"]');
      if (!theme) {
        theme = document.createElement("meta");
        theme.name = "theme-color";
        document.head.appendChild(theme);
      }
      theme.content = meta.themeColor;
    }
  }
  