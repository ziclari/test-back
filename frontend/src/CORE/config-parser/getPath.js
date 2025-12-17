const CDN_BASE = import.meta.env.VITE_CONTENT_CDN; 
// Debe ser SIEMPRE una URL válida absoluta y terminada sin ID
// Ejemplo correcto: "http://simulador...amazonaws.com/simuladores"

export const getSimulatorBasePath = () => {
  const id = window.location.pathname.split("/")[1] || "default";

  // Normaliza: elimina barra final de CDN_BASE y agrega /
  const cleanBase = CDN_BASE.replace(/\/$/, ""); 

  return `${cleanBase}/${id}/`;
};

export const getPath = (currentFile) => {
  const base = getSimulatorBasePath();

  // Debe ser SIEMPRE absoluta, y base debe terminar en /
  return new URL(currentFile, base).href;
};

export const getStorageKey = () => {
  const id = window.location.pathname.split("/")[1] || "default";
  return `simulator_state_${id}`;
};
